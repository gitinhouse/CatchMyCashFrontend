import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import { withAdmin } from '../../../lib/adminAuth';
import {
  caseJoinStages,
  toCaseRow,
  parseList,
  safeRegex,
  toObjectId,
} from '../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

const SORTABLE = {
  created_at: (r) => new Date(r.created_at || 0).getTime(),
  updated_at: (r) => new Date(r.updated_at || r.created_at || 0).getTime(),
  case_id: (r) => r.case_id || '',
  applicant: (r) => (r.applicant.name || '').toLowerCase(),
  total_value: (r) => r.total_value || 0,
  progress: (r) => r.state.progress,
  stage: (r) => r.state.stage_index,
  days_since_movement: (r) => r.state.days_since_movement,
};

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);

  const search = (searchParams.get('search') || '').trim();
  const statuses = parseList(searchParams, 'status');
  const stages = parseList(searchParams, 'stage');
  const attention = parseList(searchParams, 'attention');
  const claimStatuses = parseList(searchParams, 'claim_status');
  const claimTaskStatuses = parseList(searchParams, 'claim_task_status');
  const docTaskStatuses = parseList(searchParams, 'doc_task_status');
  const errorTypes = parseList(searchParams, 'error_type');
  const hasClaimId = searchParams.get('has_claim_id');
  const needsAttention = searchParams.get('needs_attention');
  const retryable = searchParams.get('retryable');
  const exhausted = searchParams.get('retry_exhausted');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');
  const minValue = parseFloat(searchParams.get('min_value'));
  const userId = searchParams.get('user_id');

  const sortBy = SORTABLE[searchParams.get('sort_by')] ? searchParams.get('sort_by') : 'created_at';
  const sortDir = searchParams.get('sort_dir') === 'asc' ? 1 : -1;

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit'), 10) || 20, 1),
    200,
  );

  await connectToDatabase();

  // Push what Mongo can evaluate cheaply into the pipeline; the derived
  // lifecycle filters run afterwards in memory.
  const preMatch = {};
  if (userId) {
    const oid = toObjectId(userId);
    if (!oid) {
      return NextResponse.json({ error: 'Invalid user_id' }, { status: 400 });
    }
    preMatch.user_id = oid;
  }
  if (claimStatuses.length) preMatch.claim_status = { $in: claimStatuses };
  if (claimTaskStatuses.length) {
    preMatch.claim_process_task_status = { $in: claimTaskStatuses };
  }
  if (docTaskStatuses.length) {
    preMatch.document_upload_task_status = { $in: docTaskStatuses };
  }
  if (errorTypes.length) preMatch.claim_error_type = { $in: errorTypes };
  // Each independent "any of these" condition becomes its own $and group, so
  // combining two of them intersects rather than unions.
  const anyOfGroups = [];
  if (hasClaimId === 'true') {
    preMatch.claim_id = { $nin: [null, ''] };
  } else if (hasClaimId === 'false') {
    anyOfGroups.push({
      $or: [{ claim_id: null }, { claim_id: '' }, { claim_id: { $exists: false } }],
    });
  }
  if (retryable === 'true') preMatch.claim_retryable = true;
  if (exhausted === 'true') {
    anyOfGroups.push({
      $or: [
        { claim_retry_exhausted: true },
        { document_upload_retry_exhausted: true },
      ],
    });
  }
  if (dateFrom || dateTo) {
    preMatch.createdAt = {};
    if (dateFrom) preMatch.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      preMatch.createdAt.$lte = to;
    }
  }

  if (anyOfGroups.length) preMatch.$and = anyOfGroups;

  const pipeline = [];
  if (Object.keys(preMatch).length) pipeline.push({ $match: preMatch });
  pipeline.push({ $sort: { createdAt: -1 } }, ...caseJoinStages());

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
          { property_ids: rx },
          { 'user_info.first_name': rx },
          { 'user_info.last_name': rx },
          { 'details.legal_name': rx },
          { 'details.email_id': rx },
          { 'details.contact_no': rx },
          { 'account.userEmail': rx },
          {
            $expr: {
              $regexMatch: {
                input: {
                  $concat: [
                    { $ifNull: ['$user_info.first_name', ''] },
                    ' ',
                    { $ifNull: ['$user_info.last_name', ''] },
                  ],
                },
                regex: rx.$regex,
                options: 'i',
              },
            },
          },
        ],
      },
    });
  }

  const docs = await UserCases.aggregate(pipeline).allowDiskUse(true);
  const now = new Date();
  let rows = docs.map((doc) => toCaseRow(doc, now));

  // ---- Derived filters ---------------------------------------------------
  if (statuses.length) {
    rows = rows.filter((r) => statuses.includes(r.state.status));
  }
  if (stages.length) {
    rows = rows.filter((r) => stages.includes(r.state.stage));
  }
  if (attention.length) {
    rows = rows.filter((r) =>
      attention.some((a) => r.state.attention_keys.includes(a)),
    );
  }
  if (needsAttention === 'true') {
    rows = rows.filter((r) => r.state.needs_attention);
  } else if (needsAttention === 'false') {
    rows = rows.filter((r) => !r.state.needs_attention);
  }
  if (!Number.isNaN(minValue)) {
    rows = rows.filter((r) => r.total_value >= minValue);
  }

  const accessor = SORTABLE[sortBy];
  rows.sort((a, b) => {
    const av = accessor(a);
    const bv = accessor(b);
    if (av < bv) return -1 * sortDir;
    if (av > bv) return 1 * sortDir;
    return 0;
  });

  const total = rows.length;
  const totalPages = Math.max(Math.ceil(total / limit), 1);
  const safePage = Math.min(page, totalPages);
  const paged = rows.slice((safePage - 1) * limit, safePage * limit);

  // Summary reflects the filtered set, not just the current page.
  const summary = rows.reduce(
    (acc, r) => {
      acc.total_value += r.total_value;
      if (r.state.needs_attention) acc.needs_attention += 1;
      if (r.state.is_approved) acc.approved += 1;
      if (r.state.status === 'failed') acc.failed += 1;
      return acc;
    },
    { total_value: 0, needs_attention: 0, approved: 0, failed: 0 },
  );

  return NextResponse.json({
    data: paged,
    page: safePage,
    limit,
    total,
    totalPages,
    summary,
    sort: { by: sortBy, dir: sortDir === 1 ? 'asc' : 'desc' },
  });
});
