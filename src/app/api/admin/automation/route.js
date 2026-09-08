import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import { withAdmin } from '../../../lib/adminAuth';
import { caseJoinStages, toCaseRow, safeRegex } from '../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

/**
 * Automation + webhook monitor: every case that has touched the remote claim
 * processor, with its task ids, task statuses, webhook-reported errors and
 * retry schedule in one place.
 */
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const pipelineFilter = searchParams.get('pipeline'); // claim|document
  const outcome = searchParams.get('outcome'); // failed|completed|processing|queued|none
  const retryFilter = searchParams.get('retry'); // pending|exhausted|overdue

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit'), 10) || 25, 1),
    100,
  );

  await connectToDatabase();

  const pipeline = [{ $sort: { updatedAt: -1, createdAt: -1 } }, ...caseJoinStages()];
  if (search) {
    const rx = safeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { case_id: rx },
          { claim_id: rx },
          { automation_id: rx },
          { claim_process_task_id: rx },
          { document_upload_task_id: rx },
          { 'details.email_id': rx },
          { 'details.legal_name': rx },
        ],
      },
    });
  }

  const docs = await UserCases.aggregate(pipeline).allowDiskUse(true);
  const now = new Date();

  let rows = docs.map((doc) => {
    const row = toCaseRow(doc, now);
    const claimNext = row.retry.claim_next_at
      ? new Date(row.retry.claim_next_at)
      : null;
    const docNext = row.retry.doc_next_at ? new Date(row.retry.doc_next_at) : null;

    return {
      _id: row._id,
      case_id: row.case_id,
      claim_id: row.claim_id,
      automation_id: row.automation_id,
      applicant: row.applicant,
      created_at: row.created_at,
      updated_at: row.updated_at,
      submitted_at: row.submitted_at,
      poll_url: doc.poll_url || null,
      claim_pipeline: {
        task_id: row.claim_process_task_id,
        task_status: row.claim_process_task_status,
        claim_status: row.claim_status,
        message: row.claim_message,
        process_message: doc.claim_process_message || '',
        stage: row.claim_process_stage,
        retry_count: row.retry.claim_count,
        retry_max: row.retry.claim_max,
        retryable: row.retry.claim_retryable,
        exhausted: row.retry.claim_exhausted,
        next_retry_at: row.retry.claim_next_at,
        last_attempt_at: row.retry.claim_last_at,
        error_type: row.retry.claim_error_type,
        error_code: row.retry.claim_error_code,
        failed_stage: row.retry.claim_failed_stage,
        retry_overdue: !!(
          row.retry.claim_retryable &&
          !row.retry.claim_exhausted &&
          claimNext &&
          claimNext < now
        ),
      },
      document_pipeline: {
        task_id: row.document_upload_task_id,
        task_status: row.document_upload_task_status,
        message: row.document_upload_message,
        retry_count: row.retry.doc_count,
        retry_max: row.retry.doc_max,
        retryable: row.retry.doc_retryable,
        exhausted: row.retry.doc_exhausted,
        next_retry_at: row.retry.doc_next_at,
        last_attempt_at: row.retry.doc_last_at,
        error_type: row.retry.doc_error_type,
        error_code: row.retry.doc_error_code,
        failed_stage: row.retry.doc_failed_stage,
        retry_overdue: !!(
          row.retry.doc_retryable &&
          !row.retry.doc_exhausted &&
          docNext &&
          docNext < now
        ),
      },
      state: row.state,
    };
  });

  const statusOf = (r) =>
    pipelineFilter === 'document'
      ? (r.document_pipeline.task_status || '').toLowerCase()
      : (r.claim_pipeline.task_status || '').toLowerCase();

  if (pipelineFilter === 'claim') {
    rows = rows.filter((r) => r.claim_pipeline.task_id || r.claim_pipeline.task_status);
  } else if (pipelineFilter === 'document') {
    rows = rows.filter(
      (r) => r.document_pipeline.task_id || r.document_pipeline.task_status,
    );
  }

  if (outcome === 'none') {
    rows = rows.filter(
      (r) => !r.claim_pipeline.task_status && !r.document_pipeline.task_status,
    );
  } else if (outcome) {
    rows = rows.filter((r) =>
      pipelineFilter
        ? statusOf(r) === outcome
        : (r.claim_pipeline.task_status || '').toLowerCase() === outcome ||
          (r.document_pipeline.task_status || '').toLowerCase() === outcome,
    );
  }

  if (retryFilter === 'pending') {
    rows = rows.filter(
      (r) =>
        (r.claim_pipeline.retryable && !r.claim_pipeline.exhausted) ||
        (r.document_pipeline.retryable && !r.document_pipeline.exhausted),
    );
  } else if (retryFilter === 'exhausted') {
    rows = rows.filter(
      (r) => r.claim_pipeline.exhausted || r.document_pipeline.exhausted,
    );
  } else if (retryFilter === 'overdue') {
    rows = rows.filter(
      (r) => r.claim_pipeline.retry_overdue || r.document_pipeline.retry_overdue,
    );
  }

  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);

  const countBy = (getter) =>
    rows.reduce((acc, r) => {
      const key = getter(r) || 'not_started';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

  return NextResponse.json({
    data: rows.slice((safePage - 1) * limit, safePage * limit),
    page: safePage,
    limit,
    total,
    totalPages,
    summary: {
      claim_by_status: countBy((r) =>
        (r.claim_pipeline.task_status || '').toLowerCase(),
      ),
      document_by_status: countBy((r) =>
        (r.document_pipeline.task_status || '').toLowerCase(),
      ),
      retry_pending: rows.filter(
        (r) =>
          (r.claim_pipeline.retryable && !r.claim_pipeline.exhausted) ||
          (r.document_pipeline.retryable && !r.document_pipeline.exhausted),
      ).length,
      retry_exhausted: rows.filter(
        (r) => r.claim_pipeline.exhausted || r.document_pipeline.exhausted,
      ).length,
      retry_overdue: rows.filter(
        (r) => r.claim_pipeline.retry_overdue || r.document_pipeline.retry_overdue,
      ).length,
      awaiting_claim_id: rows.filter(
        (r) => r.claim_pipeline.claim_status === 'Success' && !r.claim_id,
      ).length,
    },
  });
});
