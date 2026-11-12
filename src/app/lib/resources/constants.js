// The Resources section: articles the admin team writes about unclaimed
// property, published at /resources/<slug> and grouped into topics at
// /resources/topic/<slug>. Shared by the public pages, the admin console and
// the admin API so the limits below are enforced the same way everywhere.

export const RESOURCES_PATH = '/resources';
export const RESOURCES_NAME = 'Resources';

export const articlePath = (slug) => `${RESOURCES_PATH}/${slug}`;
export const topicPath = (slug) => `${RESOURCES_PATH}/topic/${slug}`;
export const mediaPath = (id) => `/media/${id}`;

// Slugs that would collide with routes inside /resources.
export const RESERVED_SLUGS = ['topic', 'feed', 'page', 'search', 'new', 'admin', 'media'];

export const LIMITS = {
  title: 160,
  slug: 100,
  excerpt: 320,
  authorName: 80,
  tags: 10,
  tag: 40,
  faqs: 12,
  faqQuestion: 200,
  faqAnswer: 1200,
  metaTitle: 70,
  metaDescription: 170,
  focusKeyword: 80,
  url: 500,
  imageAlt: 200,
  content: 300_000, // characters of HTML
  topicName: 60,
  topicDescription: 300,
  hubHeading: 120,
  hubIntro: 400,
};

// What search engines show without truncating, for the counters and checks in
// the editor. Longer text is allowed (up to LIMITS) but flagged.
export const SEO_GUIDE = {
  metaTitle: { min: 30, max: 60 },
  metaDescription: { min: 120, max: 160 },
  excerpt: { min: 80, max: 200 },
  minWords: 300,
};

export const POST_STATUSES = ['draft', 'published'];

export const DEFAULT_AUTHOR = 'CatchMyCash Team';

export const DEFAULT_HUB = {
  heading: 'Unclaimed money, explained.',
  intro:
    'Plain-English guides to finding, claiming and protecting money California is holding for you — written by the team that files these claims every day.',
  metaTitle: 'Unclaimed Money Guides & Resources',
  metaDescription:
    'Guides to California unclaimed property: how to search, what to file, how long claims take, inheritances and how to avoid scams. Free, plain-English resources.',
};

export const HUB_PAGE_SIZE = 9;
export const TOPIC_PAGE_SIZE = 12;

// Media uploads (cover, social and in-article images).
export const IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// The cache tag every public Resources read is filed under; admin changes
// invalidate it so a saved article is live on the next request.
export const RESOURCES_CACHE_TAG = 'resources';
