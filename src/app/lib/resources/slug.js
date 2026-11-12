import { LIMITS, RESERVED_SLUGS } from './constants.js';

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** A URL slug from any text: "How Long Does It Take?" → "how-long-does-it-take". */
export function slugify(text) {
  return String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // accents
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, LIMITS.slug)
    .replace(/-+$/g, '');
}

/** null when the slug is usable, otherwise why not. */
export function slugProblem(slug) {
  if (!slug) return 'A URL slug is required.';
  if (slug.length > LIMITS.slug) return `Keep the slug under ${LIMITS.slug} characters.`;
  if (!SLUG_PATTERN.test(slug)) {
    return 'Use lowercase letters, numbers and single hyphens only (for example how-to-claim).';
  }
  if (RESERVED_SLUGS.includes(slug)) return `"${slug}" is reserved by the site. Choose another slug.`;
  return null;
}
