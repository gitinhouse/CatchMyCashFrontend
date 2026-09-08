import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import User from '../../../models/UserInformation';
import UserLogin from '../../../models/userLogin';
import UserProperty from '../../../models/userProperty';
import UserDocs from '../../../models/userDocs';
import AdminActivity from '../../../models/adminActivity';
import { withAdmin } from '../../../lib/adminAuth';
import { caseJoinStages, toCaseRow } from '../../../lib/adminQueries';
import {
  CASE_STATUS,
  CASE_STATUS_META,
  PIPELINE_STAGES,
  ATTENTION_REASONS,
} from '../../../lib/claimLifecycle';

export const dynamic = 'force-dynamic';

const DAY_MS = 86400000;

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const rangeDays = Math.min(
    Math.max(parseInt(searchParams.get('range_days'), 10) || 30, 1),
    365,
  );

  await connectToDatabase();

  const now = new Date();
  const rangeStart = startOfDay(new Date(now.getTime() - (rangeDays - 1) * DAY_MS));
  const previousStart = new Date(rangeStart.getTime() - rangeDays * DAY_MS);

  // Every case is derived in memory: the lifecycle rules combine fields across
  // four collections, which is impractical to express as a single $switch.
  const [cases, totalUsers, accounts, propertyAgg, recentActivity] =
    await Promise.all([
      UserCases.aggregate([
        { $sort: { createdAt: -1 } },
        ...caseJoinStages(),
      ]).allowDiskUse(true),
      User.countDocuments({}),
      UserLogin.aggregate([
        { $group: { _id: '$userType', count: { $sum: 1 } } },
      ]),
      UserProperty.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 },
            claimed: { $sum: { $cond: ['$is_claimed', 1, 0] } },
          },
        },
      ]),
      AdminActivity.find({})
        .sort({ createdAt: -1 })
        .limit(12)
        .lean(),
    ]);

  const rows = cases.map((doc) => toCaseRow(doc, now));

  // ---- Headline counters -------------------------------------------------
  const byStatus = Object.values(CASE_STATUS).reduce((acc, key) => {
    acc[key] = 0;
    return acc;
  }, {});
  const byStage = PIPELINE_STAGES.reduce((acc, s) => {
    acc[s.key] = 0;
    return acc;
  }, {});
  const byAttention = Object.values(ATTENTION_REASONS).reduce((acc, r) => {
    acc[r.key] = 0;
    return acc;
  }, {});
  const byClaimError = {};

  let needsAttention = 0;
  let recoveredValue = 0;
  let pipelineValue = 0;
  let withClaimId = 0;
  let retryPending = 0;

  for (const row of rows) {
    byStatus[row.state.status] = (byStatus[row.state.status] || 0) + 1;
    byStage[row.state.stage] = (byStage[row.state.stage] || 0) + 1;
    for (const key of row.state.attention_keys) {
      byAttention[key] = (byAttention[key] || 0) + 1;
    }
    if (row.state.needs_attention) needsAttention += 1;
    if (row.claim_id) withClaimId += 1;
    if (row.retry.claim_retryable && !row.retry.claim_exhausted) {
      retryPending += 1;
    }
    if (row.retry.claim_error_type) {
      byClaimError[row.retry.claim_error_type] =
        (byClaimError[row.retry.claim_error_type] || 0) + 1;
    }
    if (row.state.is_approved) recoveredValue += row.total_value;
    else pipelineValue += row.total_value;
  }

  // ---- Trend: cases created and approved per day -------------------------
  const buckets = new Map();
  for (let i = 0; i < rangeDays; i += 1) {
    const day = startOfDay(new Date(rangeStart.getTime() + i * DAY_MS));
    buckets.set(day.toISOString().slice(0, 10), {
      date: day.toISOString().slice(0, 10),
      created: 0,
      approved: 0,
      failed: 0,
    });
  }

  let createdInRange = 0;
  let createdPrevRange = 0;
  for (const row of rows) {
    const created = row.created_at ? new Date(row.created_at) : null;
    if (!created) continue;
    if (created >= rangeStart) {
      createdInRange += 1;
      const key = startOfDay(created).toISOString().slice(0, 10);
      const bucket = buckets.get(key);
      if (bucket) {
        bucket.created += 1;
        if (row.state.is_approved) bucket.approved += 1;
        if (row.state.status === CASE_STATUS.FAILED) bucket.failed += 1;
      }
    } else if (created >= previousStart) {
      createdPrevRange += 1;
    }
  }

  const trend = Array.from(buckets.values());

  // ---- Conversion funnel -------------------------------------------------
  const total = rows.length;
  const reached = (stageKey) => {
    const idx = PIPELINE_STAGES.findIndex((s) => s.key === stageKey);
    return rows.filter((r) => r.state.stage_index >= idx).length;
  };
  const funnel = PIPELINE_STAGES.map((stage) => ({
    key: stage.key,
    label: stage.label,
    count: reached(stage.key),
    pct: total ? Math.round((reached(stage.key) / total) * 100) : 0,
  }));

  // ---- Most urgent cases for the dashboard queue preview -----------------
  const severityRank = { high: 0, medium: 1, low: 2 };
  const urgent = rows
    .filter((r) => r.state.needs_attention)
    .sort((a, b) => {
      const diff =
        severityRank[a.state.max_severity] - severityRank[b.state.max_severity];
      if (diff !== 0) return diff;
      return b.state.days_since_movement - a.state.days_since_movement;
    })
    .slice(0, 8)
    .map((r) => ({
      _id: r._id,
      case_id: r.case_id,
      claim_id: r.claim_id,
      applicant: r.applicant,
      status: r.state.status,
      status_label: r.state.status_label,
      attention: r.state.attention,
      days_since_movement: r.state.days_since_movement,
      total_value: r.total_value,
    }));

  const recentCases = rows.slice(0, 8).map((r) => ({
    _id: r._id,
    case_id: r.case_id,
    claim_id: r.claim_id,
    applicant: r.applicant,
    status: r.state.status,
    status_label: r.state.status_label,
    stage_label: r.state.stage_label,
    progress: r.state.progress,
    total_value: r.total_value,
    created_at: r.created_at,
  }));

  const docStats = await UserDocs.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        signed: {
          $sum: { $cond: [{ $ifNull: ['$signed_doc', false] }, 1, 0] },
        },
        agreement: {
          $sum: { $cond: [{ $ifNull: ['$filled_agreement_doc', false] }, 1, 0] },
        },
      },
    },
  ]);

  const accountsByType = accounts.reduce((acc, a) => {
    acc[a._id || 'Unknown'] = a.count;
    return acc;
  }, {});

  const property = propertyAgg[0] || { total: 0, count: 0, claimed: 0 };

  const pctChange =
    createdPrevRange === 0
      ? createdInRange > 0
        ? 100
        : 0
      : Math.round(((createdInRange - createdPrevRange) / createdPrevRange) * 100);

  return NextResponse.json({
    generated_at: now.toISOString(),
    range_days: rangeDays,
    totals: {
      users: totalUsers,
      accounts: accountsByType,
      cases: total,
      cases_in_range: createdInRange,
      cases_prev_range: createdPrevRange,
      cases_change_pct: pctChange,
      needs_attention: needsAttention,
      with_claim_id: withClaimId,
      retry_pending: retryPending,
      properties_selected: property.count,
      properties_claimed: property.claimed,
      property_value: property.total || 0,
      recovered_value: recoveredValue,
      pipeline_value: pipelineValue,
      document_records: docStats[0]?.total || 0,
      signed_agreements: docStats[0]?.signed || 0,
    },
    by_status: Object.entries(byStatus).map(([key, count]) => ({
      key,
      label: CASE_STATUS_META[key]?.label || key,
      tone: CASE_STATUS_META[key]?.tone || 'neutral',
      count,
      pct: total ? Math.round((count / total) * 100) : 0,
    })),
    by_stage: PIPELINE_STAGES.map((s) => ({
      key: s.key,
      label: s.label,
      short: s.short,
      count: byStage[s.key] || 0,
    })),
    by_attention: Object.values(ATTENTION_REASONS).map((r) => ({
      key: r.key,
      label: r.label,
      severity: r.severity,
      count: byAttention[r.key] || 0,
    })),
    by_claim_error: Object.entries(byClaimError).map(([key, count]) => ({
      key,
      count,
    })),
    funnel,
    trend,
    urgent,
    recent_cases: recentCases,
    recent_activity: recentActivity.map((a) => ({
      _id: String(a._id),
      action: a.action,
      summary: a.summary,
      admin_email: a.admin_email,
      case_id: a.case_id ? String(a.case_id) : null,
      case_number: a.case_number,
      created_at: a.createdAt,
    })),
  });
});
