import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../lib/mongodb';
import { withAdmin } from '../../../../lib/adminAuth';
import ResourcePost from '../../../../models/resourcePost';
import ResourceTopic from '../../../../models/resourceTopic';
import { validateTopic } from '../../../../lib/resources/validate';
import { toTopicDTO } from '../../../../lib/resources/serialize';
import {
  invalid,
  logResourceActivity,
  refreshPublicResources,
} from '../../../../lib/resources/admin';

export const dynamic = 'force-dynamic';

/** Every topic with how many articles (of any status) use it. */
export const GET = withAdmin(async () => {
  await connectToDatabase();
  const [topics, counts] = await Promise.all([
    ResourceTopic.find({}).sort({ order: 1, name: 1 }).lean(),
    ResourcePost.aggregate([{ $group: { _id: '$topic', count: { $sum: 1 } } }]),
  ]);
  const countBy = new Map(counts.map((c) => [String(c._id), c.count]));
  return NextResponse.json({
    topics: topics.map((t) => toTopicDTO(t, countBy.get(String(t._id)) || 0)),
  });
});

export const POST = withAdmin(async (req, ctx, admin) => {
  const { value, errors } = validateTopic(await req.json());
  if (Object.keys(errors).length) return invalid(errors);
  await connectToDatabase();
  if (await ResourceTopic.exists({ slug: value.slug })) {
    return NextResponse.json(
      { error: 'That URL is already in use.', fields: { slug: 'Another topic already uses this slug.' } },
      { status: 409 },
    );
  }
  const doc = await ResourceTopic.create(value);
  await logResourceActivity(admin, 'resource_topic_created', `Created topic "${value.name}" (/resources/topic/${value.slug})`);
  refreshPublicResources();
  return NextResponse.json({ topic: toTopicDTO(doc.toObject(), 0) }, { status: 201 });
});
