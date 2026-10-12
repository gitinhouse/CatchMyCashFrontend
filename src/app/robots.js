import { SITE_URL } from './lib/site';

// AI crawlers and assistants are named one by one so it is unmistakable that
// they are welcome on the public pages; llms.txt is the summary written for
// them.
const AI_AGENTS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'CCBot',
];

// The API and the staff console hold nothing for a crawler. Signed-in and
// per-claimant pages stay crawlable so engines can read their noindex tag.
const DISALLOW = ['/api/', '/admin'];

export default function robots() {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: DISALLOW },
      { userAgent: AI_AGENTS, allow: '/', disallow: DISALLOW },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
