// Plain, JSON-safe shapes of Resources documents, shared by the admin API and
// the public pages (which cache them, so nothing here may be a Date or an
// ObjectId).

const iso = (value) => (value ? new Date(value).toISOString() : null);
const str = (value) => (value == null ? '' : String(value));

const image = (img) => ({ url: str(img?.url), alt: str(img?.alt) });

export function toTopicDTO(doc, postCount = 0) {
  if (!doc) return null;
  return {
    id: str(doc._id),
    name: str(doc.name),
    slug: str(doc.slug),
    description: str(doc.description),
    order: Number(doc.order) || 0,
    seo: {
      metaTitle: str(doc.seo?.meta_title),
      metaDescription: str(doc.seo?.meta_description),
    },
    postCount,
    updatedAt: iso(doc.updated_at),
  };
}

/**
 * @param {object} doc  a ResourcePost (lean or hydrated)
 * @param {Map<string, object>} [topics]  topic DTOs by id, to embed the topic
 * @param {{ withContent?: boolean }} [options]
 */
export function toPostDTO(doc, topics, { withContent = true } = {}) {
  if (!doc) return null;
  const topicId = doc.topic ? str(doc.topic._id || doc.topic) : '';
  const topic = topicId && topics ? topics.get(topicId) || null : null;
  return {
    id: str(doc._id),
    title: str(doc.title),
    slug: str(doc.slug),
    previousSlugs: Array.isArray(doc.previous_slugs) ? doc.previous_slugs.map(str) : [],
    excerpt: str(doc.excerpt),
    ...(withContent
      ? {
          content: str(doc.content),
          toc: Array.isArray(doc.toc)
            ? doc.toc.map((t) => ({ id: str(t.id), text: str(t.text), level: Number(t.level) || 2 }))
            : [],
        }
      : {}),
    wordCount: Number(doc.word_count) || 0,
    readingMinutes: Number(doc.reading_minutes) || 1,
    topicId,
    topic: topic ? { id: topic.id, name: topic.name, slug: topic.slug } : null,
    tags: Array.isArray(doc.tags) ? doc.tags.map(str) : [],
    authorName: str(doc.author_name),
    coverImage: image(doc.cover_image),
    faqs: Array.isArray(doc.faqs)
      ? doc.faqs.map((f) => ({ question: str(f.question), answer: str(f.answer) }))
      : [],
    status: doc.status === 'published' ? 'published' : 'draft',
    featured: Boolean(doc.featured),
    publishedAt: iso(doc.published_at),
    createdAt: iso(doc.created_at),
    updatedAt: iso(doc.updated_at),
    updatedBy: str(doc.updated_by),
    seo: {
      metaTitle: str(doc.seo?.meta_title),
      metaDescription: str(doc.seo?.meta_description),
      focusKeyword: str(doc.seo?.focus_keyword),
      canonicalUrl: str(doc.seo?.canonical_url),
      ogImage: image(doc.seo?.og_image),
      noindex: Boolean(doc.seo?.noindex),
    },
  };
}

export function toSettingsDTO(doc, defaults) {
  return {
    heading: str(doc?.heading) || defaults.heading,
    intro: str(doc?.intro) || defaults.intro,
    metaTitle: str(doc?.meta_title),
    metaDescription: str(doc?.meta_description),
    updatedAt: iso(doc?.updated_at),
  };
}
