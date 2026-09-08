import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '../../../../lib/mongodb';
import User from '../../../../models/UserInformation';
import UserDetails from '../../../../models/userDetails';
import UserCases from '../../../../models/userCases';
import UserProperty from '../../../../models/userProperty';
import UserDocs from '../../../../models/userDocs';
import UserLogin from '../../../../models/userLogin';
import UserNotifications from '../../../../models/notifications';
import UserReferral from '../../../../models/userReferral';
import ReferralLink from '../../../../models/ReferralLink';
import AdminActivity from '../../../../models/adminActivity';
import { withAdmin } from '../../../../lib/adminAuth';
import { toObjectId } from '../../../../lib/adminQueries';
import { deriveCaseState, DOC_LABELS, ALL_DOC_FIELDS } from '../../../../lib/claimLifecycle';
import { generateRandomPassword } from '../../../../lib/utils';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  const userId = toObjectId(id);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  await connectToDatabase();

  const user = await User.findById(userId).lean();
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [details, cases, properties, docsList, account, notifications, referrals, referralLink, activity] =
    await Promise.all([
      UserDetails.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
      UserCases.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
      UserProperty.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
      UserDocs.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
      UserLogin.findOne({ user_id: userId }).lean(),
      UserNotifications.find({ user_id: userId }).sort({ createdAt: -1 }).limit(50).lean(),
      UserReferral.find({ user_id: userId }).lean(),
      ReferralLink.findOne({ user_id: userId }).lean(),
      AdminActivity.find({ user_id: userId }).sort({ createdAt: -1 }).limit(50).lean(),
    ]);

  const now = new Date();
  const latestDetails = details[0] || null;

  const caseRows = cases.map((c) => {
    const caseProperties = properties.filter(
      (p) => String(p.case_id || '') === String(c._id),
    );
    const caseDocs =
      docsList.find((d) => String(d.case_id || '') === String(c._id)) ||
      docsList[0] ||
      null;
    const caseDetails =
      details.find((d) => String(d.case_id || '') === String(c._id)) ||
      latestDetails;

    return {
      _id: String(c._id),
      case_id: c.case_id,
      claim_id: c.claim_id || null,
      claim_status: c.claim_status || null,
      claim_process_task_status: c.claim_process_task_status || null,
      document_upload_task_status: c.document_upload_task_status || null,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
      submitted_at: c.submitted_at || null,
      property_count: caseProperties.length || (c.property_ids || []).length,
      state: deriveCaseState(
        c,
        {
          details: caseDetails,
          docs: caseDocs,
          properties: caseProperties.length ? caseProperties : properties,
        },
        now,
      ),
    };
  });

  const documents = docsList.flatMap((d) =>
    ALL_DOC_FIELDS.filter(
      (f) => typeof d[f] === 'string' && d[f].trim() !== '',
    ).map((f) => ({
      case_id: d.case_id ? String(d.case_id) : null,
      field: f,
      label: DOC_LABELS[f] || f,
      filename: String(d[f]).split('/').pop(),
      uploaded_at: d.createdAt,
    })),
  );

  return NextResponse.json({
    user: {
      _id: String(user._id),
      first_name: user.first_name,
      last_name: user.last_name,
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
      address: user.address,
      city: user.city,
      state: user.state,
      zip_code: user.zip_code,
      created_at: user.createdAt,
    },
    account: account
      ? {
          _id: String(account._id),
          email: account.userEmail,
          type: account.userType,
          created_at: account.createdAt,
        }
      : null,
    details: details.map((d) => ({
      _id: String(d._id),
      case_id: d.case_id ? String(d.case_id) : null,
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
    cases: caseRows,
    properties: properties.map((p) => ({
      _id: String(p._id),
      case_id: p.case_id ? String(p.case_id) : null,
      property_id: p.property_id,
      property_type: p.property_type,
      property_title: p.property_title,
      amount: p.amount,
      reported_date: p.reported_date,
      is_claimed: p.is_claimed,
      created_at: p.createdAt,
    })),
    documents,
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
    activity: activity.map((a) => ({
      _id: String(a._id),
      action: a.action,
      summary: a.summary,
      admin_email: a.admin_email,
      case_number: a.case_number,
      created_at: a.createdAt,
    })),
    summary: {
      case_count: caseRows.length,
      approved_count: caseRows.filter((c) => c.state.is_approved).length,
      attention_count: caseRows.filter((c) => c.state.needs_attention).length,
      property_count: properties.length,
      total_value: properties.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      recovered_value: caseRows
        .filter((c) => c.state.is_approved)
        .reduce((s, c) => s + c.state.total_value, 0),
      document_count: documents.length,
      unread_notifications: notifications.filter((n) => !n.status).length,
    },
  });
});

const PROFILE_FIELDS = ['first_name', 'last_name', 'address', 'city', 'state', 'zip_code'];

export const PATCH = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  const userId = toObjectId(id);
  if (!userId) {
    return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
  }

  const body = await req.json();
  await connectToDatabase();

  const existing = await User.findById(userId).lean();
  if (!existing) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const updates = {};
  const changes = {};
  for (const field of PROFILE_FIELDS) {
    if (!(field in body)) continue;
    const value = String(body[field] ?? '').trim();
    if (value === (existing[field] ?? '')) continue;
    updates[field] = value;
    changes[field] = { from: existing[field] ?? null, to: value };
  }

  if (Object.keys(updates).length) {
    await User.findByIdAndUpdate(userId, { $set: updates });
    await AdminActivity.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'user_updated',
      summary: `Updated profile for ${existing.first_name} ${existing.last_name}: ${Object.keys(
        changes,
      ).join(', ')}`,
      user_id: userId,
      changes,
    });
  }

  const result = { message: 'User updated', changes };

  // Account-level actions are audited separately from profile edits.
  if (body.account_type) {
    if (!['Admin', 'User'].includes(body.account_type)) {
      return NextResponse.json(
        { error: 'account_type must be Admin or User' },
        { status: 400 },
      );
    }
    const account = await UserLogin.findOne({ user_id: userId });
    if (!account) {
      return NextResponse.json(
        { error: 'This user has no login account' },
        { status: 404 },
      );
    }
    if (account.userType !== body.account_type) {
      const from = account.userType;
      account.userType = body.account_type;
      await account.save();
      await AdminActivity.create({
        admin_id: admin.id,
        admin_email: admin.email,
        action: 'user_role_updated',
        summary: `Changed role for ${account.userEmail}: ${from} → ${body.account_type}`,
        user_id: userId,
        changes: { userType: { from, to: body.account_type } },
      });
      result.account_type = body.account_type;
    }
  }

  if (body.reset_password === true) {
    const account = await UserLogin.findOne({ user_id: userId });
    if (!account) {
      return NextResponse.json(
        { error: 'This user has no login account' },
        { status: 404 },
      );
    }
    const newPassword = generateRandomPassword(10);
    account.userPassword = await bcrypt.hash(newPassword, 10);
    await account.save();
    await AdminActivity.create({
      admin_id: admin.id,
      admin_email: admin.email,
      action: 'user_updated',
      summary: `Reset password for ${account.userEmail}`,
      user_id: userId,
      changes: {},
    });
    // Returned once so the admin can pass it on; never stored in plain text.
    result.temporary_password = newPassword;
  }

  return NextResponse.json(result);
});
