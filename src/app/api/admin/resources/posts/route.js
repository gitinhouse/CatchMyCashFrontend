import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import { withAdmin } from '../../../../lib/adminAuth';
import { safeRegex } from '../../../../lib/adminQueries';
import ResourcePost from '../../../../models/resourcePost';
import ResourceTopic from '../../../../models/resourceTopic';
import { validatePost } from '../../../../lib/resources/validate';
import { toPostDTO, toTopicDTO } from '../../../../lib/resources/serialize';
import {
  invalid,
  logResourceActivity,
  refreshPublicResources,
} from '../../../../lib/resources/admin';
import { slugTaken } from './shared';

export const dynamic = 'force-dynamic';

const SORTS = {
  updated: { updated_at: -1, _id: -1 },
  published: { published_at: -1, _id: -1 },
  title: { title: 1, _id: 1 },
};

/** Articles for the admin list: filter by status, topic and text. */
export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') || '';
  const topic = searchParams.get('topic') || '';
  const search = (searchParams.get('search') || '').trim().slice(0, 100);
  const sort = SORTS[searchParams.get('sort')] || SORTS.updated;
  const page = Math.max(parseInt(searchParams.get('page'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(searchParams.get('limit'), 10) || 20, 1), 100);

  await connectToDatabase();
  const now = new Date();
  const filter = {};
  if (status === 'draft') filter.status = 'draft';
  if (status === 'published') Object.assign(filter, { status: 'published', published_at: { $lte: now } });
  if (status === 'scheduled') Object.assign(filter, { status: 'published', published_at: { $gt: now } });
  if (/^[a-f0-9]{24}$/i.test(topic)) filter.topic = topic;
  if (topic === 'none') filter.topic = null;
  if (search) {
    const rx = safeRegex(search);
    filter.$or = [{ title: rx }, { slug: rx }, { excerpt: rx }, { tags: rx }];
  }

  const [docs, total, topics, statusCounts] = await Promise.all([
    ResourcePost.find(filter)
      .select('-content -toc')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ResourcePost.countDocuments(filter),
    ResourceTopic.find({}).sort({ order: 1, name: 1 }).lean(),
    ResourcePost.aggregate([
      {
        $group: {
          _id: null,
          all: { $sum: 1 },
          draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
          published: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$status', 'published'] }, { $lte: ['$published_at', now] }] }, 1, 0],
            },
          },
          scheduled: {
            $sum: {
              $cond: [{ $and: [{ $eq: ['$status', 'published'] }, { $gt: ['$published_at', now] }] }, 1, 0],
            },
          },
        },
      },
    ]),
  ]);

  const topicsById = new Map(topics.map((t) => [String(t._id), toTopicDTO(t)]));
  const counts = statusCounts[0] || { all: 0, draft: 0, published: 0, scheduled: 0 };
  return NextResponse.json({
    posts: docs.map((d) => toPostDTO(d, topicsById, { withContent: false })),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    counts: { all: counts.all, draft: counts.draft, published: counts.published, scheduled: counts.scheduled },
  });
});

/** Create an article, as a draft or published straight away. */
export const POST = withAdmin(async (req, ctx, admin) => {
  const body = await req.json();
  const { value, errors } = validatePost(body);
  if (Object.keys(errors).length) return invalid(errors);

  await connectToDatabase();
  if (value.topic && !(await ResourceTopic.exists({ _id: value.topic }))) {
    return invalid({ topicId: 'That topic no longer exists. Choose another.' });
  }
  if (await slugTaken(value.slug)) {
    return NextResponse.json(
      { error: 'That URL is already in use.', fields: { slug: 'Another article already uses this URL. Choose a different slug.' } },
      { status: 409 },
    );
  }

  if (value.status === 'published' && !value.published_at) value.published_at = new Date();
  const doc = await ResourcePost.create({
    ...value,
    created_by: admin.email || '',
    updated_by: admin.email || '',
  });

  await logResourceActivity(
    admin,
    value.status === 'published' ? 'resource_post_published' : 'resource_post_created',
    `${value.status === 'published' ? 'Published' : 'Created draft'} "${value.title}" (/resources/${value.slug})`,
  );
  refreshPublicResources();

  const topic = value.topic ? await ResourceTopic.findById(value.topic).lean() : null;
  const topics = new Map(topic ? [[String(topic._id), toTopicDTO(topic)]] : []);
  return NextResponse.json({ post: toPostDTO(doc.toObject(), topics) }, { status: 201 });
});
