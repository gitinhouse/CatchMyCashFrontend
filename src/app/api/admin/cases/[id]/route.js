import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import UserCases from '../../../../models/userCases';
import UserNotifications from '../../../../models/notifications';
import UserReferral from '../../../../models/userReferral';
import ReferralLink from '../../../../models/ReferralLink';
import CaseNote from '../../../../models/caseNote';
import AdminActivity from '../../../../models/adminActivity';
import { withAdmin } from '../../../../lib/adminAuth';
import { caseJoinStages, toCaseRow, toObjectId } from '../../../../lib/adminQueries';
import { ALL_DOC_FIELDS, DOC_LABELS } from '../../../../lib/claimLifecycle';
import { getSignedDocumentUrl } from '../../../../lib/documentUrls';

export const dynamic = 'force-dynamic';

/** Resolve the `id` segment, which may be a Mongo _id, a case_id or a claim_id. */
async function findCaseId(id) {
  const oid = toObjectId(id);
  if (oid) {
    const byId = await UserCases.findById(oid).select('_id').lean();
    if (byId) return byId._id;
  }
  const byCase = await UserCases.findOne({
    $or: [{ case_id: id }, { claim_id: id }],
  })
    .select('_id')
    .lean();
  return byCase?._id || null;
}

export const GET = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  await connectToDatabase();

  const caseObjectId = await findCaseId(id);
  if (!caseObjectId) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const [doc] = await UserCases.aggregate([
    { $match: { _id: caseObjectId } },
    ...caseJoinStages(),
  ]);

  if (!doc) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const row = toCaseRow(doc);
  const userId = doc.user_id;

  const [notes, activity, notifications, referrals, referralLink, siblingCases] =
    await Promise.all([
      CaseNote.find({ case_id: caseObjectId }).sort({ createdAt: -1 }).lean(),
      AdminActivity.find({
        $or: [{ case_id: caseObjectId }, ...(userId ? [{ user_id: userId }] : [])],
      })
        .sort({ createdAt: -1 })
        .limit(100)
        .lean(),
      userId
        ? UserNotifications.find({ user_id: userId })
            .sort({ createdAt: -1 })
            .limit(50)
            .lean()
        : [],
      userId ? UserReferral.find({ user_id: userId }).lean() : [],
      userId ? ReferralLink.findOne({ user_id: userId }).lean() : null,
      userId
        ? UserCases.find({ user_id: userId, _id: { $ne: caseObjectId } })
            .select('_id case_id claim_id claim_status status createdAt')
            .sort({ createdAt: -1 })
            .lean()
        : [],
    ]);

  // Presign every stored document so admins can open them directly.
  const documents = [];
  for (const field of ALL_DOC_FIELDS) {
    const value = doc.docs?.[field];
    if (typeof value !== 'string' || !value.trim()) continue;
    documents.push({
      field,
      label: DOC_LABELS[field] || field,
      stored_value: value,
      filename: value.split('/').pop(),
      url: await getSignedDocumentUrl(value),
      uploaded_at: doc.docs?.createdAt || null,
    });
  }

  return NextResponse.json({
    case: row,
    raw_case: {
      poll_url: doc.poll_url || null,
      property_ids: doc.property_ids || [],
      claim_message: doc.claim_message || '',
      document_upload_message: doc.document_upload_message || '',
      claim_process_message: doc.claim_process_message || '',
    },
    applicant_account: doc.user_info
      ? {
          _id: String(doc.user_info._id),
          first_name: doc.user_info.first_name,
          last_name: doc.user_info.last_name,
          address: doc.user_info.address,
          city: doc.user_info.city,
          state: doc.user_info.state,
          zip_code: doc.user_info.zip_code,
          created_at: doc.user_info.createdAt,
        }
      : null,
    login_account: doc.account
      ? {
          _id: String(doc.account._id),
          email: doc.account.userEmail,
          type: doc.account.userType,
          created_at: doc.account.createdAt,
        }
      : null,
    submitted_details: (doc.user_details || []).map((d) => ({
      _id: String(d._id),
      legal_name: d.legal_name,
      date_of_birth: d.date_of_birth,
      email_id: d.email_id,
      contact_no: d.contact_no,
      ssn_last4: d.ssn_id ? String(d.ssn_id).slice(-4) : null,
      company_name: d.company_name || '',
      address: d.address,
      city: d.city,
      state: d.state,
      zip_code: d.zip_code,
      formal_employer: d.formal_employer || '',
      previous_address: d.previous_address || '',
      created_at: d.createdAt,
    })),
    properties: (doc.user_properties || []).map((p) => ({
      _id: String(p._id),
      property_id: p.property_id,
      property_type: p.property_type,
      property_title: p.property_title,
      amount: p.amount,
      reported_date: p.reported_date,
      status: p.status,
      is_claimed: p.is_claimed,
      created_at: p.createdAt,
    })),
    documents,
    missing_documents: row.state.missing_required_docs.map((f) => ({
      field: f,
      label: DOC_LABELS[f] || f,
    })),
    notes: notes.map((n) => ({
      _id: String(n._id),
      body: n.body,
      pinned: n.pinned,
      admin_email: n.admin_email,
      created_at: n.createdAt,
    })),
    activity: activity.map((a) => ({
      _id: String(a._id),
      action: a.action,
      summary: a.summary,
      admin_email: a.admin_email,
      changes: a.changes,
      created_at: a.createdAt,
    })),
    notifications: notifications.map((n) => ({
      _id: String(n._id),
      title: n.title,
      message: n.message,
      read: n.status,
      created_at: n.createdAt,
    })),
    referrals: {
      link: referralLink
        ? { code: referralLink.referral_code, created_at: referralLink.createdAt }
        : null,
      earned: referrals.map((r) => ({
        _id: String(r._id),
        referral_code: r.referral_code,
        linked_user: r.linked_user,
        commission: r.comission,
        status: r.status,
        created_at: r.createdAt,
      })),
    },
    other_cases: siblingCases.map((c) => ({
      _id: String(c._id),
      case_id: c.case_id,
      claim_id: c.claim_id,
      claim_status: c.claim_status,
      approved: c.status === false,
      created_at: c.createdAt,
    })),
  });
});

