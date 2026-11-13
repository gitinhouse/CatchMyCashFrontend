import sanitizeHtml from 'sanitize-html';
import { slugify } from './slug.js';
import { SITE_URL } from '../site.js';

// What an article may contain. Anything else the editor (or a pasted
// document) produces is dropped before the HTML is stored, and again before it
// is rendered: scripts, styles, event handlers, iframes, forms, data: and
// javascript: URLs never reach a visitor.
const ALLOWED_TAGS = [
  'h2', 'h3', 'h4', 'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's',
  'a', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre', 'hr',
  'img', 'figure', 'figcaption',
];

const siteHost = (() => {
  try {
    return new URL(SITE_URL).host.replace(/^www\./, '');
  } catch {
    return 'catchmycash.com';
  }
})();

const isExternal = (href) => {
  if (!/^https?:\/\//i.test(href)) return false;
  try {
    return new URL(href).host.replace(/^www\./, '') !== siteHost;
  } catch {
    return true;
  }
};

// Web, mail and phone links, site-relative paths and in-page anchors.
const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;

const SANITIZE_OPTIONS = {
  allowedTags: ALLOWED_TAGS,
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: { img: ['http', 'https'] },
  allowProtocolRelative: false,
  // The article title is the page's only H1; the deepest level kept is H4.
  transformTags: {
    h1: 'h2',
    h5: 'h4',
    h6: 'h4',
    a: (tagName, attribs) => {
      const href = (attribs.href || '').trim();
      // A link with nowhere safe to go keeps its words and loses the link:
      // span is not an allowed tag, so it is unwrapped.
      if (!SAFE_HREF.test(href)) return { tagName: 'span', attribs: {} };
      const out = { href };
      if (attribs.title) out.title = attribs.title;
      if (isExternal(href)) {
        out.target = '_blank';
        out.rel = 'noopener noreferrer';
      }
      return { tagName: 'a', attribs: out };
    },
    img: (tagName, attribs) => {
      const out = { src: attribs.src || '', alt: attribs.alt || '' };
      if (attribs.title) out.title = attribs.title;
      if (/^\d{1,4}$/.test(attribs.width || '')) out.width = attribs.width;
      if (/^\d{1,4}$/.test(attribs.height || '')) out.height = attribs.height;
      return { tagName: 'img', attribs: out };
    },
  },
  // Empty paragraphs (blank lines in the editor) and images with no source.
  exclusiveFilter: (frame) =>
    (frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length) ||
    (frame.tag === 'img' && !frame.attribs.src),
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function decodeEntities(text) {
  return String(text ?? '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (match, code) => {
    const lower = code.toLowerCase();
    if (lower in ENTITIES) return ENTITIES[lower];
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16) || 32);
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10) || 32);
    return match;
  });
}

/** The visible text of an HTML fragment, whitespace collapsed. */
export function plainText(html) {
  return decodeEntities(
    String(html ?? '')
      .replace(/<(br|\/p|\/h[1-6]|\/li|\/blockquote|\/figcaption)\b[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\s+/g, ' ')
    .trim();
}

export const countWords = (text) => (String(text).match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

/** Minutes to read at an unhurried 225 words a minute, never less than one. */
export const readingMinutes = (words) => Math.max(1, Math.round(words / 225));

/**
 * Clean an article body and derive what the page needs from it.
 *
 * @param {string} html  what the editor produced
 * @returns {{ html: string, toc: {id: string, text: string, level: number}[],
 *             wordCount: number, readingMinutes: number, text: string }}
 */
export function prepareArticle(html) {
  const clean = sanitizeHtml(String(html ?? ''), SANITIZE_OPTIONS);

  // Every H2/H3 gets a stable anchor so the table of contents (and anyone
  // sharing a link to a section) can point at it. Sanitizing removed any ids
  // the input carried, so these are the only ones.
  const used = new Map();
  const toc = [];
  const withIds = clean.replace(/<(h2|h3)>([\s\S]*?)<\/\1>/g, (match, tag, inner) => {
    const text = plainText(inner);
    if (!text) return match;
    let id = slugify(text) || 'section';
    const seen = used.get(id) || 0;
    used.set(id, seen + 1);
    if (seen) id = `${id}-${seen + 1}`;
    toc.push({ id, text, level: tag === 'h2' ? 2 : 3 });
    return `<${tag} id="${id}">${inner}</${tag}>`;
  });

  const text = plainText(withIds);
  const wordCount = countWords(text);
  return { html: withIds, toc, wordCount, readingMinutes: readingMinutes(wordCount), text };
}

/** The opening of the article as a summary, for posts saved without one. */
export function summarize(text, max = 200) {
  const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).replace(/[\s,;:.-]+$/, '')}…`;
}
