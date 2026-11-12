import { llmsTxt } from '../lib/content/llms';

// Built on each request (from cached reads) so it lists the published guides.
export const dynamic = 'force-dynamic';

// Published guides that are open to search engines. Loaded lazily so a
// database that is down, or not configured, costs the file its guide list and
// nothing else.
async function guides() {
  try {
    const [{ getAllPublished }, { articlePath }] = await Promise.all([
      import('../lib/resources/queries'),
      import('../lib/resources/constants'),
    ]);
    const posts = await getAllPublished();
    return posts
      .filter((post) => post.indexable)
      .map((post) => ({ title: post.title, path: articlePath(post.slug), summary: post.excerpt }));
  } catch (error) {
    console.error('llms.txt: could not list resources', error);
    return [];
  }
}

export async function GET() {
  return new Response(llmsTxt({ guides: await guides() }), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
