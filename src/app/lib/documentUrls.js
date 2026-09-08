import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { fromIni, fromNodeProviderChain } from '@aws-sdk/credential-providers';

const isProduction = process.env.NODE_ENV === 'production';

let cachedClient = null;

function s3() {
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: process.env.AWS_REGION,
      credentials: isProduction
        ? fromNodeProviderChain()
        : fromIni({ profile: 'default' }),
    });
  }
  return cachedClient;
}

/**
 * Turn a stored document value into something an admin can open in a browser.
 *
 * UserDocs rows hold either a full URL (older records, DocuSign links) or an S3
 * object key. Keys are presigned for one hour; full URLs pass through. Any
 * failure returns null so one broken document never breaks the whole page.
 *
 * @param {string} value
 * @param {number} [expiresIn] seconds
 * @returns {Promise<string|null>}
 */
export async function getSignedDocumentUrl(value, expiresIn = 3600) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const raw = value.trim();

  if (/^https?:\/\//i.test(raw)) return raw;

  const bucket = process.env.BUCKET_NAME;
  if (!bucket || !process.env.AWS_REGION) return null;

  const key = raw.startsWith('/') ? raw.slice(1) : raw;

  try {
    return await getSignedUrl(
      s3(),
      new GetObjectCommand({ Bucket: bucket, Key: key }),
      { expiresIn },
    );
  } catch (error) {
    console.error('[documentUrls] failed to presign', key, error.message);
    return null;
  }
}
