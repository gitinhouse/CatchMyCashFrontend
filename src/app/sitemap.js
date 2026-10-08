import { PUBLIC_PAGES, absoluteUrl } from './lib/site';

// No lastModified: a build date stamped on every page would claim changes that
// did not happen, and search engines learn to ignore a sitemap that does that.
export default function sitemap() {
  return PUBLIC_PAGES.map((page) => ({
    url: absoluteUrl(page.path),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
