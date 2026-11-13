import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../lib/mongodb';
import { withAdmin } from '../../../../../lib/adminAuth';
import ResourcePost from '../../../../../models/resourcePost';
import ResourceTopic from '../../../../../models/resourceTopic';
import { validateTopic } from '../../../../../lib/resources/validate';
import { toTopicDTO } from '../../../../../lib/resources/serialize';
import {
  invalid,
  logResourceActivity,
  refreshPublicResources,
} from '../../../../../lib/resources/admin';

export const dynamic = 'force-dynamic';

const validId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));
const notFound = () => NextResponse.json({ error: 'Topic not found.' }, { status: 404 });

export const PUT = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  if (!validId(id)) return notFound();
  const { value, errors } = validateTopic(await req.json());
  if (Object.keys(errors).length) return invalid(errors);

  await connectToDatabase();
  const existing = await ResourceTopic.findById(id).lean();
  if (!existing) return notFound();
  if (value.slug !== existing.slug && (await ResourceTopic.exists({ slug: value.slug, _id: { $ne: id } }))) {
    return NextResponse.json(
      { error: 'That URL is already in use.', fields: { slug: 'Another topic already uses this slug.' } },
      { status: 409 },
    );
  }

  const updated = await ResourceTopic.findByIdAndUpdate(id, value, { new: true, runValidators: true }).lean();
  const changes = {};
  if (existing.slug !== value.slug) changes.slug = { from: existing.slug, to: value.slug };
  if (existing.name !== value.name) changes.name = { from: existing.name, to: value.name };
  await logResourceActivity(admin, 'resource_topic_updated', `Updated topic "${value.name}"`, changes);
  refreshPublicResources();

  const count = await ResourcePost.countDocuments({ topic: id });
  return NextResponse.json({ topic: toTopicDTO(updated, count) });
});

/** Only an empty topic can be deleted, so no article is left without one. */
export const DELETE = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  if (!validId(id)) return notFound();
  await connectToDatabase();
  const count = await ResourcePost.countDocuments({ topic: id });
  if (count) {
    return NextResponse.json(
      {
        error: `${count} article${count === 1 ? ' uses' : 's use'} this topic. Move ${count === 1 ? 'it' : 'them'} to another topic first.`,
      },
      { status: 409 },
    );
  }
  const doc = await ResourceTopic.findByIdAndDelete(id).lean();
  if (!doc) return notFound();
  await logResourceActivity(admin, 'resource_topic_deleted', `Deleted topic "${doc.name}"`);
  refreshPublicResources();
  return NextResponse.json({ ok: true });
});
