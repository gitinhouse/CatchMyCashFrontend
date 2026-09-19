import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import UserCases from '../../../../models/userCases';
import UserDocs from '../../../../models/userDocs';
import { withAdmin } from '../../../../lib/adminAuth';
import { toObjectId } from '../../../../lib/adminQueries';
import { ALL_DOC_FIELDS, DOC_LABELS } from '../../../../lib/claimLifecycle';
import { resolveDocumentUrl } from '../../../../lib/documentUrls';

export const dynamic = 'force-dynamic';

/**
 * Resolve one document to a fresh, openable URL at click time.
 *
 * Signed URLs expire an hour after they are minted, so embedding them in a
 * list the admin keeps open while working a backlog meant the link had often
 * gone stale by the time it was clicked — it navigated, and nothing opened.
 * Resolving on demand means the URL is always minutes old, and a failure
 * comes back as a stated reason instead of a blank tab.
 */
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const caseId = searchParams.get('case_id');
  const field = searchParams.get('field');

  if (!caseId || !field) {
    return NextResponse.json(
      { error: 'case_id and field are required' },
      { status: 400 },
    );
  }

  if (!ALL_DOC_FIELDS.includes(field)) {
    return NextResponse.json(
      { error: `Unknown document field "${field}"` },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const oid = toObjectId(caseId);
  const kase = oid
    ? await UserCases.findById(oid).select('_id user_id case_id').lean()
    : await UserCases.findOne({ $or: [{ case_id: caseId }, { claim_id: caseId }] })
        .select('_id user_id case_id')
        .lean();

  if (!kase) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  // Prefer the document record tied to this case; fall back to the claimant's
  // most recent one for rows written before case_id was stamped.
  const docs =
    (await UserDocs.findOne({ case_id: kase._id }).sort({ createdAt: -1 }).lean()) ||
    // Guarded: an undefined user_id would be stripped by Mongoose and match
    // an arbitrary claimant's documents.
    (kase.user_id
      ? await UserDocs.findOne({ user_id: kase.user_id })
          .sort({ createdAt: -1 })
          .lean()
      : null);

  const stored = docs?.[field];
  if (typeof stored !== 'string' || !stored.trim()) {
    return NextResponse.json(
      {
        error: `No ${DOC_LABELS[field] || field} on file for case ${kase.case_id}`,
        reason: 'not_uploaded',
      },
      { status: 404 },
    );
  }

  const result = await resolveDocumentUrl(stored, { field });

  console.log('[admin/documents/resolve]', {
    case_id: kase.case_id,
    field,
    strategy: result.strategy,
    resolved: !!result.url,
    reason: result.reason || null,
    tried: result.tried || null,
  });

  if (!result.url) {
    return NextResponse.json(
      {
        error: `Could not open ${DOC_LABELS[field] || field}`,
        reason: result.reason || 'unresolved',
        strategy: result.strategy,
        stored_value: stored,
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    url: result.url,
    strategy: result.strategy,
    label: DOC_LABELS[field] || field,
    filename: stored.split('/').pop(),
  });
});
