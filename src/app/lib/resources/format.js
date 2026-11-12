// Formatting shared by the public Resources pages and the admin preview.

/** "November 12, 2026" — fixed locale and time zone, so server and browser agree. */
export function formatArticleDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "Nov 12, 2026" for cards. */
export function formatShortDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** Whether an article was meaningfully edited after it was published. */
export function wasUpdated(post) {
  if (!post?.publishedAt || !post?.updatedAt) return false;
  return new Date(post.updatedAt) - new Date(post.publishedAt) > 24 * 60 * 60 * 1000;
}

// Generated covers for articles without an image: one of a few brand
// treatments, picked from the topic so a topic's articles look related.
const COVERS = [
  { bg: '#0A0A0A', fg: '#FFFFFF', muted: '#D4D4D4', ring: 'rgba(225,38,28,0.55)' },
  { bg: '#FCE9E7', fg: '#0A0A0A', muted: '#4A4A4A', ring: 'rgba(225,38,28,0.35)' },
  { bg: '#F0EEEB', fg: '#0A0A0A', muted: '#4A4A4A', ring: 'rgba(10,10,10,0.18)' },
  { bg: '#E1261C', fg: '#FFFFFF', muted: '#FCE9E7', ring: 'rgba(255,255,255,0.35)' },
];

export function coverPalette(key) {
  let hash = 0;
  for (const ch of String(key || 'resources')) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COVERS[hash % COVERS.length];
}
