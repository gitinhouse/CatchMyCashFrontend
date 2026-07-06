export const runtime = 'nodejs';

import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import {
  fromIni,
  fromNodeProviderChain,
} from '@aws-sdk/credential-providers';
import { NextResponse } from 'next/server';

const isProduction = process.env.NODE_ENV === 'production';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: isProduction
    ? fromNodeProviderChain()
    : fromIni({ profile: 'default' }),
});

function isValidAgreementFileName(fileName) {
  return (
    typeof fileName === 'string' &&
    fileName.endsWith('.pdf') &&
    fileName.includes('FilledAgreement_form') &&
    !fileName.includes('..') &&
    !fileName.includes('/')
  );
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('fileName');

    if (!isValidAgreementFileName(fileName)) {
      return NextResponse.json({ error: 'Invalid fileName' }, { status: 400 });
    }

    const response = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: fileName,
      }),
    );

    const byteArray = await response.Body.transformToByteArray();

    return new NextResponse(Buffer.from(byteArray), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('Agreement local download error:', err.message || err);

    return NextResponse.json(
      { error: err.message || 'Failed to download agreement PDF' },
      { status: 500 },
    );
  }
}
