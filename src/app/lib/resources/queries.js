// Reads behind the public Resources pages, sitemap, feed and llms.txt.
// Results are cached and filed under one tag that every admin change
// invalidates (refreshPublicResources in admin.js), so pages stay fast without serving an
// article for long after it was edited or unpublished. The ten-minute expiry
// is only a backstop, and is also how a post scheduled for later appears.
import { unstable_cache } from 'next/cache';
import connectToDatabase from '../mongodb';
import ResourcePost from '../../models/resourcePost';
import ResourceTopic from '../../models/resourceTopic';
import ResourceSettings from '../../models/resourceSettings';
import { safeRegex } from '../adminQueries';
import { DEFAULT_HUB, RESOURCES_CACHE_TAG } from './constants';
import { prepareArticle } from './content';
import { toPostDTO, toSettingsDTO, toTopicDTO } from './serialize';

const CACHE = { tags: [RESOURCES_CACHE_TAG], revalidate: 600 };

// Published, and not scheduled for later.
const visible = () => ({ status: 'published', published_at: { $ne: null, $lte: new Date() } });

const LIST_FIELDS = '-content -toc -faqs -previous_slugs';
const byNewest = { published_at: -1, _id: -1 };

async function loadTopics() {
  await connectToDatabase();
  const [topics, counts] = await Promise.all([
    ResourceTopic.find({}).sort({ order: 1, name: 1 }).lean(),
    ResourcePost.aggregate([
      { $match: visible() },
      { $group: { _id: '$topic', count: { $sum: 1 } } },
    ]),
  ]);
  const countBy = new Map(counts.map((c) => [String(c._id), c.count]));
  return topics.map((t) => toTopicDTO(t, countBy.get(String(t._id)) || 0));
}

const topicIndex = (topics) => new Map(topics.map((t) => [t.id, t]));

/** Every topic, in display order, with its number of published articles. */
export const getTopics = unstable_cache(loadTopics, ['resources:topics'], CACHE);

export const getHubSettings = unstable_cache(
  async () => {
    await connectToDatabase();
    const doc = await ResourceSettings.findOne({ key: 'hub' }).lean();
    return toSettingsDTO(doc, DEFAULT_HUB);
  },
  ['resources:settings'],
  CACHE,
);

/**
 * A page of published articles, newest first.
 * @param {{ topicId?: string, q?: string, page?: number, pageSize?: number, excludeId?: string }} args
 */
export const listPosts = unstable_cache(
  async ({ topicId = '', q = '', page = 1, pageSize = 9, excludeId = '' } = {}) => {
    await connectToDatabase();
    const filter = visible();
    if (topicId) filter.topic = topicId;
    if (excludeId) filter._id = { $ne: excludeId };
    if (q) {
      const rx = safeRegex(q);
      filter.$or = [{ title: rx }, { excerpt: rx }, { tags: rx }];
    }
    const [docs, total, topics] = await Promise.all([
      ResourcePost.find(filter)
        .select(LIST_FIELDS)
        .sort(byNewest)
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      ResourcePost.countDocuments(filter),
      loadTopics(),
    ]);
    const topicsById = topicIndex(topics);
    return {
      posts: docs.map((d) => toPostDTO(d, topicsById, { withContent: false })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
    };
  },
  ['resources:list'],
  CACHE,
);

/** The article the hub leads with: the newest featured one, else the newest. */
export const getLeadPost = unstable_cache(
  async () => {
    await connectToDatabase();
    const doc =
      (await ResourcePost.findOne({ ...visible(), featured: true }).select(LIST_FIELDS).sort(byNewest).lean()) ||
      (await ResourcePost.findOne(visible()).select(LIST_FIELDS).sort(byNewest).lean());
    if (!doc) return null;
    return toPostDTO(doc, topicIndex(await loadTopics()), { withContent: false });
  },
  ['resources:lead'],
  CACHE,
);

/**
 * A published article by its slug.
 * @returns {Promise<{ post: object } | { redirectTo: string } | null>}
 *   redirectTo when the slug is one the article used to have.
 */
export const getPostBySlug = unstable_cache(
  async (slug) => {
    await connectToDatabase();
    const doc = await ResourcePost.findOne({ slug, ...visible() }).lean();
    if (!doc) {
      const moved = await ResourcePost.findOne({ previous_slugs: slug, ...visible() })
        .select('slug')
        .lean();
      return moved ? { redirectTo: moved.slug } : null;
    }
    // Stored HTML was cleaned on save; it is cleaned again here in case it was
    // written some other way.
    const prepared = prepareArticle(doc.content);
    return {
      post: toPostDTO({ ...doc, content: prepared.html, toc: prepared.toc }, topicIndex(await loadTopics())),
    };
  },
  ['resources:post'],
  CACHE,
);

/** Up to `limit` other articles: same topic first, then the newest. */
export const getRelatedPosts = unstable_cache(
  async (postId, topicId, limit = 3) => {
    await connectToDatabase();
    const base = { ...visible(), _id: { $ne: postId } };
    const sameTopic = topicId
      ? await ResourcePost.find({ ...base, topic: topicId }).select(LIST_FIELDS).sort(byNewest).limit(limit).lean()
      : [];
    const others =
      sameTopic.length < limit
        ? await ResourcePost.find({ ...base, _id: { $nin: [postId, ...sameTopic.map((d) => d._id)] } })
            .select(LIST_FIELDS)
            .sort(byNewest)
            .limit(limit - sameTopic.length)
            .lean()
        : [];
    const topicsById = topicIndex(await loadTopics());
    return [...sameTopic, ...others].map((d) => toPostDTO(d, topicsById, { withContent: false }));
  },
  ['resources:related'],
  CACHE,
);

/**
 * Every published article, newest first, for the sitemap, feed and llms.txt.
 * `indexable` is false for articles hidden from search engines or pointing
 * their canonical URL somewhere else.
 */
export const getAllPublished = unstable_cache(
  async () => {
    await connectToDatabase();
    const [docs, topics] = await Promise.all([
      ResourcePost.find(visible()).select(LIST_FIELDS).sort(byNewest).lean(),
      loadTopics(),
    ]);
    const topicsById = topicIndex(topics);
    return docs.map((d) => {
      const post = toPostDTO(d, topicsById, { withContent: false });
      return { ...post, indexable: !post.seo.noindex && !post.seo.canonicalUrl };
    });
  },
  ['resources:all'],
  CACHE,
);
