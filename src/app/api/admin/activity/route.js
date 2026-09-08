import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import AdminActivity from '../../../models/adminActivity';
import { withAdmin } from '../../../lib/adminAuth';
import { parseList, safeRegex, toObjectId } from '../../../lib/adminQueries';

export const dynamic = 'force-dynamic';

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const actions = parseList(searchParams, 'action');
  const adminEmail = searchParams.get('admin_email');
  const caseId = searchParams.get('case_id');
  const userId = searchParams.get('user_id');
  const search = (searchParams.get('search') || '').trim();
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit'), 10) || 30, 1),
    200,
  );

  await connectToDatabase();

  const query = {};
  if (actions.length) query.action = { $in: actions };
  if (adminEmail) query.admin_email = adminEmail;
  if (caseId) {
    const oid = toObjectId(caseId);
    if (oid) query.case_id = oid;
    else query.case_number = caseId;
  }
  if (userId) {
    const oid = toObjectId(userId);
    if (oid) query.user_id = oid;
  }
  if (search) {
    const rx = safeRegex(search);
    query.$or = [{ summary: rx }, { case_number: rx }, { admin_email: rx }];
  }
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      query.createdAt.$lte = to;
    }
  }

  const [rows, total, actors, actionCounts] = await Promise.all([
    AdminActivity.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    AdminActivity.countDocuments(query),
    AdminActivity.distinct('admin_email'),
    AdminActivity.aggregate([
      { $match: query },
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
  ]);

  return NextResponse.json({
    data: rows.map((a) => ({
      _id: String(a._id),
      action: a.action,
      summary: a.summary,
      admin_email: a.admin_email,
      case_id: a.case_id ? String(a.case_id) : null,
      case_number: a.case_number,
      user_id: a.user_id ? String(a.user_id) : null,
      changes: a.changes || {},
      created_at: a.createdAt,
    })),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    actors: actors.filter(Boolean).sort(),
    action_counts: actionCounts.map((a) => ({ action: a._id, count: a.count })),
  });
});
