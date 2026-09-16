import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromIni, fromNodeProviderChain } from '@aws-sdk/credential-providers';

const isProduction = process.env.NODE_ENV === 'production';

const clients = new Map();

function s3(region) {
  if (!clients.has(region)) {
    clients.set(
      region,
      new S3Client({
        region,
        credentials: isProduction
          ? fromNodeProviderChain()
          : fromIni({ profile: 'default' }),
      }),
    );
  }
  return clients.get(region);
}

/**
 * Agreement PDFs are produced by the automation server and land in their own
 * bucket/region, not the main uploads bucket. Everything else (IDs, SSN cards,
 * signed forms, the filled agreement we write back from DocuSign) lives in the
 * main bucket.
 *
 * Mirrors the resolution the DocuSign agreement route performs; kept separate
 * so the signing path is not disturbed.
 */
const AGREEMENT_BUCKET_FIELDS = new Set(['agreement_doc']);

function stripQuotes(value) {
  return String(value || '')
    .trim()
    .replace(/^["']+|["']+$/g, '')
    .replace(/[,;]+$/g, '')
    .replace(/\/+$/g, '');
}

/**
 * The stored value may be a bare filename, an `attachments/` key, or a full
 * URL, depending on which version of the automation server wrote it — so try
 * each shape rather than guessing one.
 */
function agreementKeyCandidates(value) {
  const trimmed = stripQuotes(value);
  if (!trimmed) return [];

  const candidates = new Set();
  const key = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;

  candidates.add(key);
  if (key.startsWith('attachments/')) {
    candidates.add(key.replace(/^attachments\//, ''));
  } else {
    candidates.add(`attachments/${key}`);
  }

  const fileName = key.split('/').pop();
  if (fileName) {
    candidates.add(fileName);
    candidates.add(`attachments/${fileName}`);
  }

  return [...candidates];
}

async function presignIfExists(bucket, region, key, expiresIn) {
  // HeadObject first: presigning a missing key still returns a URL, which
  // would open to an S3 error page instead of the document.
  await s3(region).send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  return getSignedUrl(
    s3(region),
    new GetObjectCommand({ Bucket: bucket, Key: key }),
    { expiresIn },
  );
}

/**
 * Turn a stored document value into something an admin can open in a browser.
 *
 * @param {string} value            Raw value from the UserDocs record.
 * @param {object} [options]
 * @param {string} [options.field]  The UserDocs field name, which decides the bucket.
 * @param {number} [options.expiresIn] Signed-URL lifetime in seconds.
 * @returns {Promise<string|null>} An openable URL, or null if it cannot be resolved.
 */
export async function getSignedDocumentUrl(value, options = {}) {
  const { field = null, expiresIn = 3600 } = options;

  const raw = stripQuotes(value);
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;

  const key = raw.startsWith('/') ? raw.slice(1) : raw;
  const useAgreementBucket =
    AGREEMENT_BUCKET_FIELDS.has(field) || key.startsWith('attachments/');

  if (useAgreementBucket) {
    const bucket = process.env.AGREEMENT_BUCKET_NAME;
    const region = process.env.AGREEMENT_AWS_REGION || 'eu-central-1';

    if (bucket) {
      for (const candidate of agreementKeyCandidates(key)) {
        try {
          return await presignIfExists(bucket, region, candidate, expiresIn);
        } catch {
          // Try the next key shape.
        }
      }
    }

    // The automation server serves agreements directly when S3 is not configured.
    const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
    if (extensionUrl) return `${extensionUrl}/${key}`;
    return null;
  }

  const bucket = process.env.BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) return null;

  try {
    return await getSignedUrl(
      s3(region),
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  } catch (error) {
    console.error('[documentUrls] failed to presign', key, error.message);
    return null;
  }
}
