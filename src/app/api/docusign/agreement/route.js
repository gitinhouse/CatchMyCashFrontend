export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import docusign from 'docusign-esign';
import { PDFDocument } from 'pdf-lib';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  fromIni,
  fromNodeProviderChain,
} from '@aws-sdk/credential-providers';
import connectToDatabase from '../../../lib/mongodb';
import UserDocs from '../../../models/userDocs';
import UserDetails from '../../../models/userDetails';

const isProduction = process.env.NODE_ENV === 'production';

function getAgreementS3Config() {
  const bucket = process.env.AGREEMENT_BUCKET_NAME;
  const region = process.env.AGREEMENT_AWS_REGION || 'eu-central-1';

  if (!bucket) {
    throw new Error('AGREEMENT_BUCKET_NAME is not configured');
  }

  return { bucket, region };
}

function createAgreementS3Client(region) {
  return new S3Client({
    region,
    credentials: isProduction
      ? fromNodeProviderChain()
      : fromIni({ profile: 'default' }),
  });
}

function sanitizeAgreementDoc(value) {
  return String(value || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[,;]+$/g, '')
    .replace(/\/+$/g, '');
}

function buildAgreementS3KeyCandidates(agreementDoc) {
  const trimmed = sanitizeAgreementDoc(agreementDoc);
  if (!trimmed) return [];

  const candidates = new Set();

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed);
      const pathKey = decodeURIComponent(
        url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname,
      );
      if (pathKey) candidates.add(pathKey);
    } catch {
      // ignore invalid URL
    }
    return [...candidates];
  }

  const withoutLeadingSlash = trimmed.startsWith('/')
    ? trimmed.slice(1)
    : trimmed;

  candidates.add(withoutLeadingSlash);

  if (withoutLeadingSlash.startsWith('attachments/')) {
    candidates.add(withoutLeadingSlash.replace(/^attachments\//, ''));
  } else {
    candidates.add(`attachments/${withoutLeadingSlash}`);
  }

  const fileName = withoutLeadingSlash.split('/').pop();
  if (fileName) {
    candidates.add(fileName);
    candidates.add(`attachments/${fileName}`);
  }

  return [...candidates];
}

function isS3NotFoundError(error) {
  return (
    error?.name === 'NoSuchKey' ||
    error?.Code === 'NoSuchKey' ||
    error?.$metadata?.httpStatusCode === 404 ||
    String(error?.message || '').includes('does not exist')
  );
}

async function getAgreementPdfFromS3(s3Key) {
  const { bucket, region } = getAgreementS3Config();
  const s3Client = createAgreementS3Client(region);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  const response = await s3Client.send(command);
  const byteArray = await response.Body.transformToByteArray();

  return Buffer.from(byteArray);
}

async function fetchAgreementFromExtension(agreementDoc) {
  const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
  if (!extensionUrl) return null;

  const sanitized = sanitizeAgreementDoc(agreementDoc);
  const fileName = sanitized.split('/').pop();

  const urlCandidates = [
    `${extensionUrl}/${sanitized}`,
    `${extensionUrl}/api/${sanitized}`,
    `${extensionUrl}/attachments/${fileName}`,
    `${extensionUrl}/api/attachments/${fileName}`,
    `${extensionUrl}/storage/${sanitized}`,
    `${extensionUrl}/storage/${fileName}`,
  ];

  for (const url of [...new Set(urlCandidates.filter(Boolean))]) {
    try {
      const response = await fetch(url);
      if (!response.ok) continue;

      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();
      if (!arrayBuffer.byteLength) continue;

      const isPdf =
        contentType.includes('pdf') ||
        contentType.includes('octet-stream') ||
        sanitized.toLowerCase().endsWith('.pdf');

      if (!isPdf) continue;

      return {
        buffer: Buffer.from(arrayBuffer),
        s3Key: sanitized,
        signedUrl: url,
        publicUrl: url,
        source: 'extension',
      };
    } catch {
      continue;
    }
  }

  return null;
}

async function resolveAgreementDocument(agreementDoc) {
  const { bucket } = getAgreementS3Config();

  const trimmed = sanitizeAgreementDoc(agreementDoc);

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    const response = await fetch(trimmed);
    if (!response.ok) {
      throw new Error(`Failed to fetch agreement document from URL (${response.status})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      buffer: Buffer.from(arrayBuffer),
      s3Key: trimmed,
      signedUrl: trimmed,
      publicUrl: trimmed,
    };
  }

  const keyCandidates = buildAgreementS3KeyCandidates(trimmed);
  let lastError = null;

  for (const s3Key of keyCandidates) {
    try {
      const [buffer, urls] = await Promise.all([
        getAgreementPdfFromS3(s3Key),
        getAgreementDocumentUrl(s3Key),
      ]);

      return {
        buffer,
        s3Key,
        signedUrl: urls.signedUrl,
        publicUrl: urls.publicUrl,
      };
    } catch (error) {
      if (isS3NotFoundError(error)) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  const extensionDocument = await fetchAgreementFromExtension(trimmed);
  if (extensionDocument) {
    return extensionDocument;
  }

  throw new Error(
    `Agreement file not found in S3 bucket "${bucket}" or extension server. Stored value: "${trimmed}". Tried S3 keys: ${keyCandidates.join(', ')}${lastError ? `. ${lastError.message}` : ''}`,
  );
}

async function getAgreementDocumentUrl(s3Key) {
  const { bucket, region } = getAgreementS3Config();
  const s3Client = createAgreementS3Client(region);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: s3Key,
  });

  const signedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600,
  });

  const publicUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3Key}`;

  return { signedUrl, publicUrl };
}

function toObjectId(userId) {
  if (!userId) return null;
  return mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
}

// pdftotext bbox and DocuSign both use top-left origin (y increases downward).
function agreementFieldY(labelYMin) {
  return String(Math.round(labelYMin + 15));
}

function agreementSignatureY() {
  // Same row as the date field; height is constrained on the SignHere tab.
  return agreementFieldY(248.602);
}

function splitLegalName(legalName) {
  const name = String(legalName || '').trim();
  if (!name) return { firstName: '', lastName: '' };

  const parts = name.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: '', lastName: parts[0] };
  }

  return {
    firstName: parts[parts.length - 1],
    lastName: parts.slice(0, -1).join(' '),
  };
}

function buildAgreementTextTabs(userDetails, pageNumber) {
  const { firstName, lastName } = splitLegalName(userDetails.legal_name);

  const fields = [
    {
      label: 'last_name',
      value: lastName,
      x: 70,
      y: agreementFieldY(176.602),
      width: 190,
    },
    {
      label: 'first_name',
      value: firstName,
      x: 280,
      y: agreementFieldY(176.602),
      width: 140,
    },
    {
      label: 'ssn',
      value: userDetails.ssn_id,
      x: 440,
      y: agreementFieldY(176.602),
      width: 120,
    },
    {
      label: 'mailing_address',
      value: userDetails.address,
      x: 70,
      y: agreementFieldY(206.602),
      width: 190,
    },
    {
      label: 'city',
      value: userDetails.city,
      x: 280,
      y: agreementFieldY(206.602),
      width: 50,
    },
    {
      label: 'state',
      value: userDetails.state,
      x: 340,
      y: agreementFieldY(206.602),
      width: 70,
    },
    {
      label: 'zip_code',
      value: userDetails.zip_code,
      x: 420,
      y: agreementFieldY(206.602),
      width: 55,
    },
    {
      label: 'country',
      value: 'USA',
      x: 490,
      y: agreementFieldY(206.602),
      width: 70,
    },
    {
      label: 'date_of_birth',
      value: userDetails.date_of_birth,
      x: 220,
      y: agreementFieldY(236.602),
      width: 65,
    },
    {
      label: 'email',
      value: userDetails.email_id,
      x: 300,
      y: agreementFieldY(236.602),
      width: 135,
    },
    {
      label: 'phone',
      value: userDetails.contact_no,
      x: 450,
      y: agreementFieldY(236.602),
      width: 100,
    },
  ];

  return fields
    .filter((field) => field.value)
    .map((field) => {
      const tab = new docusign.Text();
      tab.documentId = '1';
      tab.pageNumber = pageNumber;
      tab.xPosition = String(field.x);
      tab.yPosition = field.y;
      tab.width = String(field.width);
      tab.value = String(field.value);
      tab.tabLabel = field.label;
      tab.locked = 'true';
      return tab;
    });
}

export async function POST(req) {
  try {
    const { user_id } = await req.json();

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    await connectToDatabase();

    const userDocs = await UserDocs.findOne({ user_id });
    if (!userDocs?.agreement_doc) {
      return NextResponse.json(
        { error: 'Agreement document not found for this user' },
        { status: 404 },
      );
    }

    const userDetails = await UserDetails.findOne({
      user_id: toObjectId(user_id),
    }).sort({ createdAt: -1 });

    if (!userDetails?.email_id || !userDetails?.legal_name) {
      return NextResponse.json(
        { error: 'User details not found for signing' },
        { status: 404 },
      );
    }

    const {
      buffer: pdfBuffer,
      s3Key,
      signedUrl,
      publicUrl,
    } = await resolveAgreementDocument(userDocs.agreement_doc);

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numberOfPages = pdfDoc.getPageCount();
    const lastPage = String(numberOfPages);

    const pdfBase64 = pdfBuffer.toString('base64');

    const dsApiClient = new docusign.ApiClient();
    dsApiClient.setOAuthBasePath('account.docusign.com');
    dsApiClient.setBasePath('https://na4.docusign.net/restapi');

    const privateKeyPath = path.join(process.cwd(), 'private.pem');
    if (!fs.existsSync(privateKeyPath)) {
      throw new Error('Private key file not found');
    }

    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    const results = await dsApiClient.requestJWTUserToken(
      process.env.DOCU_SIGN_INTEGRATION_KEY.trim(),
      process.env.DOCU_SIGN_USER_ID.trim(),
      ['signature', 'impersonation'],
      privateKey,
      3600,
    );

    const accessToken = results.body.access_token;
    if (!accessToken) throw new Error('Failed to obtain access token');

    dsApiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.DOCU_SIGN_API_ACCOUNT_ID.trim();

    const envelopeDefinition = new docusign.EnvelopeDefinition();
    envelopeDefinition.emailSubject = `Please sign your agreement form - ${userDetails.legal_name}`;
    envelopeDefinition.documents = [
      {
        documentBase64: pdfBase64,
        name: 'Signed Agreement Form',
        fileExtension: 'pdf',
        documentId: '1',
      },
    ];

    const signer = new docusign.Signer();
    signer.email = userDetails.email_id;
    signer.name = userDetails.legal_name;
    signer.recipientId = '1';
    signer.routingOrder = '1';
    signer.clientUserId = '1234';

    const signHere = new docusign.SignHere();
    signHere.documentId = '1';
    signHere.pageNumber = lastPage;
    signHere.xPosition = '72';
    signHere.yPosition = agreementSignatureY();
    signHere.width = '310';
    signHere.height = '16';

    const dateSigned = new docusign.DateSigned();
    dateSigned.documentId = '1';
    dateSigned.pageNumber = lastPage;
    dateSigned.xPosition = '410';
    dateSigned.yPosition = agreementFieldY(266.602);

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    tabs.dateSignedTabs = [dateSigned];
    tabs.textTabs = buildAgreementTextTabs(userDetails, lastPage);
    signer.tabs = tabs;

    envelopeDefinition.recipients = { signers: [signer] };
    envelopeDefinition.status = 'sent';

    const envelopeResponse = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    const envelopeId = envelopeResponse.envelopeId;

    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/signed?envelopeId=${envelopeId}&type=agreement&user_id=${user_id}`;
    viewRequest.authenticationMethod = 'none';
    viewRequest.email = userDetails.email_id;
    viewRequest.userName = userDetails.legal_name;
    viewRequest.clientUserId = '1234';

    const recipientView = await envelopesApi.createRecipientView(
      accountId,
      envelopeId,
      {
        recipientViewRequest: viewRequest,
      },
    );

    return NextResponse.json({
      success: true,
      signingUrl: recipientView.url,
      envelopeId,
      documentUrl: signedUrl,
      publicUrl,
      agreementDocKey: s3Key,
    });
  } catch (err) {
    console.error(
      'DocuSign agreement error:',
      err.response?.body || err.message || err,
    );

    if (
      err.response?.body?.error === 'invalid_grant' &&
      err.response?.body?.error_description?.includes('consent')
    ) {
      return NextResponse.json(
        {
          error: 'JWT consent required',
          consentUrl: `https://account.docusign.com/oauth/auth?response_type=code&scope=signature%20impersonation&client_id=${process.env.DOCU_SIGN_INTEGRATION_KEY}&redirect_uri=${process.env.NEXT_PUBLIC_BASE_URL}`,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: err.message || 'Failed to create agreement envelope',
        bucket: process.env.AGREEMENT_BUCKET_NAME,
        region: process.env.AGREEMENT_AWS_REGION || 'eu-central-1',
      },
      { status: isS3NotFoundError(err) ? 404 : 500 },
    );
  }
}
