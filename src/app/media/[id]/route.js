import connectToDatabase from '../../lib/mongodb';
import ResourceImage from '../../models/resourceImage';

export const dynamic = 'force-dynamic';

// Images uploaded from the Resources editor. Served here rather than under
// /api/ because robots.txt keeps crawlers out of /api/, and search engines and
// social networks need to fetch an article's images. An id never changes what
// it points to, so the response can be cached for good.
export async function GET(req, { params }) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(String(id || ''))) {
    return new Response('Not found', { status: 404 });
  }

  const etag = `"${id}"`;
  if (req.headers.get('if-none-match') === etag) {
    return new Response(null, { status: 304, headers: { ETag: etag } });
  }

  await connectToDatabase();
  const image = await ResourceImage.findById(id).lean();
  if (!image) return new Response('Not found', { status: 404 });

  const body = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data.buffer || image.data);
  return new Response(body, {
    headers: {
      'Content-Type': image.content_type,
      'Content-Length': String(body.length),
      'Cache-Control': 'public, max-age=31536000, immutable',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
