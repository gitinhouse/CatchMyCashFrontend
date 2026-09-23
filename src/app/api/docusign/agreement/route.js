export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { mkdtemp, writeFile, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
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
import UserCases from '../../../models/userCases';
import { NOTARY_CLAIM_THRESHOLD, requiresNotary } from '../../../lib/notary';
import { resolveAccountUserIds, userIdFilter } from '../../../lib/accountIdentity';
import { notifyAgreementReadyOnce } from '../../../lib/agreementReady';
import {
  createAuthenticatedDocuSignClient,
  docuSignErrorResponse,
  getAppBaseUrl,
} from '../../../lib/docusignClient';

const execFileAsync = promisify(execFile);

// DocuSign Y axis: smaller value = higher on the page.
// Fine-tune after layout detection (negative = move signature up).
const AGREEMENT_SIGNATURE_Y_ADJUSTMENT = 0;

const AGREEMENT_LAYOUT_PROFILES = {
  // Claimant table on page 2 when the agreement PDF is 2 pages total.
  compact: {
    nameRow: 483.602,
    addressRow: 513.602,
    contactRow: 543.602,
    signatureRow: 573.602,
    // SignHere sits inside the box (above the old +15 text-field offset).
    signatureFieldY: 566.602,
    dateRow: 573.602,
  },
  // Claimant table on page 3 when the agreement PDF is 3+ pages.
  standard: {
    nameRow: 176.602,
    addressRow: 206.602,
    contactRow: 236.602,
    signatureRow: 248.602,
    signatureFieldY: 263.602,
    dateRow: 266.602,
  },
};

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

function agreementSignatureY(signatureFieldY) {
  return String(
    Math.round(signatureFieldY + AGREEMENT_SIGNATURE_Y_ADJUSTMENT),
  );
}

async function detectClaimantNameRowY(pdfBuffer, lastPageNumber) {
  let tempDir = null;
  try {
    tempDir = await mkdtemp(path.join(tmpdir(), 'agreement-layout-'));
    const pdfPath = path.join(tempDir, 'agreement.pdf');
    const xmlPath = path.join(tempDir, 'agreement.xml');

    await writeFile(pdfPath, pdfBuffer);
    await execFileAsync('pdftotext', [
      '-bbox',
      '-f',
      String(lastPageNumber),
      '-l',
      String(lastPageNumber),
      pdfPath,
      xmlPath,
    ]);

    const xml = await readFile(xmlPath, 'utf8');
    const legalWordMatch = xml.match(
      /<word[^>]*yMin="(\d+(?:\.\d+)?)"[^>]*>LEGAL<\/word>/,
    );

    if (!legalWordMatch) return null;

    const legalY = parseFloat(legalWordMatch[1]);
    const currentBeforeLegal = xml.match(
      new RegExp(
        `<word[^>]*yMin="${legalWordMatch[1]}"[^>]*>CURRENT</word>\\s*<word[^>]*yMin="${legalWordMatch[1]}"[^>]*>LEGAL</word>`,
      ),
    );

    if (!currentBeforeLegal) return null;

    return legalY;
  } catch {
    return null;
  } finally {
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}

function buildLayoutFromNameRow(nameRowY, pageCount) {
  const isCompact = nameRowY > 350;
  const signatureOffset = isCompact ? 90 : 72;
  const dateOffset = isCompact ? 90 : 90;
  const signatureRow = nameRowY + signatureOffset;

  return {
    nameRow: nameRowY,
    addressRow: nameRowY + 30,
    contactRow: nameRowY + 60,
    signatureRow,
    signatureFieldY: isCompact ? signatureRow - 7 : signatureRow + 15,
    dateRow: nameRowY + dateOffset,
    profile: isCompact ? 'compact-detected' : 'standard-detected',
    pageCount,
  };
}

async function resolveAgreementLayout(pdfBuffer, pageCount) {
  const detectedNameRowY = await detectClaimantNameRowY(pdfBuffer, pageCount);

  if (detectedNameRowY != null) {
    return buildLayoutFromNameRow(detectedNameRowY, pageCount);
  }

  const profile = pageCount <= 2 ? 'compact' : 'standard';
  return {
    ...AGREEMENT_LAYOUT_PROFILES[profile],
    profile: `${profile}-fallback`,
    pageCount,
  };
}

/**
 * How this account reaches a remote notary.
 *
 * The partner and signature provider are account settings on DocuSign's side,
 * not something that can be inferred, so they come from configuration. Without
 * them an envelope that needs notarising cannot be built correctly.
 */
function getNotaryConfig() {
  const enabled = String(process.env.DOCUSIGN_NOTARY_ENABLED || '')
    .trim()
    .toLowerCase();

  return {
    enabled: enabled === 'true' || enabled === '1' || enabled === 'yes',
    notaryType: process.env.DOCUSIGN_NOTARY_TYPE || 'remote',
    sourceType: process.env.DOCUSIGN_NOTARY_SOURCE_TYPE || 'thirdparty',
    thirdPartyPartner: process.env.DOCUSIGN_NOTARY_THIRD_PARTY_PARTNER || '',
    signatureProvider: process.env.DOCUSIGN_NOTARY_SIGNATURE_PROVIDER || '',
    name: process.env.DOCUSIGN_NOTARY_NAME || '',
    email: process.env.DOCUSIGN_NOTARY_EMAIL || '',
  };
}

/**
 * What is missing before a notarised envelope can be sent.
 *
 * Reported rather than guessed around: sending a large claim through the plain
 * e-signature flow because the notary was not configured would produce an
 * agreement that is not notarised at all, which is worse than a clear failure.
 *
 * @returns {string[]} Names of the unset settings.
 */
function missingNotarySettings(config) {
  const missing = [];
  if (!config.enabled) missing.push('DOCUSIGN_NOTARY_ENABLED');

  if (config.sourceType === 'thirdparty') {
    if (!config.thirdPartyPartner) {
      missing.push('DOCUSIGN_NOTARY_THIRD_PARTY_PARTNER');
    }
  } else if (!config.name || !config.email) {
    // An in-house notary is an ordinary recipient and needs an address.
    missing.push('DOCUSIGN_NOTARY_NAME/DOCUSIGN_NOTARY_EMAIL');
  }

  return missing;
}

/**
 * The notary who will witness this signing.
 *
 * DocuSign keeps the signer where it always was and adds the notary beside it:
 * the signer points at the notary through `notaryId`, and the notary lists the
 * recipient ids it witnesses in `notarySigners`.
 */
function buildNotaryRecipient(config, signerRecipientId) {
  const notary = new docusign.NotaryRecipient();

  notary.recipientId = '2';
  notary.routingOrder = '1';
  notary.notaryType = config.notaryType;
  notary.notarySourceType = config.sourceType;
  notary.notarySigners = [String(signerRecipientId)];

  if (config.sourceType === 'thirdparty') {
    notary.notaryThirdPartyPartner = config.thirdPartyPartner;
  } else {
    notary.name = config.name;
    notary.email = config.email;
  }

  if (config.signatureProvider) {
    notary.recipientSignatureProviders = [
      { signatureProviderName: config.signatureProvider },
    ];
  }

  return notary;
}

/**
 * How many properties this claim covers, which is what decides notarisation.
 *
 * Counted from the case rather than trusted from the browser: the envelope is
 * a legal document and the number of properties on it is the server's fact.
 */
async function countCaseProperties(caseObjectId) {
  if (!caseObjectId) return 0;

  const kase = await UserCases.findById(caseObjectId)
    .select('property_ids')
    .lean();

  return Array.isArray(kase?.property_ids) ? kase.property_ids.length : 0;
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

function buildAgreementTextTabs(userDetails, pageNumber, layout) {
  const { firstName, lastName } = splitLegalName(userDetails.legal_name);

  const fields = [
    {
      label: 'last_name',
      value: lastName,
      x: 70,
      y: agreementFieldY(layout.nameRow),
      width: 190,
    },
    {
      label: 'first_name',
      value: firstName,
      x: 280,
      y: agreementFieldY(layout.nameRow),
      width: 140,
    },
    {
      label: 'ssn',
      value: userDetails.ssn_id,
      x: 440,
      y: agreementFieldY(layout.nameRow),
      width: 120,
    },
    {
      label: 'mailing_address',
      value: userDetails.address,
      x: 70,
      y: agreementFieldY(layout.addressRow),
      width: 190,
    },
    {
      label: 'city',
      value: userDetails.city,
      x: 280,
      y: agreementFieldY(layout.addressRow),
      width: 50,
    },
    {
      label: 'state',
      value: userDetails.state,
      x: 340,
      y: agreementFieldY(layout.addressRow),
      width: 70,
    },
    {
      label: 'zip_code',
      value: userDetails.zip_code,
      x: 420,
      y: agreementFieldY(layout.addressRow),
      width: 55,
    },
    {
      label: 'country',
      value: 'USA',
      x: 490,
      y: agreementFieldY(layout.addressRow),
      width: 70,
    },
    {
      label: 'date_of_birth',
      value: userDetails.date_of_birth,
      x: 220,
      y: agreementFieldY(layout.contactRow),
      width: 65,
    },
    {
      label: 'email',
      value: userDetails.email_id,
      x: 300,
      y: agreementFieldY(layout.contactRow),
      width: 135,
    },
    {
      label: 'phone',
      value: userDetails.contact_no,
      x: 450,
      y: agreementFieldY(layout.contactRow),
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

/**
 * The document record that actually carries this claimant's agreement.
 *
 * Three things went wrong with a plain `findOne({ user_id })`, all of which
 * made the signing step announce that no agreement had been uploaded while one
 * sat in the database:
 *
 *  - no sort, so Mongo returned whichever record it met first — usually the
 *    oldest. A claimant with more than one case got a record from an earlier
 *    case that has no agreement on it.
 *  - no case, so even the newest record is the wrong one when the claimant is
 *    resuming a specific case from their dashboard.
 *  - one id, when a claimant owns several: `UserInformation` is created afresh
 *    by each anonymous search, so the agreement can be filed against an id the
 *    current session no longer carries.
 *
 * So: the named case first, then the newest record that actually has an
 * agreement, then the newest record at all — across every id of the account.
 */
async function findAgreementRecord({ user_id, case_id }) {
  const { ids } = await resolveAccountUserIds(user_id);
  const owner = userIdFilter(ids) || { user_id };

  if (case_id && mongoose.Types.ObjectId.isValid(case_id)) {
    const byCase = await UserDocs.findOne({
      case_id: new mongoose.Types.ObjectId(case_id),
    }).sort({ createdAt: -1 });
    if (byCase) return byCase;
  }

  // A record with an agreement beats a newer one without: the claimant asked
  // whether they can sign, and somewhere they can.
  const withAgreement = await UserDocs.findOne({
    ...owner,
    agreement_doc: { $nin: [null, ''] },
  }).sort({ createdAt: -1 });

  if (withAgreement) return withAgreement;

  return UserDocs.findOne(owner).sort({ createdAt: -1 });
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');
    const case_id = searchParams.get('case_id');

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }
    
    await connectToDatabase();

    const userDocs = await findAgreementRecord({ user_id, case_id });
    const hasAgreement = !!userDocs?.agreement_doc;

    console.log('[docusign/agreement] availability check', {
      user_id,
      case_id: case_id || null,
      matched_docs_id: userDocs?._id ? String(userDocs._id) : null,
      matched_case_id: userDocs?.case_id ? String(userDocs.case_id) : null,
      has_agreement: hasAgreement,
    });

    // Noticing the document is the only moment this app learns it exists, so
    // it is also where the claimant gets told. Sending is guarded against
    // repeats inside, because this endpoint is polled.
    let notified = null;
    if (hasAgreement) {
      try {
        notified = await notifyAgreementReadyOnce(userDocs);
      } catch (error) {
        // Telling the claimant is secondary to answering whether they can sign.
        console.error('[docusign/agreement] ready notice failed', error.message);
      }
    }

    return NextResponse.json({
      hasAgreement,
      agreement_doc: userDocs?.agreement_doc || null,
      case_id: userDocs?.case_id ? String(userDocs.case_id) : null,
      notified: notified?.sent === true,
      user_id
    });
    
  } catch (error) {
    console.error('Error checking agreement:', error);
    return NextResponse.json(
      { error: 'Failed to check agreement availability' },
      { status: 500 }
    );
  }
}

/**
 * Step-by-step tracing for the agreement flow.
 *
 * Every stage logs under one correlation id so a run can be followed end to
 * end in the server logs and the failing step identified, rather than only
 * seeing the final error.
 */
function createAgreementTracer(userId) {
  const runId = `agr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  const startedAt = Date.now();
  let step = 0;

  const emit = (level, name, detail) => {
    step += 1;
    const line = {
      run: runId,
      step,
      ms: Date.now() - startedAt,
      user_id: userId ? String(userId) : null,
      stage: name,
      ...(detail || {}),
    };
    if (level === 'error') console.error('[agreement]', JSON.stringify(line));
    else console.log('[agreement]', JSON.stringify(line));
  };

  return {
    runId,
    step: (name, detail) => emit('log', name, detail),
    fail: (name, detail) => emit('error', name, detail),
  };
}

export async function POST(req) {
  const trace = createAgreementTracer(null);
  try {
    const { user_id } = await req.json();
    trace.step('request_received', { has_user_id: !!user_id });

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    await connectToDatabase();
    trace.step('db_connected');

    // A claimant can have several cases, so take the most recent document
    // record. Without the sort this picked an arbitrary one, and an older case
    // with no agreement_doc produced a spurious "Agreement document not found".
    const userDocs = await UserDocs.findOne({ user_id }).sort({ createdAt: -1 });
    trace.step('user_docs_loaded', {
      found: !!userDocs,
      case_id: userDocs?.case_id ? String(userDocs.case_id) : null,
      has_agreement_doc: !!userDocs?.agreement_doc,
      agreement_doc: userDocs?.agreement_doc || null,
    });

    if (!userDocs?.agreement_doc) {
      trace.fail('agreement_doc_missing', {
        reason: userDocs
          ? 'document record exists but agreement_doc is empty — the automation server has not delivered it yet'
          : 'no UserDocs record for this user',
      });
      return NextResponse.json(
        { error: 'Agreement document not found for this user' },
        { status: 404 },
      );
    }

    const userDetails = await UserDetails.findOne({
      user_id: toObjectId(user_id),
    }).sort({ createdAt: -1 });

    trace.step('user_details_loaded', {
      found: !!userDetails,
      has_email: !!userDetails?.email_id,
      has_legal_name: !!userDetails?.legal_name,
    });

    if (!userDetails?.email_id || !userDetails?.legal_name) {
      trace.fail('user_details_incomplete', {
        missing: [
          !userDetails?.email_id && 'email_id',
          !userDetails?.legal_name && 'legal_name',
        ].filter(Boolean),
      });
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

    trace.step('agreement_pdf_resolved', {
      s3_key: s3Key,
      bytes: pdfBuffer?.length ?? 0,
      has_signed_url: !!signedUrl,
    });

    // Notarisation is decided from the case, and the page count is read from
    // the document that actually arrived. They are separate on purpose: the
    // agreement carries an extra page when it has a notarial certificate, so
    // the field positions follow the real page count rather than the flag.
    const propertyCount = await countCaseProperties(userDocs.case_id);
    const notaryRequired = requiresNotary(propertyCount);

    trace.step('notary_decision', {
      property_count: propertyCount,
      threshold: NOTARY_CLAIM_THRESHOLD,
      notary_required: notaryRequired,
    });

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const numberOfPages = pdfDoc.getPageCount();
    trace.step('pdf_loaded', { pages: numberOfPages });
    const lastPage = String(numberOfPages);
    const layout = await resolveAgreementLayout(pdfBuffer, numberOfPages);

    const notaryConfig = getNotaryConfig();
    if (notaryRequired) {
      const missing = missingNotarySettings(notaryConfig);
      if (missing.length > 0) {
        trace.fail('notary_not_configured', {
          property_count: propertyCount,
          threshold: NOTARY_CLAIM_THRESHOLD,
          missing,
        });
        return NextResponse.json(
          {
            error:
              'This claim covers enough properties to need a notarised signature, but remote notarisation is not configured.',
            notary_required: true,
            property_count: propertyCount,
            threshold: NOTARY_CLAIM_THRESHOLD,
            missing_configuration: missing,
          },
          { status: 503 },
        );
      }
    }

    console.log('[docusign/agreement] layout resolved', {
      numberOfPages,
      lastPage,
      notary_required: notaryRequired,
      property_count: propertyCount,
      profile: layout.profile,
      rows: {
        nameRow: layout.nameRow,
        addressRow: layout.addressRow,
        contactRow: layout.contactRow,
        signatureRow: layout.signatureRow,
        signatureFieldY: layout.signatureFieldY,
        dateRow: layout.dateRow,
      },
    });

    const pdfBase64 = pdfBuffer.toString('base64');

    const { envelopesApi, accountId } = await createAuthenticatedDocuSignClient();
    trace.step('docusign_authenticated', { account_id: accountId || null });

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
    signHere.yPosition = agreementSignatureY(layout.signatureFieldY);
    signHere.width = '280';
    signHere.height = '18';

    const dateSigned = new docusign.DateSigned();
    dateSigned.documentId = '1';
    dateSigned.pageNumber = lastPage;
    dateSigned.xPosition = '410';
    dateSigned.yPosition = agreementFieldY(layout.dateRow);

    const tabs = new docusign.Tabs();
    tabs.signHereTabs = [signHere];
    tabs.dateSignedTabs = [dateSigned];
    tabs.textTabs = buildAgreementTextTabs(userDetails, lastPage, layout);
    signer.tabs = tabs;

    if (notaryRequired) {
      // The two recipients reference each other by id: the signer names the
      // notary witnessing it, and the notary lists the signers it witnesses.
      const notary = buildNotaryRecipient(notaryConfig, signer.recipientId);
      signer.notaryId = notary.recipientId;
      envelopeDefinition.recipients = {
        signers: [signer],
        notaries: [notary],
      };
    } else {
      envelopeDefinition.recipients = { signers: [signer] };
    }

    envelopeDefinition.status = 'sent';

    trace.step('envelope_prepared', {
      signer: userDetails.email_id,
      sign_page: lastPage,
      text_tabs: tabs.textTabs?.length ?? 0,
      notary_required: notaryRequired,
      notary_source_type: notaryRequired ? notaryConfig.sourceType : null,
    });

    const envelopeResponse = await envelopesApi.createEnvelope(accountId, {
      envelopeDefinition,
    });

    const envelopeId = envelopeResponse.envelopeId;
    trace.step('envelope_created', { envelope_id: envelopeId });

    const viewRequest = new docusign.RecipientViewRequest();
    viewRequest.returnUrl = `${getAppBaseUrl()}/signed?envelopeId=${envelopeId}&type=agreement&user_id=${user_id}&case_id=${userDocs.case_id}`;
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

    trace.step('signing_url_created', {
      envelope_id: envelopeId,
      has_url: !!recipientView?.url,
    });

    return NextResponse.json({
      success: true,
      signingUrl: recipientView.url,
      envelopeId,
      documentUrl: signedUrl,
      publicUrl,
      agreementDocKey: s3Key,
    });
  } catch (err) {
    if (isS3NotFoundError(err)) {
      trace.fail('agreement_file_missing_in_s3', {
        bucket: process.env.AGREEMENT_BUCKET_NAME || null,
        region: process.env.AGREEMENT_AWS_REGION || 'eu-central-1',
        message: err.message,
      });
      return NextResponse.json(
        {
          error: err.message || 'Agreement file not found',
          bucket: process.env.AGREEMENT_BUCKET_NAME,
          region: process.env.AGREEMENT_AWS_REGION || 'eu-central-1',
        },
        { status: 404 },
      );
    }

    trace.fail('unhandled_error', {
      message: err?.message,
      docusign_status: err?.response?.status ?? null,
      docusign_body:
        err?.response?.body || err?.response?.data || null,
    });
    return docuSignErrorResponse(err, 'Failed to create agreement envelope');
  }
}
