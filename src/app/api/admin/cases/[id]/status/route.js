import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../lib/mongodb';
import UserCases from '../../../../../models/userCases';
import CaseStatusHistory from '../../../../../models/caseStatusHistory';
import AdminActivity from '../../../../../models/adminActivity';
import UserNotifications from '../../../../../models/notifications';
import { withAdmin } from '../../../../../lib/adminAuth';
import { toObjectId } from '../../../../../lib/adminQueries';
import {
  caseStatusLabel,
  isValidCaseStatus,
  requiresClaimantAction,
} from '../../../../../lib/caseStatuses';

export const dynamic = 'force-dynamic';

const MAX_NOTE_LENGTH = 2000;

/** Resolve the `id` segment, which may be a Mongo _id, a case_id or a claim_id. */
async function loadCase(id) {
  const oid = toObjectId(id);
  if (oid) {
    const byId = await UserCases.findById(oid)
      .select('_id case_id claim_id user_id case_status')
      .lean();
    if (byId) return byId;
  }
  return UserCases.findOne({ $or: [{ case_id: id }, { claim_id: id }] })
    .select('_id case_id claim_id user_id case_status')
    .lean();
}

/** The status trail for a case, newest first. */
export const GET = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  await connectToDatabase();

  const found = await loadCase(id);
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const history = await CaseStatusHistory.find({ case_id: found._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({
    current: {
      status: found.case_status || null,
      label: caseStatusLabel(found.case_status),
    },
    data: history.map((h) => ({
      _id: String(h._id),
      status: h.status,
      label: caseStatusLabel(h.status) || h.status,
      previous_status: h.previous_status,
      previous_label: h.previous_status
        ? caseStatusLabel(h.previous_status) || h.previous_status
        : null,
      note: h.note || '',
      case_number: h.case_number,
      claim_id: h.claim_id,
      updated_by_email: h.updated_by_email,
      created_at: h.createdAt,
    })),
  });
});

/**
 * Record a status change.
 *
 * Writes the history row first, then denormalises the new value onto the case,
 * audits the action, and tells the claimant. The note is written verbatim to
 * both the history and the notification, because it is the explanation the
 * claimant sees on their tracking page.
 */
export const POST = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  const body = await req.json();

  const status = String(body.status || '').trim();
  const note = String(body.note || '').trim();

  if (!status) {
    return NextResponse.json({ error: 'A status is required' }, { status: 400 });
  }
  if (!isValidCaseStatus(status)) {
    return NextResponse.json(
      { error: `Unknown status "${status}"` },
      { status: 400 },
    );
  }
  if (note.length > MAX_NOTE_LENGTH) {
    return NextResponse.json(
      { error: `Note is too long (max ${MAX_NOTE_LENGTH} characters)` },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const found = await loadCase(id);
  if (!found) {
    return NextResponse.json({ error: 'Case not found' }, { status: 404 });
  }

  const previousStatus = found.case_status || null;
  const label = caseStatusLabel(status);

  // Re-selecting the same status is allowed: admins use it to attach a further
  // note to the current stage, and that still belongs in the trail.
  const entry = await CaseStatusHistory.create({
    case_id: found._id,
    case_number: found.case_id || null,
    claim_id: found.claim_id || null,
    user_id: found.user_id,
    status,
    previous_status: previousStatus,
    note,
    updated_by: admin.id,
    updated_by_email: admin.email,
  });

  await UserCases.updateOne(
    { _id: found._id },
    {
      $set: {
        case_status: status,
        case_status_note: note,
        case_status_updated_at: entry.createdAt,
        case_status_updated_by: admin.email,
      },
    },
  );

  await AdminActivity.create({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'case_workflow_status_updated',
    summary: `Case ${found.case_id} status: ${
      previousStatus ? caseStatusLabel(previousStatus) || previousStatus : '—'
    } → ${label}${note ? ` — ${note.slice(0, 160)}` : ''}`.slice(0, 500),
    case_id: found._id,
    case_number: found.case_id,
    user_id: found.user_id || null,
    changes: { case_status: { from: previousStatus, to: status } },
  });

  // Tell the claimant. A notification problem must never fail the update.
  if (found.user_id) {
    try {
      await UserNotifications.create({
        user_id: found.user_id,
        title: requiresClaimantAction(status)
          ? `Action needed: ${label}`
          : `Claim update: ${label}`,
        message: note
          ? `${found.case_id} is now "${label}". ${note}`
          : `${found.case_id} is now "${label}".`,
        status: false,
      });
    } catch (error) {
      console.error(
        '[admin/status] notification failed:',
        error.message,
      );
    }
  }

  return NextResponse.json(
    {
      message: 'Status updated',
      data: {
        _id: String(entry._id),
        status,
        label,
        previous_status: previousStatus,
        note,
        updated_by_email: admin.email,
        created_at: entry.createdAt,
      },
    },
    { status: 201 },
  );
});
