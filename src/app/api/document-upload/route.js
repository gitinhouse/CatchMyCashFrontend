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

async function resolveClaimId({ userId, caseIdParam }) {
  const caseObjectId = toObjectId(caseIdParam);
  const userObjectId = toObjectId(userId);

  if (caseObjectId) {
    const userCaseById = await UserCases.findById(caseObjectId)
      .select('claim_id claim_message')
      .lean();
    if (userCaseById?.claim_id) {
      return String(userCaseById.claim_id);
    }
  }

  if (caseIdParam) {
    const userCaseByCaseNumber = await UserCases.findOne({
      case_id: String(caseIdParam),
    })
      .select('claim_id claim_message')
      .lean();
    if (userCaseByCaseNumber?.claim_id) {
      return String(userCaseByCaseNumber.claim_id);
    }
  }

  if (userObjectId) {
    const userCaseByUser = await UserCases.findOne({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .select('claim_id claim_message')
      .lean();
    if (userCaseByUser?.claim_id) {
      return String(userCaseByUser.claim_id);
    }

    const claimMatch = userCaseByUser?.claim_message?.match(/Claim\s+(\d+)\s+filed/i);
    if (claimMatch?.[1]) {
      return claimMatch[1];
    }
  }

  return null;
}

async function findUserDocs({ userId, caseIdParam }) {
  const caseObjectId = toObjectId(caseIdParam);
  const userObjectId = toObjectId(userId);

  if (caseObjectId) {
    const byCaseId = await UserDocs.findOne({ case_id: caseObjectId }).sort({
      createdAt: -1,
    });
    if (byCaseId) return byCaseId;
  }

  if (userObjectId) {
    return UserDocs.findOne({ user_id: userObjectId }).sort({ createdAt: -1 });
  }

  return null;
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

    const claimId = await resolveClaimId({ userId: user_id, caseIdParam: case_id });

    if (!claimId) {
      return NextResponse.json(
        {
          message: 'claim_id is required',
          success: false,
        },
        { status: 400 },
      );
    }

    const userDocs = await findUserDocs({ userId: user_id, caseIdParam: case_id });

    if (!userDocs) {
      return NextResponse.json(
        { message: 'User documents not found' },
        { status: 404 },
      );
    }

    const userDetails = await UserDetails.findOne({ user_id: toObjectId(user_id) })
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
          claim_id: claimId,
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