/** Fields an admin may write directly, with light validation. */
const EDITABLE = {
  status: { type: 'boolean', action: 'case_status_updated', label: 'Case approval' },
  claim_status: {
    type: 'enum',
    values: ['Success', 'Pending', 'Failed'],
    action: 'claim_status_updated',
    label: 'Claim status',
  },
  claim_id: { type: 'string', action: 'claim_id_updated', label: 'Claim ID' },
  automation_id: { type: 'string', action: 'case_fields_updated', label: 'Automation ID' },
  claim_message: { type: 'string', action: 'case_fields_updated', label: 'Claim message' },
  claim_process_task_status: {
    type: 'string',
    action: 'case_fields_updated',
    label: 'Claim task status',
  },
  document_upload_task_status: {
    type: 'string',
    action: 'case_fields_updated',
    label: 'Document task status',
  },
  document_upload_message: {
    type: 'string',
    action: 'case_fields_updated',
    label: 'Document message',
  },
  claim_process_stage: {
    type: 'number',
    action: 'claim_stage_updated',
    label: 'Claim stage',
  },
  claim_retryable: {
    type: 'boolean',
    action: 'retry_flag_updated',
    label: 'Claim retryable',
  },
  claim_retry_exhausted: {
    type: 'boolean',
    action: 'retry_flag_updated',
    label: 'Claim retries exhausted',
  },
  document_upload_retryable: {
    type: 'boolean',
    action: 'retry_flag_updated',
    label: 'Document retryable',
  },
  document_upload_retry_exhausted: {
    type: 'boolean',
    action: 'retry_flag_updated',
    label: 'Document retries exhausted',
  },
  submitted_at: { type: 'date', action: 'case_fields_updated', label: 'Submitted at' },
};

