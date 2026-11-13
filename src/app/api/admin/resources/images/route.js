import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import { withAdmin } from '../../../../lib/adminAuth';
import ResourceImage from '../../../../models/resourceImage';
import { IMAGE_MAX_BYTES, mediaPath } from '../../../../lib/resources/constants';

export const dynamic = 'force-dynamic';

// The file's real type, read from its first bytes: the name and the type the
// browser declares are both the uploader's to choose. SVG is not accepted, as
// it can carry script.
function detectImageType(bytes) {
  const b = bytes;
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) {
    return 'image/png';
  }
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'image/gif';
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

/** Upload one image (form field "file"); answers with its public address. */
export const POST = withAdmin(async (req, ctx, admin) => {
  let form;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Send the image as a form upload.' }, { status: 400 });
  }
  const file = form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') {
    return NextResponse.json({ error: 'Choose an image to upload.' }, { status: 400 });
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return NextResponse.json(
      { error: `Images must be ${Math.round(IMAGE_MAX_BYTES / 1024 / 1024)} MB or smaller.` },
      { status: 413 },
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const contentType = detectImageType(bytes);
  if (!contentType) {
    return NextResponse.json(
      { error: 'Upload a JPEG, PNG, WebP or GIF image.' },
      { status: 415 },
    );
  }

  await connectToDatabase();
  const doc = await ResourceImage.create({
    data: bytes,
    content_type: contentType,
    size: bytes.length,
    original_name: String(file.name || '').slice(0, 200),
    uploaded_by: admin.email || '',
  });

  const id = String(doc._id);
  return NextResponse.json(
    { id, url: mediaPath(id), contentType, size: bytes.length },
    { status: 201 },
  );
});
