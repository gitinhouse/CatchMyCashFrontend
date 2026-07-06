export const runtime = 'nodejs';

import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  fromIni,
  fromNodeProviderChain,
} from '@aws-sdk/credential-providers';
import connectToDatabase from '../../../lib/mongodb';
import UserDocs from '../../../models/userDocs';
import {
  createAuthenticatedDocuSignClient,
  docuSignErrorResponse,
} from '../../../lib/docusignClient';

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

    const { envelopesApi, accountId } = await createAuthenticatedDocuSignClient();

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
    return docuSignErrorResponse(err, 'Failed to save signed agreement form');
  }
}
