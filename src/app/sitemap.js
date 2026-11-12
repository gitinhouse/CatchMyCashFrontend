import { PUBLIC_PAGES, absoluteUrl } from './lib/site';

// Built on each request (from cached reads) so a newly published article is
// listed without a redeploy.
export const dynamic = 'force-dynamic';

// Published articles and the topics that have any. Loaded lazily so a database
// that is down, or not configured, costs the sitemap its articles rather than
// the whole file.
async function resourceEntries() {
  try {
    const [{ getAllPublished, getTopics }, { articlePath, topicPath }] = await Promise.all([
      import('./lib/resources/queries'),
      import('./lib/resources/constants'),
    ]);
    const [posts, topics] = await Promise.all([getAllPublished(), getTopics()]);
    const articles = posts
      // Articles hidden from search, or canonical elsewhere, are not listed.
      .filter((post) => post.indexable)
      .map((post) => ({
        url: absoluteUrl(articlePath(post.slug)),
        lastModified: post.updatedAt || post.publishedAt,
        changeFrequency: 'monthly',
        priority: 0.7,
      }));
    const topicPages = topics
      .filter((topic) => topic.postCount > 0)
      .map((topic) => ({
        url: absoluteUrl(topicPath(topic.slug)),
        changeFrequency: 'weekly',
        priority: 0.6,
      }));
    return [...topicPages, ...articles];
  } catch (error) {
    console.error('sitemap: could not list resources', error);
    return [];
  }
}

// Fixed pages carry no lastModified: a build date stamped on every page would
// claim changes that did not happen, and search engines learn to ignore a
// sitemap that does that. Articles carry the date they were last saved.
export default async function sitemap() {
  const pages = PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
  return [...pages, ...(await resourceEntries())];
}
