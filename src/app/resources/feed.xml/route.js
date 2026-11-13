// RSS 2.0 feed of published guides, linked from every Resources page.
import { getAllPublished, getHubSettings } from '../../lib/resources/queries';
import { RESOURCES_NAME, RESOURCES_PATH, articlePath } from '../../lib/resources/constants';
import { FEED_PATH } from '../../lib/resources/seo';
import { SITE_NAME, absoluteUrl } from '../../lib/site';

export const dynamic = 'force-dynamic';

const FEED_SIZE = 50;

// Characters XML 1.0 does not allow are dropped; markup characters escaped.
const xml = (value) =>
  String(value ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const rfc822 = (value) => new Date(value).toUTCString();

export async function GET() {
  let posts;
  let settings;
  try {
    [posts, settings] = await Promise.all([getAllPublished(), getHubSettings()]);
  } catch (error) {
    console.error('resources feed: could not load articles', error);
    return new Response('The feed is unavailable right now.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '300' },
    });
  }

  // Articles hidden from search engines are left out of the feed as well.
  const items = posts.filter((post) => !post.seo.noindex).slice(0, FEED_SIZE);
  const newest = items.reduce((latest, post) => {
    const t = new Date(post.updatedAt || post.publishedAt).getTime();
    return t > latest ? t : latest;
  }, 0);

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>${xml(`${SITE_NAME} ${RESOURCES_NAME}`)}</title>
    <link>${xml(absoluteUrl(RESOURCES_PATH))}</link>
    <atom:link href="${xml(absoluteUrl(FEED_PATH))}" rel="self" type="application/rss+xml" />
    <description>${xml(settings.intro)}</description>
    <language>en-us</language>
${newest ? `    <lastBuildDate>${rfc822(newest)}</lastBuildDate>\n` : ''}${items
    .map((post) => {
      const url = absoluteUrl(articlePath(post.slug));
      return `    <item>
      <title>${xml(post.title)}</title>
      <link>${xml(url)}</link>
      <guid isPermaLink="true">${xml(url)}</guid>
      <pubDate>${rfc822(post.publishedAt)}</pubDate>
      <dc:creator>${xml(post.authorName)}</dc:creator>
${post.topic ? `      <category>${xml(post.topic.name)}</category>\n` : ''}      <description>${xml(post.seo.metaDescription || post.excerpt)}</description>
    </item>`;
    })
    .join('\n')}
  </channel>
</rss>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
