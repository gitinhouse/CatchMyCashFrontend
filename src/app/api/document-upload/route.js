import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import connectToDatabase from '../../lib/mongodb.js';
import UserDocs from '../../models/userDocs.js';
import UserCases from '../../models/userCases.js';
import UserDetails from '../../models/userDetails.js';
import AWS from 'aws-sdk';

export const runtime = 'nodejs';

const LOG_PREFIX = '[document-upload]';

// All userDocs file fields — order preserved for third-party mapping
const USER_DOC_FIELDS = [
  'signed_doc',
  'filled_agreement_doc',
  'proof_id',
  'ssn_id',
  'adress_proof',
  'brith_proof',
  'employee_proof',
  'claim_doc',
];

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
  const value = String(id).trim();
  if (!mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function resolveClaimIdFromUserCase({ userId, caseIdParam }) {
  const caseObjectId = toObjectId(caseIdParam);
  const userObjectId = toObjectId(userId);

  console.log(`${LOG_PREFIX} resolveClaimId input`, {
    caseIdParam,
    userId,
    caseObjectId: caseObjectId?.toString() || null,
    userObjectId: userObjectId?.toString() || null,
  });

  if (!caseObjectId) {
    console.log(`${LOG_PREFIX} Invalid or missing case_id for _id lookup`);
    return { claimId: null, userCase: null, lookupMethod: 'invalid_case_id' };
  }

  // Primary: match payload case_id with usercases._id
  const userCase = await UserCases.findOne({ _id: caseObjectId })
    .select('_id user_id case_id claim_id claim_message')
    .lean();

  console.log(`${LOG_PREFIX} UserCases.findOne({ _id }) result`, {
    found: !!userCase,
    _id: userCase?._id?.toString(),
    user_id: userCase?.user_id?.toString(),
    case_id: userCase?.case_id,
    claim_id: userCase?.claim_id,
    claim_message: userCase?.claim_message,
  });

  if (userCase?.claim_id) {
    return {
      claimId: String(userCase.claim_id),
      userCase,
      lookupMethod: 'usercases._id',
    };
  }

  // Raw collection fallback (bypasses mongoose model caching issues)
  const rawUserCase = await mongoose.connection.db
    .collection('usercases')
    .findOne(
      { _id: caseObjectId },
      {
        projection: {
          _id: 1,
          user_id: 1,
          case_id: 1,
          claim_id: 1,
          claim_message: 1,
        },
      },
    );

  console.log(`${LOG_PREFIX} raw usercases collection lookup`, {
    found: !!rawUserCase,
    _id: rawUserCase?._id?.toString(),
    claim_id: rawUserCase?.claim_id,
  });

  if (rawUserCase?.claim_id) {
    return {
      claimId: String(rawUserCase.claim_id),
      userCase: rawUserCase,
      lookupMethod: 'raw_usercases._id',
    };
  }

  const claimMessage =
    userCase?.claim_message || rawUserCase?.claim_message || '';
  const claimMatch = claimMessage.match(/Claim\s+(\d+)\s+filed/i);
  if (claimMatch?.[1]) {
    console.log(
      `${LOG_PREFIX} claim_id parsed from claim_message`,
      claimMatch[1],
    );
    return {
      claimId: claimMatch[1],
      userCase: userCase || rawUserCase,
      lookupMethod: 'claim_message',
    };
  }

  if (userObjectId) {
    const userCaseByUser = await UserCases.findOne({ user_id: userObjectId })
      .sort({ createdAt: -1 })
      .select('_id user_id case_id claim_id claim_message')
      .lean();

    console.log(`${LOG_PREFIX} fallback UserCases.findOne({ user_id })`, {
      found: !!userCaseByUser,
      _id: userCaseByUser?._id?.toString(),
      claim_id: userCaseByUser?.claim_id,
    });

    if (userCaseByUser?.claim_id) {
      return {
        claimId: String(userCaseByUser.claim_id),
        userCase: userCaseByUser,
        lookupMethod: 'user_id',
      };
    }
  }

  return {
    claimId: null,
    userCase: userCase || rawUserCase,
    lookupMethod: 'not_found',
  };
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

async function getSignedS3Url(bucket, region, key) {
  const s3 = new AWS.S3({ region });
  const normalizedKey = key.startsWith('/') ? key.slice(1) : key;
  const params = {
    Bucket: bucket,
    Key: normalizedKey,
    Expires: 86400, // 1 day validity
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    console.log(
      `${LOG_PREFIX} Generated signed URL for s3://${bucket}/${normalizedKey} in region ${region}`,
    );
    console.log(`${LOG_PREFIX} URL: ${url}`);
    return url;
  } catch (error) {
    console.error(
      `${LOG_PREFIX} Error generating signed URL for s3://${bucket}/${normalizedKey} in region ${region}:`,
      error,
    );
    return null;
  }
}

async function resolveDocumentUrl(field, rawValue, mainBucket, mainRegion) {
  const s3Key = rawValue.startsWith('/') ? rawValue.slice(1) : rawValue;

  if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
    console.log(
      `${LOG_PREFIX} Value is already a URL, not generating new one: ${s3Key}`,
    );
    return s3Key;
  }

  const useAgreementBucket =
    field === 'agreement_doc' || s3Key.startsWith('attachments/');

  if (useAgreementBucket) {
    const agreementBucket = process.env.AGREEMENT_BUCKET_NAME;
    const agreementRegion = process.env.AGREEMENT_AWS_REGION || 'eu-central-1';
    if (agreementBucket) {
      console.log(`${LOG_PREFIX} Generating signed URL for agreement bucket`);
      return getSignedS3Url(agreementBucket, agreementRegion, s3Key);
    }

    const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
    if (extensionUrl) {
      const url = `${extensionUrl}/${s3Key}`;
      console.log(
        `${LOG_PREFIX} Using fallback extension URL for agreement doc: ${url}`,
      );
      return url;
    }
  }

  console.log(`${LOG_PREFIX} Generating signed URL for main bucket`);
  return getSignedS3Url(mainBucket, mainRegion, s3Key);
}

async function buildDocumentsFromUserDocs(userDocs, bucket, region) {
  const documents = [];
  const plain =
    typeof userDocs?.toObject === 'function' ? userDocs.toObject() : userDocs;

  for (const field of USER_DOC_FIELDS) {
    const value = plain[field];
    if (typeof value !== 'string' || value.trim() === '') continue;

    const url = await resolveDocumentUrl(field, value, bucket, region);
    if (url) {
      documents.push({
        key: field,
        url: url,
        filename: filenameFromS3Key(value),
        type: DOCUMENT_TYPE_MAP[field] || field,
      });
    }
  }

  return documents;
}

export async function POST(req) {
  try {
    console.log(`${LOG_PREFIX} POST request received`);

    const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
    if (!extensionUrl) {
      console.log(`${LOG_PREFIX} EXTENSION_URL missing`);
      return NextResponse.json(
        { message: 'EXTENSION_URL is not configured' },
        { status: 500 },
      );
    }

    const bucket = process.env.BUCKET_NAME;
    const region = process.env.AWS_REGION;
    if (!bucket || !region) {
      console.log(`${LOG_PREFIX} S3 env missing`, { bucket, region });
      return NextResponse.json(
        { message: 'S3 environment variables missing' },
        { status: 500 },
      );
    }

    const body = await req.json();
    const { user_id, case_id } = body;

    console.log(`${LOG_PREFIX} request body`, { user_id, case_id });

    if (!user_id) {
      return NextResponse.json(
        { message: 'user_id is required' },
        { status: 400 },
      );
    }

    if (!case_id) {
      console.log(`${LOG_PREFIX} case_id missing in request body`);
      return NextResponse.json(
        {
          message: 'case_id is required (must match usercases._id)',
          success: false,
        },
        { status: 400 },
      );
    }

    await connectToDatabase();
    console.log(`${LOG_PREFIX} connected to database`, {
      dbName: mongoose.connection.name,
      host: mongoose.connection.host,
    });

    const { claimId, userCase, lookupMethod } =
      await resolveClaimIdFromUserCase({
        userId: user_id,
        caseIdParam: case_id,
      });

    console.log(`${LOG_PREFIX} claim_id resolution`, {
      lookupMethod,
      claimId,
      matchedUserCaseId: userCase?._id?.toString(),
    });

    if (!claimId) {
      console.log(`${LOG_PREFIX} FAILED: claim_id not found for case`, {
        case_id,
        user_id,
        lookupMethod,
        userCase,
      });
      return NextResponse.json(
        {
          message: 'claim_id is required',
          success: false,
          debug: {
            lookupMethod,
            case_id,
            user_id,
            matchedUserCaseId: userCase?._id?.toString() || null,
            dbName: mongoose.connection.name,
          },
        },
        { status: 400 },
      );
    }

    const userDocs = await findUserDocs({
      userId: user_id,
      caseIdParam: case_id,
    });

    console.log(`${LOG_PREFIX} userDocs lookup`, {
      found: !!userDocs,
      userDocsId: userDocs?._id?.toString(),
      userDocsCaseId: userDocs?.case_id?.toString(),
      fields: USER_DOC_FIELDS.reduce((acc, field) => {
        acc[field] = userDocs?.[field] || null;
        return acc;
      }, {}),
    });

    if (!userDocs) {
      return NextResponse.json(
        { message: 'User documents not found' },
        { status: 404 },
      );
    }

    const userDetails = await UserDetails.findOne({
      user_id: toObjectId(user_id),
    })
      .sort({ createdAt: -1 })
      .select('email_id');

    console.log(`${LOG_PREFIX} userDetails`, {
      email: userDetails?.email_id || null,
    });

    const documents = await buildDocumentsFromUserDocs(
      userDocs,
      bucket,
      region,
    );
    console.log(`${LOG_PREFIX} documents prepared`, {
      count: documents.length,
      documents: documents.map((doc) => ({
        key: doc.key,
        type: doc.type,
        filename: doc.filename,
        url: doc.url,
      })),
    });

    if (documents.length === 0) {
      return NextResponse.json(
        { message: 'No documents found to upload' },
        { status: 400 },
      );
    }

    const payload = {
      claim_id: claimId,
      claims: [
        {
          claim_id: claimId,
          email: userDetails?.email_id || '',
          documents,
        },
      ],
      max_concurrent: 4,
    };

    console.log(`${LOG_PREFIX} calling third-party API`, {
      url: `${extensionUrl}/api/document-upload`,
      claim_id: claimId,
      email: userDetails?.email_id || '',
      documentCount: documents.length,
    });
    console.log(
      `${LOG_PREFIX} third-party full payload (copy for Postman):\n${JSON.stringify(payload, null, 2)}`,
    );

    const response = await fetch(`${extensionUrl}/api/document-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await response.json().catch(() => ({}));

    console.log(`${LOG_PREFIX} third-party response`, {
      status: response.status,
      ok: response.ok,
      data,
    });

    if (!response.ok) {
      return NextResponse.json(
        data?.message
          ? { message: data.message, ...data, source: 'third_party' }
          : {
              message: 'Document upload to third party failed',
              ...data,
              source: 'third_party',
            },
        { status: response.status },
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error(`${LOG_PREFIX} error:`, error);
    return NextResponse.json(
      { message: 'Server error', error: error.message },
      { status: 500 },
    );
  }
}
