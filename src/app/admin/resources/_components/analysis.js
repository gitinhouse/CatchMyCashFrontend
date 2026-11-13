// What the SEO checklist and the editor's counters read from an article.
import { SEO_GUIDE, articlePath } from '../../../lib/resources/constants';
import { slugify } from '../../../lib/resources/slug';

const EMPTY = {
  words: 0,
  headings: [],
  h2: 0,
  firstParagraph: '',
  internalLinks: 0,
  externalLinks: 0,
  images: 0,
  imagesWithoutAlt: 0,
};

export const countWords = (text) => (String(text || '').match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;

/** Parses the editor's HTML in an inert document: nothing in it runs or loads. */
export function analyzeContent(html) {
  if (!html || typeof window === 'undefined' || typeof DOMParser === 'undefined') return EMPTY;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const headings = [...doc.querySelectorAll('h2, h3, h4')].map((h) => ({
    level: Number(h.tagName.slice(1)),
    text: h.textContent.trim(),
  }));
  let internalLinks = 0;
  let externalLinks = 0;
  for (const a of doc.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || '';
    if (/^\/(?!\/)/.test(href) || /^https?:\/\/(www\.)?catchmycash\.com/i.test(href)) internalLinks += 1;
    else if (/^https?:\/\//i.test(href)) externalLinks += 1;
  }
  const images = [...doc.querySelectorAll('img')];
  const firstP = [...doc.querySelectorAll('p')].find((p) => p.textContent.trim());
  return {
    words: countWords(doc.body.textContent),
    headings,
    h2: headings.filter((h) => h.level === 2).length,
    firstParagraph: firstP ? firstP.textContent.trim() : '',
    internalLinks,
    externalLinks,
    images: images.length,
    imagesWithoutAlt: images.filter((img) => !(img.getAttribute('alt') || '').trim()).length,
  };
}

const has = (haystack, needle) => Boolean(needle) && String(haystack || '').toLowerCase().includes(needle);

/**
 * The checklist under the SEO panel. Each item: { id, ok, label, tip }.
 * `form` is the editor's state; `analysis` is analyzeContent(form.content).
 */
export function seoChecks(form, analysis) {
  const keyword = (form.seo.focusKeyword || '').trim().toLowerCase();
  const seoTitle = form.seo.metaTitle || form.title;
  const description = form.seo.metaDescription || form.excerpt;
  const checks = [];

  if (!keyword) {
    checks.push({
      id: 'keyword',
      ok: false,
      label: 'Set a focus keyword',
      tip: 'The phrase you want this article to be found for, e.g. “how long does a claim take”.',
    });
  } else {
    const keywordSlug = slugify(keyword);
    checks.push(
      { id: 'kw-title', ok: has(seoTitle, keyword), label: 'Focus keyword in the SEO title', tip: 'Put the phrase near the start of the title.' },
      { id: 'kw-desc', ok: has(description, keyword), label: 'Focus keyword in the meta description', tip: 'Search engines bold the words that match the search.' },
      { id: 'kw-url', ok: Boolean(keywordSlug) && form.slug.includes(keywordSlug), label: 'Focus keyword in the URL', tip: `For example ${articlePath(keywordSlug || 'your-keyword')}.` },
      { id: 'kw-intro', ok: has(analysis.firstParagraph, keyword), label: 'Focus keyword in the first paragraph', tip: 'Answer the question the keyword asks straight away.' },
      { id: 'kw-heading', ok: analysis.headings.some((h) => has(h.text, keyword)), label: 'Focus keyword in a subheading', tip: 'Use it, or a close variant, in at least one H2 or H3.' },
    );
  }

  const titleLength = seoTitle.trim().length;
  const descLength = description.trim().length;
  checks.push(
    {
      id: 'title-length',
      ok: titleLength >= SEO_GUIDE.metaTitle.min && titleLength <= SEO_GUIDE.metaTitle.max,
      label: `SEO title is ${SEO_GUIDE.metaTitle.min}–${SEO_GUIDE.metaTitle.max} characters (${titleLength})`,
      tip: 'Longer titles are cut off in search results.',
    },
    {
      id: 'desc-length',
      ok: descLength >= SEO_GUIDE.metaDescription.min && descLength <= SEO_GUIDE.metaDescription.max,
      label: `Meta description is ${SEO_GUIDE.metaDescription.min}–${SEO_GUIDE.metaDescription.max} characters (${descLength})`,
      tip: 'Write it as the pitch under the title in search results.',
    },
    {
      id: 'words',
      ok: analysis.words >= SEO_GUIDE.minWords,
      label: `At least ${SEO_GUIDE.minWords} words (${analysis.words})`,
      tip: 'Thin pages rarely rank. Answer the question fully.',
    },
    {
      id: 'sections',
      ok: analysis.h2 >= 2,
      label: 'Split into sections with Heading 2',
      tip: 'Two or more H2 headings also give the article a table of contents.',
    },
    {
      id: 'internal-links',
      ok: analysis.internalLinks >= 1,
      label: 'Links to another CatchMyCash page',
      tip: 'e.g. /how-it-works or a related guide.',
    },
    {
      id: 'alt',
      ok: analysis.imagesWithoutAlt === 0 && (!form.coverImage.url || Boolean(form.coverImage.alt.trim())),
      label: 'Every image has a description',
      tip: analysis.imagesWithoutAlt
        ? `${analysis.imagesWithoutAlt} image${analysis.imagesWithoutAlt === 1 ? '' : 's'} in the article ${analysis.imagesWithoutAlt === 1 ? 'has' : 'have'} no alt text. Select it and press the image button.`
        : 'Alt text is read by screen readers and search engines.',
    },
  );
  return checks;
}
