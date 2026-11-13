// Checks for what the admin console sends. Each returns { value, errors }:
// `value` is ready to store, `errors` maps a field to a message the editor
// shows next to it. Nothing here touches the database.
import { DEFAULT_AUTHOR, LIMITS, POST_STATUSES } from './constants.js';
import { prepareArticle, summarize } from './content.js';
import { slugify, slugProblem } from './slug.js';

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const tooLong = (value, max, label) =>
  value.length > max ? `${label} must be ${max} characters or fewer (now ${value.length}).` : null;

// Images may come from the site's own media store or any https address.
const SAFE_IMAGE_URL = /^(https:\/\/[^\s"'<>]+|\/media\/[a-f0-9]{24})$/i;

function readImage(input, label, errors, field) {
  const url = text(input?.url);
  const alt = text(input?.alt);
  if (url && !SAFE_IMAGE_URL.test(url)) {
    errors[`${field}.url`] = `${label} must be an uploaded image or an https:// address.`;
  } else if (url.length > LIMITS.url) {
    errors[`${field}.url`] = tooLong(url, LIMITS.url, `${label} address`);
  }
  const altProblem = tooLong(alt, LIMITS.imageAlt, `${label} description`);
  if (altProblem) errors[`${field}.alt`] = altProblem;
  return { url, alt };
}

function readTags(input) {
  const list = Array.isArray(input) ? input : String(input ?? '').split(',');
  const seen = new Set();
  const tags = [];
  for (const raw of list) {
    const tag = text(String(raw)).replace(/\s+/g, ' ').slice(0, LIMITS.tag);
    const key = tag.toLowerCase();
    if (tag && !seen.has(key)) {
      seen.add(key);
      tags.push(tag);
    }
  }
  return tags;
}

/**
 * @param {object} body  the editor's payload
 * @returns {{ value: object, errors: Record<string, string> }}
 */
export function validatePost(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};

  const status = POST_STATUSES.includes(b.status) ? b.status : 'draft';
  const publishing = status === 'published';

  const title = text(b.title).replace(/\s+/g, ' ');
  if (!title) errors.title = 'Give the article a title.';
  else if (title.length > LIMITS.title) errors.title = tooLong(title, LIMITS.title, 'Title');

  const slug = text(b.slug).toLowerCase() || slugify(title);
  const slugError = slugProblem(slug);
  if (slugError) errors.slug = slugError;

  const contentRaw = typeof b.content === 'string' ? b.content : '';
  if (contentRaw.length > LIMITS.content) {
    errors.content = 'The article is too long to save. Split it into two articles.';
  }
  const article = prepareArticle(contentRaw.slice(0, LIMITS.content));
  if (publishing && article.wordCount < 1) errors.content = 'Write the article before publishing it.';

  let excerpt = text(b.excerpt).replace(/\s+/g, ' ');
  if (excerpt.length > LIMITS.excerpt) errors.excerpt = tooLong(excerpt, LIMITS.excerpt, 'Summary');
  if (!excerpt && article.text) excerpt = summarize(article.text);

  const topicId = text(b.topicId);
  if (topicId && !/^[a-f0-9]{24}$/i.test(topicId)) errors.topicId = 'Choose a topic from the list.';
  if (publishing && !topicId) errors.topicId = 'Choose a topic before publishing.';

  const tags = readTags(b.tags);
  if (tags.length > LIMITS.tags) errors.tags = `Use at most ${LIMITS.tags} tags.`;

  const authorName = text(b.authorName) || DEFAULT_AUTHOR;
  const authorProblem = tooLong(authorName, LIMITS.authorName, 'Author');
  if (authorProblem) errors.authorName = authorProblem;

  const coverImage = readImage(b.coverImage, 'Cover image', errors, 'coverImage');
  if (coverImage.url && !coverImage.alt) {
    errors['coverImage.alt'] = 'Describe the cover image for screen readers and search engines.';
  }

  const faqs = [];
  (Array.isArray(b.faqs) ? b.faqs : []).forEach((item, index) => {
    const question = text(item?.question).replace(/\s+/g, ' ');
    const answer = text(item?.answer);
    if (!question && !answer) return;
    if (!question || !answer) {
      errors[`faqs.${index}`] = 'Each FAQ needs both a question and an answer.';
    } else if (question.length > LIMITS.faqQuestion || answer.length > LIMITS.faqAnswer) {
      errors[`faqs.${index}`] = `Keep questions under ${LIMITS.faqQuestion} and answers under ${LIMITS.faqAnswer} characters.`;
    }
    faqs.push({ question, answer });
  });
  if (faqs.length > LIMITS.faqs) errors.faqs = `Use at most ${LIMITS.faqs} questions.`;

  let publishedAt = null;
  if (b.publishedAt) {
    const date = new Date(b.publishedAt);
    if (Number.isNaN(date.getTime())) errors.publishedAt = 'Enter a valid publish date.';
    else publishedAt = date;
  }

  const seoIn = b.seo && typeof b.seo === 'object' ? b.seo : {};
  const metaTitle = text(seoIn.metaTitle).replace(/\s+/g, ' ');
  const metaDescription = text(seoIn.metaDescription).replace(/\s+/g, ' ');
  const focusKeyword = text(seoIn.focusKeyword).replace(/\s+/g, ' ');
  const canonicalUrl = text(seoIn.canonicalUrl);
  for (const [field, value, max, label] of [
    ['seo.metaTitle', metaTitle, LIMITS.metaTitle, 'SEO title'],
    ['seo.metaDescription', metaDescription, LIMITS.metaDescription, 'Meta description'],
    ['seo.focusKeyword', focusKeyword, LIMITS.focusKeyword, 'Focus keyword'],
    ['seo.canonicalUrl', canonicalUrl, LIMITS.url, 'Canonical URL'],
  ]) {
    const problem = tooLong(value, max, label);
    if (problem) errors[field] = problem;
  }
  if (canonicalUrl && !/^https?:\/\/[^\s"'<>]+$/i.test(canonicalUrl)) {
    errors['seo.canonicalUrl'] = 'Enter a full address starting with https://, or leave it empty.';
  }
  const ogImage = readImage(seoIn.ogImage, 'Social image', errors, 'seo.ogImage');

  return {
    errors,
    value: {
      title,
      slug,
      excerpt,
      content: article.html,
      toc: article.toc,
      word_count: article.wordCount,
      reading_minutes: article.readingMinutes,
      topic: topicId || null,
      tags: tags.slice(0, LIMITS.tags),
      author_name: authorName.slice(0, LIMITS.authorName),
      cover_image: coverImage,
      faqs: faqs.slice(0, LIMITS.faqs),
      status,
      featured: Boolean(b.featured),
      published_at: publishedAt,
      seo: {
        meta_title: metaTitle,
        meta_description: metaDescription,
        focus_keyword: focusKeyword,
        canonical_url: canonicalUrl,
        og_image: ogImage,
        noindex: Boolean(seoIn.noindex),
      },
    },
  };
}

export function validateTopic(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  const name = text(b.name).replace(/\s+/g, ' ');
  if (!name) errors.name = 'Name the topic.';
  else if (name.length > LIMITS.topicName) errors.name = tooLong(name, LIMITS.topicName, 'Name');

  const slug = text(b.slug).toLowerCase() || slugify(name);
  if (!slug) errors.slug = 'A URL slug is required.';
  else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > LIMITS.slug) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens only.';
  }

  const description = text(b.description).replace(/\s+/g, ' ');
  const descProblem = tooLong(description, LIMITS.topicDescription, 'Description');
  if (descProblem) errors.description = descProblem;

  const order = Number.isFinite(Number(b.order)) ? Math.round(Number(b.order)) : 0;

  const seoIn = b.seo && typeof b.seo === 'object' ? b.seo : {};
  const metaTitle = text(seoIn.metaTitle).replace(/\s+/g, ' ');
  const metaDescription = text(seoIn.metaDescription).replace(/\s+/g, ' ');
  const mt = tooLong(metaTitle, LIMITS.metaTitle, 'SEO title');
  if (mt) errors['seo.metaTitle'] = mt;
  const md = tooLong(metaDescription, LIMITS.metaDescription, 'Meta description');
  if (md) errors['seo.metaDescription'] = md;

  return {
    errors,
    value: {
      name,
      slug,
      description,
      order,
      seo: { meta_title: metaTitle, meta_description: metaDescription },
    },
  };
}

export function validateSettings(body) {
  const errors = {};
  const b = body && typeof body === 'object' ? body : {};
  const heading = text(b.heading).replace(/\s+/g, ' ');
  const intro = text(b.intro).replace(/\s+/g, ' ');
  const metaTitle = text(b.metaTitle).replace(/\s+/g, ' ');
  const metaDescription = text(b.metaDescription).replace(/\s+/g, ' ');
  for (const [field, value, max, label] of [
    ['heading', heading, LIMITS.hubHeading, 'Heading'],
    ['intro', intro, LIMITS.hubIntro, 'Introduction'],
    ['metaTitle', metaTitle, LIMITS.metaTitle, 'SEO title'],
    ['metaDescription', metaDescription, LIMITS.metaDescription, 'Meta description'],
  ]) {
    const problem = tooLong(value, max, label);
    if (problem) errors[field] = problem;
  }
  return {
    errors,
    value: { heading, intro, meta_title: metaTitle, meta_description: metaDescription },
  };
}
