import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../lib/mongodb.js';
import UserDocs from '../../models/userDocs.js';
import UserCases from '../../models/userCases.js';
import UserDetails from '../../models/userDetails.js';

export const runtime = 'nodejs';

const DOCUMENT_TYPE_MAP = {
  signed_doc: 'Digital Signature Form',
  filled_agreement_doc: 'Signed Agreement Form',
  agreement_doc: 'Agreement Document',
  proof_id: 'Government-issued Photo ID',
  ssn_id: 'Social Security Card or W2',
  adress_proof: 'Proof of Address (utility bill, bank statement)',
  brith_proof: 'Birth Certificate',
  employee_proof: 'Employment Records (if applicable)',
  claim_doc: 'Claim Form',
};

function toObjectId(id) {
  if (!id) return null;
  return mongoose.Types.ObjectId.isValid(id)
    ? new mongoose.Types.ObjectId(id)
    : id;
}

function filenameFromS3Key(key) {
  const base = key.split('/').pop() || key;
  const match = base.match(/^\d+-(.+)$/);
  return match ? match[1] : base;
}

function buildPublicS3Url(bucket, region, s3Key) {
  const normalizedKey = s3Key.startsWith('/') ? s3Key.slice(1) : s3Key;
  return `https://${bucket}.s3.${region}.amazonaws.com/${normalizedKey}`;
}

function buildDocumentsFromUserDocs(userDocs, bucket, region) {
  const documents = [];

  for (const [field, type] of Object.entries(DOCUMENT_TYPE_MAP)) {
    const value = userDocs[field];
    if (typeof value !== 'string' || value.trim() === '') continue;

    const s3Key = value.startsWith('/') ? value.slice(1) : value;
    documents.push({
      url: buildPublicS3Url(bucket, region, s3Key),
      filename: filenameFromS3Key(s3Key),
      type,
    });
  }

  return documents;
}

export async function POST(req) {
  try {
    const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
    if (!extensionUrl) {
      return NextResponse.json(
        { message: 'EXTENSION_URL is not configured' },
        { status: 500 },
      );
    }

    const bucket = process.env.BUCKET_NAME;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      return NextResponse.json(
        { message: 'S3 environment variables missing' },
        { status: 500 },
      );
    }

    const { user_id, case_id } = await req.json();
    if (!user_id) {
      return NextResponse.json({ message: 'user_id is required' }, { status: 400 });
    }

    await connectToDatabase();

    const userId = toObjectId(user_id);
    const caseObjectId = toObjectId(case_id);

    const userDocs = caseObjectId
      ? await UserDocs.findOne({ case_id: caseObjectId })
      : await UserDocs.findOne({ user_id: userId }).sort({ createdAt: -1 });

    if (!userDocs) {
      return NextResponse.json(
        { message: 'User documents not found' },
        { status: 404 },
      );
    }

    const userCase = await UserCases.findById(userDocs.case_id).select('claim_id');
    const claimId = userCase?.claim_id;

    if (!claimId) {
      return NextResponse.json(
        {
          message: 'claim_id is required',
          success: false,
        },
        { status: 400 },
      );
    }

    const userDetails = await UserDetails.findOne({ user_id: userId })
      .sort({ createdAt: -1 })
      .select('email_id');

    const documents = buildDocumentsFromUserDocs(userDocs, bucket, region);
    if (documents.length === 0) {
      return NextResponse.json(
        { message: 'No documents found to upload' },
        { status: 400 },
      );
    }

    const payload = {
      claims: [
        {
          claim_id: String(claimId),
          email: userDetails?.email_id || '',
          documents,
        },
      ],
      max_concurrent: 4,
    };

    const response = await fetch(`${extensionUrl}/api/document-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        data?.message
          ? { message: data.message, ...data }
          : { message: 'Document upload to third party failed', ...data },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/document-upload error:', error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 },
    );
  }
}
