// Metadata and schema.org data for the Resources pages.
import { SHARE_IMAGE, pageMetadata } from '../seo';
import { SITE_NAME, SITE_URL, absoluteUrl } from '../site';
import { DEFAULT_AUTHOR, RESOURCES_NAME, RESOURCES_PATH, articlePath } from './constants';

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
export const FEED_PATH = `${RESOURCES_PATH}/feed.xml`;

const feedAlternate = () => ({ 'application/rss+xml': [{ url: absoluteUrl(FEED_PATH), title: `${SITE_NAME} ${RESOURCES_NAME}` }] });

/** A page's own image, or the site's share card. */
function socialImage(image, fallbackAlt) {
  if (image?.url) return { url: image.url, alt: image.alt || fallbackAlt };
  return SHARE_IMAGE;
}

/** Metadata for a listing page (the hub or a topic). */
export function listingMetadata({ title, description, path, noindex = false, canonicalPath }) {
  const meta = pageMetadata({ title, description, path });
  if (canonicalPath) meta.alternates.canonical = absoluteUrl(canonicalPath);
  meta.alternates.types = feedAlternate();
  if (noindex) meta.robots = { index: false, follow: true };
  return meta;
}

/** The URL an article declares as its own. */
export const articleCanonical = (post) => post.seo.canonicalUrl || absoluteUrl(articlePath(post.slug));

export function articleMetadata(post) {
  const title = post.seo.metaTitle || post.title;
  const description = post.seo.metaDescription || post.excerpt;
  const url = absoluteUrl(articlePath(post.slug));
  const image = socialImage(post.seo.ogImage?.url ? post.seo.ogImage : post.coverImage, post.title);
  const fullTitle = `${title} | ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: articleCanonical(post), types: feedAlternate() },
    ...(post.seo.noindex ? { robots: { index: false, follow: true } } : {}),
    authors: [{ name: post.authorName || DEFAULT_AUTHOR }],
    keywords: post.tags.length ? post.tags : undefined,
    openGraph: {
      type: 'article',
      siteName: SITE_NAME,
      locale: 'en_US',
      url,
      title: fullTitle,
      description,
      images: [image],
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt || undefined,
      section: post.topic?.name,
      tags: post.tags,
      authors: [post.authorName || DEFAULT_AUTHOR],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [{ url: image.url, alt: image.alt }],
    },
  };
}

const absolute = (url) => (url ? (url.startsWith('http') ? url : absoluteUrl(url)) : '');

export function blogPostingJsonLd(post) {
  const url = absoluteUrl(articlePath(post.slug));
  const team = !post.authorName || post.authorName === DEFAULT_AUTHOR || /team|staff|editor/i.test(post.authorName);
  const image = absolute(post.seo.ogImage?.url || post.coverImage?.url) || absoluteUrl(SHARE_IMAGE.url);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    headline: post.title.slice(0, 110),
    description: post.seo.metaDescription || post.excerpt,
    image: [image],
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: team
      ? { '@type': 'Organization', name: post.authorName || DEFAULT_AUTHOR, url: SITE_URL }
      : { '@type': 'Person', name: post.authorName },
    publisher: {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: absoluteUrl('/logo.png') },
    },
    isPartOf: { '@id': WEBSITE_ID },
    ...(post.topic ? { articleSection: post.topic.name } : {}),
    ...(post.tags.length ? { keywords: post.tags.join(', ') } : {}),
    wordCount: post.wordCount,
    inLanguage: 'en-US',
  };
}

export function articleFaqJsonLd(post) {
  if (!post.faqs?.length) return null;
  const url = absoluteUrl(articlePath(post.slug));
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: post.faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };
}

/** A listing page and the articles on it, in order. */
export function collectionJsonLd({ title, description, path, posts }) {
  const url = absoluteUrl(path);
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: posts.map((post, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: absoluteUrl(articlePath(post.slug)),
        name: post.title,
      })),
    },
  };
}
