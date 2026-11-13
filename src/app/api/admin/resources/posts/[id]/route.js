import { NextResponse } from 'next/server';
import connectToDatabase from '../../../../../lib/mongodb';
import { withAdmin } from '../../../../../lib/adminAuth';
import ResourcePost from '../../../../../models/resourcePost';
import ResourceTopic from '../../../../../models/resourceTopic';
import { validatePost } from '../../../../../lib/resources/validate';
import { toPostDTO, toTopicDTO } from '../../../../../lib/resources/serialize';
import {
  invalid,
  logResourceActivity,
  refreshPublicResources,
} from '../../../../../lib/resources/admin';
import { slugTaken } from '../shared';

export const dynamic = 'force-dynamic';

const MAX_PREVIOUS_SLUGS = 20;
const validId = (id) => /^[a-f0-9]{24}$/i.test(String(id || ''));
const notFound = () => NextResponse.json({ error: 'Article not found.' }, { status: 404 });

async function withTopic(doc) {
  const topic = doc.topic ? await ResourceTopic.findById(doc.topic).lean() : null;
  return toPostDTO(doc, new Map(topic ? [[String(topic._id), toTopicDTO(topic)]] : []));
}

export const GET = withAdmin(async (req, ctx) => {
  const { id } = await ctx.params;
  if (!validId(id)) return notFound();
  await connectToDatabase();
  const doc = await ResourcePost.findById(id).lean();
  if (!doc) return notFound();
  return NextResponse.json({ post: await withTopic(doc) });
});

/** Save the editor's whole form over the article. */
export const PUT = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  if (!validId(id)) return notFound();
  const body = await req.json();
  const { value, errors } = validatePost(body);
  if (Object.keys(errors).length) return invalid(errors);

  await connectToDatabase();
  const existing = await ResourcePost.findById(id).lean();
  if (!existing) return notFound();

  // Someone else saved since this editor loaded the article: say so rather
  // than silently overwrite their work, unless the admin chose to.
  if (
    body.expectedUpdatedAt &&
    !body.force &&
    new Date(existing.updated_at).getTime() !== new Date(body.expectedUpdatedAt).getTime()
  ) {
    return NextResponse.json(
      {
        error: `This article was changed${existing.updated_by ? ` by ${existing.updated_by}` : ''} after you opened it.`,
        conflict: true,
      },
      { status: 409 },
    );
  }

  if (value.topic && !(await ResourceTopic.exists({ _id: value.topic }))) {
    return invalid({ topicId: 'That topic no longer exists. Choose another.' });
  }

  const slugChanged = value.slug !== existing.slug;
  if (slugChanged && (await slugTaken(value.slug, id))) {
    return NextResponse.json(
      { error: 'That URL is already in use.', fields: { slug: 'Another article already uses this URL. Choose a different slug.' } },
      { status: 409 },
    );
  }

  // A published article's old address keeps working: it redirects here.
  let previous = (existing.previous_slugs || []).filter((s) => s !== value.slug);
  if (slugChanged && existing.status === 'published' && existing.published_at) {
    previous = [existing.slug, ...previous.filter((s) => s !== existing.slug)].slice(0, MAX_PREVIOUS_SLUGS);
  }

  const publishing = value.status === 'published';
  const publishedAt = value.published_at || existing.published_at || (publishing ? new Date() : null);

  const updated = await ResourcePost.findByIdAndUpdate(
    id,
    {
      ...value,
      published_at: publishedAt,
      previous_slugs: previous,
      updated_by: admin.email || '',
    },
    { new: true, runValidators: true },
  ).lean();

  const wasPublished = existing.status === 'published';
  const action =
    !wasPublished && publishing
      ? 'resource_post_published'
      : wasPublished && !publishing
        ? 'resource_post_unpublished'
        : 'resource_post_updated';
  const changes = {};
  if (slugChanged) changes.slug = { from: existing.slug, to: value.slug };
  if (existing.status !== value.status) changes.status = { from: existing.status, to: value.status };
  if (existing.title !== value.title) changes.title = { from: existing.title, to: value.title };
  if (Boolean(existing.seo?.noindex) !== value.seo.noindex) {
    changes.noindex = { from: Boolean(existing.seo?.noindex), to: value.seo.noindex };
  }
  const verb = { resource_post_published: 'Published', resource_post_unpublished: 'Unpublished' }[action] || 'Updated';
  await logResourceActivity(admin, action, `${verb} "${value.title}" (/resources/${value.slug})`, changes);
  refreshPublicResources();

  return NextResponse.json({ post: await withTopic(updated) });
});

export const DELETE = withAdmin(async (req, ctx, admin) => {
  const { id } = await ctx.params;
  if (!validId(id)) return notFound();
  await connectToDatabase();
  const doc = await ResourcePost.findByIdAndDelete(id).lean();
  if (!doc) return notFound();
  await logResourceActivity(admin, 'resource_post_deleted', `Deleted "${doc.title}" (/resources/${doc.slug})`, {
    status: { from: doc.status, to: 'deleted' },
  });
  refreshPublicResources();
  return NextResponse.json({ ok: true });
});
