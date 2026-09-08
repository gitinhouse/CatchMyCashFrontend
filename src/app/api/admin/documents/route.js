import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import { withAdmin } from '../../../lib/adminAuth';
import { caseJoinStages, toCaseRow, safeRegex } from '../../../lib/adminQueries';
import { ALL_DOC_FIELDS, DOC_LABELS } from '../../../lib/claimLifecycle';
import { getSignedDocumentUrl } from '../../../lib/documentUrls';

export const dynamic = 'force-dynamic';

const REQUIRED = ['proof_id', 'ssn_id', 'adress_proof'];

/**
 * A cross-case view of every uploaded document, so an admin can work the
 * verification backlog without opening each case one by one.
 */
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const verification = searchParams.get('verification'); // completed|failed|processing|pending
  const completeness = searchParams.get('completeness'); // complete|incomplete
  const sign = searchParams.get('sign') === 'true';

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit'), 10) || 20, 1),
    100,
  );

  await connectToDatabase();

  const pipeline = [{ $sort: { createdAt: -1 } }, ...caseJoinStages()];
  if (search) {
    const rx = safeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { case_id: rx },
          { claim_id: rx },
          { 'details.legal_name': rx },
          { 'details.email_id': rx },
          { 'user_info.first_name': rx },
          { 'user_info.last_name': rx },
        ],
      },
    });
  }

  const docs = await UserCases.aggregate(pipeline).allowDiskUse(true);
  const now = new Date();

  let rows = docs.map((doc) => {
    const row = toCaseRow(doc, now);
    const files = ALL_DOC_FIELDS.filter(
      (f) => typeof doc.docs?.[f] === 'string' && doc.docs[f].trim() !== '',
    ).map((f) => ({
      field: f,
      label: DOC_LABELS[f] || f,
      stored_value: doc.docs[f],
      filename: String(doc.docs[f]).split('/').pop(),
    }));

    const missing = REQUIRED.filter(
      (f) => !(typeof doc.docs?.[f] === 'string' && doc.docs[f].trim() !== ''),
    );

    return {
      _id: row._id,
      case_id: row.case_id,
      claim_id: row.claim_id,
      applicant: row.applicant,
      created_at: row.created_at,
      uploaded_at: doc.docs?.createdAt || null,
      verification_status: row.document_upload_task_status || null,
      verification_message: row.document_upload_message || '',
      doc_retry: {
        count: row.retry.doc_count,
        max: row.retry.doc_max,
        exhausted: row.retry.doc_exhausted,
        error_type: row.retry.doc_error_type,
      },
      files,
      file_count: files.length,
      missing: missing.map((f) => ({ field: f, label: DOC_LABELS[f] || f })),
      is_complete: missing.length === 0,
      state: row.state,
    };
  });

  if (verification === 'pending') {
    rows = rows.filter((r) => !r.verification_status);
  } else if (verification) {
    rows = rows.filter(
      (r) => (r.verification_status || '').toLowerCase() === verification,
    );
  }
  if (completeness === 'complete') rows = rows.filter((r) => r.is_complete);
  if (completeness === 'incomplete') rows = rows.filter((r) => !r.is_complete);

  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * limit, safePage * limit);

  // Presigning is opt-in: it costs one S3 call per file.
  if (sign) {
    for (const row of paged) {
      for (const file of row.files) {
        file.url = await getSignedDocumentUrl(file.stored_value);
      }
    }
  }

  return NextResponse.json({
    data: paged,
    page: safePage,
    limit,
    total,
    totalPages,
    summary: {
      verified: rows.filter((r) => r.verification_status === 'completed').length,
      failed: rows.filter((r) => r.verification_status === 'failed').length,
      processing: rows.filter((r) => r.verification_status === 'processing').length,
      awaiting: rows.filter((r) => !r.verification_status).length,
      incomplete: rows.filter((r) => !r.is_complete).length,
      total_files: rows.reduce((s, r) => s + r.file_count, 0),
    },
  });
});
