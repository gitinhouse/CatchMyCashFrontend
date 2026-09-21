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
 * Resolve a stored document value to an openable URL, reporting how it got
 * there and why it failed.
 *
 * @param {string} value            Raw value from the UserDocs record.
 * @param {object} [options]
 * @param {string} [options.field]  The UserDocs field name, which decides the bucket.
 * @param {number} [options.expiresIn] Signed-URL lifetime in seconds.
 * @returns {Promise<{url: string|null, strategy: string, reason?: string, tried?: string[]}>}
 */
export async function resolveDocumentUrl(value, options = {}) {
  const { field = null, expiresIn = 3600 } = options;

  const raw = stripQuotes(value);
  if (!raw) return { url: null, strategy: 'none', reason: 'empty_value' };

  if (/^https?:\/\//i.test(raw)) {
    return { url: raw, strategy: 'stored_url' };
  }

  const key = raw.startsWith('/') ? raw.slice(1) : raw;
  const useAgreementBucket =
    AGREEMENT_BUCKET_FIELDS.has(field) || key.startsWith('attachments/');

  if (useAgreementBucket) {
    const bucket = process.env.AGREEMENT_BUCKET_NAME;
    const region = process.env.AGREEMENT_AWS_REGION || 'eu-central-1';
    const tried = [];

    if (bucket) {
      for (const candidate of agreementKeyCandidates(key)) {
        tried.push(candidate);
        try {
          const url = await presignIfExists(bucket, region, candidate, expiresIn);
          return { url, strategy: 'agreement_bucket', tried };
        } catch {
          // Try the next key shape.
        }
      }
    }

    // The automation server serves agreements directly when S3 is not
    // configured. Check it actually has the file: handing back a URL that
    // 404s is what makes an agreement "open" to a blank page.
    const extensionUrl = process.env.EXTENSION_URL?.replace(/\/$/, '');
    if (extensionUrl) {
      const candidate = `${extensionUrl}/${key}`;
      try {
        const head = await fetch(candidate, { method: 'HEAD' });
        if (head.ok) {
          return { url: candidate, strategy: 'extension_server', tried };
        }
        return {
          url: null,
          strategy: 'extension_server',
          reason: `extension_server_responded_${head.status}`,
          tried,
        };
      } catch (error) {
        return {
          url: null,
          strategy: 'extension_server',
          reason: `extension_server_unreachable: ${error.message}`,
          tried,
        };
      }
    }

    return {
      url: null,
      strategy: 'agreement_bucket',
      reason: bucket
        ? 'not_found_in_agreement_bucket'
        : 'AGREEMENT_BUCKET_NAME_not_configured',
      tried,
    };
  }

  const bucket = process.env.BUCKET_NAME;
  const region = process.env.AWS_REGION;
  if (!bucket || !region) {
    return {
      url: null,
      strategy: 'main_bucket',
      reason: 'BUCKET_NAME_or_AWS_REGION_not_configured',
    };
  }

  try {
    const url = await getSignedUrl(
      s3(region),
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
    return { url, strategy: 'main_bucket', tried: [key] };
  } catch (error) {
    console.error('[documentUrls] failed to presign', key, error.message);
    return {
      url: null,
      strategy: 'main_bucket',
      reason: `presign_failed: ${error.message}`,
      tried: [key],
    };
  }
}

/**
 * Convenience wrapper for callers that only need the URL.
 *
 * @returns {Promise<string|null>}
 */
export async function getSignedDocumentUrl(value, options = {}) {
  const { url } = await resolveDocumentUrl(value, options);
  return url;
}