export const PATCH = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  const body = await req.json();
  await connectToDatabase();

  const caseObjectId = await findCaseId(id);
  if (!caseObjectId) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const existing = await UserCases.findById(caseObjectId).lean();
  const updates = {};
  const changes = {};
  const actions = new Set();

  // `reset_retry` is a convenience action rather than a raw field write.
  if (body.reset_retry === 'claim' || body.reset_retry === 'both') {
    updates.claim_retry_count = 0;
    updates.claim_retry_exhausted = false;
    updates.claim_retryable = true;
    updates.claim_next_retry_at = new Date();
    changes.claim_retry = { from: existing.claim_retry_count || 0, to: 0 };
    actions.add('retry_reset');
  }
  if (body.reset_retry === 'document' || body.reset_retry === 'both') {
    updates.document_upload_retry_count = 0;
    updates.document_upload_retry_exhausted = false;
    updates.document_upload_retryable = true;
    updates.document_upload_next_retry_at = new Date();
    changes.document_upload_retry = {
      from: existing.document_upload_retry_count || 0,
      to: 0,
    };
    actions.add('retry_reset');
  }

  for (const [field, meta] of Object.entries(EDITABLE)) {
    if (!(field in body)) continue;
    let value = body[field];

    if (value === '' && meta.type !== 'string') value = null;

    if (meta.type === 'boolean') {
      value = value === true || value === 'true';
    } else if (meta.type === 'number') {
      value = value === null ? null : Number(value);
      if (value !== null && Number.isNaN(value)) {
        return NextResponse.json(
          { error: `${meta.label} must be a number` },
          { status: 400 },
        );
      }
    } else if (meta.type === 'enum') {
      if (value !== null && !meta.values.includes(value)) {
        return NextResponse.json(
          { error: `${meta.label} must be one of ${meta.values.join(', ')}` },
          { status: 400 },
        );
      }
    } else if (meta.type === 'date') {
      value = value ? new Date(value) : null;
      if (value && Number.isNaN(value.getTime())) {
        return NextResponse.json(
          { error: `${meta.label} is not a valid date` },
          { status: 400 },
        );
      }
    } else if (meta.type === 'string') {
      value = value === null ? null : String(value).trim();
    }

    const before = existing[field] ?? null;
    const beforeComparable = before instanceof Date ? before.toISOString() : before;
    const afterComparable = value instanceof Date ? value.toISOString() : value;
    if (beforeComparable === afterComparable) continue;

    updates[field] = value;
    changes[field] = { from: beforeComparable, to: afterComparable };
    actions.add(meta.action);
  }

  if (!Object.keys(updates).length) {
    return NextResponse.json(
      { message: 'No changes applied', case_id: existing.case_id },
      { status: 200 },
    );
  }

  const updated = await UserCases.findByIdAndUpdate(
    caseObjectId,
    { $set: updates },
    { new: true },
  ).lean();

  const summaryParts = Object.entries(changes).map(
    ([field, { from, to }]) => `${field}: ${from ?? '—'} → ${to ?? '—'}`,
  );

  await AdminActivity.create({
    admin_id: admin.id,
    admin_email: admin.email,
    action: actions.size === 1 ? [...actions][0] : 'case_fields_updated',
    summary: `Updated case ${existing.case_id}: ${summaryParts.join('; ')}`.slice(0, 500),
    case_id: caseObjectId,
    case_number: existing.case_id,
    user_id: existing.user_id || null,
    changes,
  });

  // Optionally tell the claimant what changed.
  if (body.notify_user?.title && body.notify_user?.message && existing.user_id) {
    await UserNotifications.create({
      user_id: existing.user_id,
      title: String(body.notify_user.title).slice(0, 200),
      message: String(body.notify_user.message).slice(0, 2000),
      status: false,
    });
    await AdminActivity.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'notification_sent',
      summary: `Notified applicant on case ${existing.case_id}: ${body.notify_user.title}`,
      case_id: caseObjectId,
      case_number: existing.case_id,
      user_id: existing.user_id,
      changes: {},
    });
  }

  return NextResponse.json({
    message: 'Case updated',
    changes,
    case: {
      _id: String(updated._id),
      case_id: updated.case_id,
      claim_id: updated.claim_id,
      status: updated.status,
      claim_status: updated.claim_status,
    },
  });
});
