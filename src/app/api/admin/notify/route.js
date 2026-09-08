import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserCases from '../../../models/userCases';
import UserNotifications from '../../../models/notifications';
import AdminActivity from '../../../models/adminActivity';
import { withAdmin } from '../../../lib/adminAuth';
import { toObjectId } from '../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

/**
 * Send an in-app notification to a claimant. Reuses the same UserNotifications
 * collection the claimant dashboard already polls.
 */
export const POST = withAdmin(async (req, ctx, admin) => {
  const body = await req.json();
  const title = String(body.title || '').trim();
  const message = String(body.message || '').trim();
  const userId = toObjectId(body.user_id);
  const caseId = body.case_id ? toObjectId(body.case_id) : null;

  if (!userId) {
    return NextResponse.json({ error: 'A valid user_id is required' }, { status: 400 });
  }
  if (!title || !message) {
    return NextResponse.json(
      { error: 'Both title and message are required' },
      { status: 400 },
    );
  }

  await connectToDatabase();

  const notification = await UserNotifications.create({
    user_id: userId,
    title: title.slice(0, 200),
    message: message.slice(0, 2000),
    status: false,
  });

  const relatedCase = caseId
    ? await UserCases.findById(caseId).select('case_id').lean()
    : null;

  await AdminActivity.create({
    admin_id: admin.id,
    admin_email: admin.email,
    action: 'notification_sent',
    summary: `Sent notification "${title}"${
      relatedCase ? ` for case ${relatedCase.case_id}` : ''
    }`,
    case_id: caseId,
    case_number: relatedCase?.case_id || null,
    user_id: userId,
    changes: {},
  });

  return NextResponse.json(
    {
      message: 'Notification sent',
      data: {
        _id: String(notification._id),
        title: notification.title,
        created_at: notification.createdAt,
      },
    },
    { status: 201 },
  );
});
