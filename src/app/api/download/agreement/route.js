export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import docusign from 'docusign-esign';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  fromIni,
  fromNodeProviderChain,
} from '@aws-sdk/credential-providers';
import connectToDatabase from '../../../lib/mongodb';
import UserDocs from '../../../models/userDocs';

const isProduction = process.env.NODE_ENV === 'production';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: isProduction
    ? fromNodeProviderChain()
    : fromIni({ profile: 'default' }),
});

function toObjectId(userId) {
  if (!userId) return null;
  return mongoose.Types.ObjectId.isValid(userId)
    ? new mongoose.Types.ObjectId(userId)
    : userId;
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const envelopeId = searchParams.get('envelopeId');
    const user_id = searchParams.get('user_id');

    if (!envelopeId) {
      return NextResponse.json({ error: 'Missing envelopeId' }, { status: 400 });
    }

    if (!user_id) {
      return NextResponse.json({ error: 'Missing user_id' }, { status: 400 });
    }

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
    dsApiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`);

    const envelopesApi = new docusign.EnvelopesApi(dsApiClient);
    const accountId = process.env.DOCU_SIGN_API_ACCOUNT_ID.trim();

    const pdfBytes = await envelopesApi.getDocument(
      accountId,
      envelopeId,
      '1',
      null,
    );

    const fileName = `${Date.now()}-FilledAgreement_form.pdf`;
    const pdfBuffer = Buffer.from(pdfBytes, 'binary');

    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
        Body: pdfBuffer,
        ContentType: 'application/pdf',
      }),
    );

    // AUTO-DOWNLOAD (testing) — disable via NEXT_PUBLIC_AUTO_DOWNLOAD_AGREEMENT=false
    const autoDownloadEnabled =
      process.env.NEXT_PUBLIC_AUTO_DOWNLOAD_AGREEMENT === 'true';

    let localFilePath = null;

    if (autoDownloadEnabled) {
      const downloadsFolder = path.join(process.cwd(), 'downloads');
      if (!fs.existsSync(downloadsFolder)) {
        fs.mkdirSync(downloadsFolder, { recursive: true });
      }
      localFilePath = path.join(downloadsFolder, fileName);
      fs.writeFileSync(localFilePath, pdfBuffer);
    }

    await connectToDatabase();

    const updatedDocs = await UserDocs.findOneAndUpdate(
      { user_id: toObjectId(user_id) },
      { $set: { signed_doc: fileName } },
      { new: true },
    );

    if (!updatedDocs) {
      return NextResponse.json(
        { error: 'User documents record not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      filePath: fileName,
      signed_doc: fileName,
      ...(autoDownloadEnabled && { localFilePath }),
    });
  } catch (err) {
    console.error(
      'Agreement download error:',
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
      { error: err.message || 'Failed to save signed agreement form' },
      { status: 500 },
    );
  }
}
