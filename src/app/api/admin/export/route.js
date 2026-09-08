import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import { withAdmin } from '../../../lib/adminAuth';
import { caseJoinStages, toCaseRow, parseList, safeRegex } from '../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

const COLUMNS = [
  ['case_id', (r) => r.case_id],
  ['claim_id', (r) => r.claim_id || ''],
  ['status', (r) => r.state.status_label],
  ['stage', (r) => r.state.stage_label],
  ['progress_pct', (r) => r.state.progress],
  ['applicant_name', (r) => r.applicant.name || ''],
  ['applicant_email', (r) => r.applicant.email || ''],
  ['applicant_phone', (r) => r.applicant.phone || ''],
  ['applicant_state', (r) => r.applicant.state || ''],
  ['property_count', (r) => r.property_count],
  ['total_value', (r) => r.total_value],
  ['claim_status', (r) => r.claim_status || ''],
  ['claim_task_status', (r) => r.claim_process_task_status || ''],
  ['document_task_status', (r) => r.document_upload_task_status || ''],
  ['documents_uploaded', (r) => r.state.document_count],
  ['missing_documents', (r) => r.state.missing_required_docs.join(' | ')],
  ['claim_retry_count', (r) => r.retry.claim_count],
  ['claim_retry_exhausted', (r) => r.retry.claim_exhausted],
  ['claim_error_type', (r) => r.retry.claim_error_type || ''],
  ['needs_attention', (r) => r.state.needs_attention],
  ['attention_reasons', (r) => r.state.attention.map((a) => a.label).join(' | ')],
  ['days_since_movement', (r) => r.state.days_since_movement],
  ['created_at', (r) => (r.created_at ? new Date(r.created_at).toISOString() : '')],
  ['submitted_at', (r) => (r.submitted_at ? new Date(r.submitted_at).toISOString() : '')],
];

function csvCell(value) {
  const str = value === null || value === undefined ? '' : String(value);
  // Guard against spreadsheet formula injection on export.
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const search = (searchParams.get('search') || '').trim();
  const statuses = parseList(searchParams, 'status');
  const attention = parseList(searchParams, 'attention');
  const needsAttention = searchParams.get('needs_attention');

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
  let rows = docs.map((d) => toCaseRow(d, now));

  if (statuses.length) rows = rows.filter((r) => statuses.includes(r.state.status));
  if (attention.length) {
    rows = rows.filter((r) =>
      attention.some((a) => r.state.attention_keys.includes(a)),
    );
  }
  if (needsAttention === 'true') rows = rows.filter((r) => r.state.needs_attention);

  const header = COLUMNS.map(([name]) => csvCell(name)).join(',');
  const body = rows
    .map((r) => COLUMNS.map(([, get]) => csvCell(get(r))).join(','))
    .join('\n');

  const stamp = now.toISOString().slice(0, 10);

  return new Response(`${header}\n${body}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="claims-export-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
});
