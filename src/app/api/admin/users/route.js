import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import User from '../../../models/UserInformation';
import { withAdmin } from '../../../lib/adminAuth';
import { safeRegex } from '../../../lib/adminQueries';
import { deriveCaseState } from '../../../lib/claimLifecycle';

export const dynamic = 'force-dynamic';

const SORTABLE = {
  created_at: (u) => new Date(u.created_at || 0).getTime(),
  name: (u) => (u.name || '').toLowerCase(),
  case_count: (u) => u.case_count,
  total_value: (u) => u.total_value,
  last_activity: (u) => new Date(u.last_activity || 0).getTime(),
};

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);

  const search = (searchParams.get('search') || '').trim();
  const hasAccount = searchParams.get('has_account');
  const hasCases = searchParams.get('has_cases');
  const accountType = searchParams.get('account_type');
  const needsAttention = searchParams.get('needs_attention');
  const dateFrom = searchParams.get('date_from');
  const dateTo = searchParams.get('date_to');

  const sortBy = SORTABLE[searchParams.get('sort_by')]
    ? searchParams.get('sort_by')
    : 'created_at';
  const sortDir = searchParams.get('sort_dir') === 'asc' ? 1 : -1;

  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit'), 10) || 20, 1),
    200,
  );

  await connectToDatabase();

  const preMatch = {};
  if (dateFrom || dateTo) {
    preMatch.createdAt = {};
    if (dateFrom) preMatch.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      preMatch.createdAt.$lte = to;
    }
  }

  const pipeline = [];
  if (Object.keys(preMatch).length) pipeline.push({ $match: preMatch });

  pipeline.push(
    {
      $lookup: {
        from: 'userdetails',
        localField: '_id',
        foreignField: 'user_id',
        as: 'details_list',
      },
    },
    {
      $lookup: {
        from: 'usercases',
        localField: '_id',
        foreignField: 'user_id',
        as: 'cases',
      },
    },
    {
      $lookup: {
        from: 'userproperties',
        localField: '_id',
        foreignField: 'user_id',
        as: 'properties',
      },
    },
    {
      $lookup: {
        from: 'userdocs',
        localField: '_id',
        foreignField: 'user_id',
        as: 'docs_list',
      },
    },
    {
      $lookup: {
        from: 'userlogins',
        localField: '_id',
        foreignField: 'user_id',
        as: 'accounts',
      },
    },
    {
      $addFields: {
        details: { $arrayElemAt: ['$details_list', 0] },
        account: { $arrayElemAt: ['$accounts', 0] },
      },
    },
  );

  if (search) {
    const rx = safeRegex(search);
    pipeline.push({
      $match: {
        $or: [
          { first_name: rx },
          { last_name: rx },
          { city: rx },
          { state: rx },
          { zip_code: rx },
          { 'details.email_id': rx },
          { 'details.contact_no': rx },
          { 'details.legal_name': rx },
          { 'account.userEmail': rx },
          { 'cases.case_id': rx },
          { 'cases.claim_id': rx },
        ],
      },
    });
  }

  if (hasAccount === 'true') pipeline.push({ $match: { account: { $ne: null } } });
  if (hasAccount === 'false') pipeline.push({ $match: { account: null } });
  if (accountType) pipeline.push({ $match: { 'account.userType': accountType } });
  if (hasCases === 'true') pipeline.push({ $match: { 'cases.0': { $exists: true } } });
  if (hasCases === 'false') pipeline.push({ $match: { 'cases.0': { $exists: false } } });

  const docs = await User.aggregate(pipeline).allowDiskUse(true);
  const now = new Date();

  let rows = docs.map((u) => {
    const properties = u.properties || [];
    const docsRow = (u.docs_list || [])[0] || null;
    const cases = (u.cases || []).map((c) => {
      const caseProperties = properties.filter(
        (p) => String(p.case_id || '') === String(c._id),
      );
      return {
        _id: String(c._id),
        case_id: c.case_id,
        claim_id: c.claim_id || null,
        created_at: c.createdAt,
        state: deriveCaseState(
          c,
          {
            details: u.details,
            docs: docsRow,
            properties: caseProperties.length ? caseProperties : properties,
          },
          now,
        ),
      };
    });

    const lastActivity = cases.reduce((latest, c) => {
      const t = new Date(c.created_at || 0).getTime();
      return t > latest ? t : latest;
    }, new Date(u.createdAt || 0).getTime());

    return {
      _id: String(u._id),
      name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || null,
      legal_name: u.details?.legal_name || null,
      email: u.details?.email_id || u.account?.userEmail || null,
      phone: u.details?.contact_no || null,
      address: u.address || null,
      city: u.city || null,
      state: u.state || null,
      zip_code: u.zip_code || null,
      created_at: u.createdAt,
      has_account: !!u.account,
      account_type: u.account?.userType || null,
      account_email: u.account?.userEmail || null,
      has_details: !!u.details,
      case_count: cases.length,
      property_count: properties.length,
      total_value: properties.reduce((s, p) => s + (Number(p.amount) || 0), 0),
      approved_count: cases.filter((c) => c.state.is_approved).length,
      attention_count: cases.filter((c) => c.state.needs_attention).length,
      last_activity: new Date(lastActivity),
      cases,
    };
  });

  if (needsAttention === 'true') {
    rows = rows.filter((u) => u.attention_count > 0);
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

  return NextResponse.json({
    data: rows.slice((safePage - 1) * limit, safePage * limit),
    page: safePage,
    limit,
    total,
    totalPages,
    summary: {
      with_account: rows.filter((u) => u.has_account).length,
      with_cases: rows.filter((u) => u.case_count > 0).length,
      needs_attention: rows.filter((u) => u.attention_count > 0).length,
      total_value: rows.reduce((s, u) => s + u.total_value, 0),
    },
    sort: { by: sortBy, dir: sortDir === 1 ? 'asc' : 'desc' },
  });
});
