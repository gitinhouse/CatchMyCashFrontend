// One address for the site. A request for an http:// or www. variant of the
// canonical host (NEXT_PUBLIC_SITE_URL, https://catchmycash.com by default)
// gets a permanent redirect there, path and query kept:
//
//   http://catchmycash.com/faq       → 301 → https://catchmycash.com/faq
//   http://www.catchmycash.com/faq   → 301 → https://catchmycash.com/faq
//   https://www.catchmycash.com/faq  → 301 → https://catchmycash.com/faq
//
// Any other host (localhost, a server IP, another domain pointed at this app)
// is left alone. Set CANONICAL_REDIRECTS=off to switch it off.
//
// server.js calls this before handing the request to Next, and it has to stay
// there: Next fills in a missing X-Forwarded-Proto with "http" (this server
// only speaks plain http), so behind a proxy that sends no scheme header a
// check made inside Next would redirect https visitors to themselves forever.
//
// It only sees requests that reach the app. If the proxy in front answers port
// 80 itself, or www has no DNS record or certificate, the same rules have to be
// set up there.

const firstValue = (header) =>
  (Array.isArray(header) ? header[0] : header || '').split(',')[0].trim().toLowerCase();

// The scheme the visitor used, from the proxy's headers; '' when none says.
// A CDN's own header is read first: a proxy between the CDN and the app can
// overwrite X-Forwarded-Proto with its own hop's "http".
function visitorScheme(headers) {
  if (headers['cf-visitor']) {
    try {
      const scheme = JSON.parse(headers['cf-visitor']).scheme;
      if (scheme) return String(scheme).toLowerCase();
    } catch {
      // Malformed; fall through to the generic headers.
    }
  }
  return (
    firstValue(headers['cloudfront-forwarded-proto']) ||
    firstValue(headers['x-forwarded-proto'])
  );
}

let canonical = null;
function canonicalSite() {
  // Read on first use, after Next has loaded the .env files.
  if (!canonical) {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://catchmycash.com');
    const host = url.host.toLowerCase();
    const bare = host.replace(/^www\./, '');
    canonical = { url, host, variants: new Set([bare, `www.${bare}`]) };
  }
  return canonical;
}

/**
 * The address to permanently redirect a raw Node request to, or null to serve
 * it. API routes and build assets are never redirected: a webhook or form that
 * posts to an old address would be turned into a GET, and assets are only
 * requested from a page that has already redirected.
 */
export function canonicalRedirectLocation(req) {
  if (process.env.CANONICAL_REDIRECTS === 'off') return null;

  let path;
  try {
    const parsed = new URL(req.url || '/', 'http://placeholder');
    path = `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
  if (/^\/(api|_next)\//.test(path)) return null;

  const { url, host: canonicalHost, variants } = canonicalSite();
  const host = firstValue(req.headers['x-forwarded-host'] || req.headers.host).replace(
    /:\d+$/,
    '',
  );
  if (!variants.has(host)) return null;

  const wrongHost = host !== canonicalHost;
  // Only an explicit "http" counts: with no scheme header there is no telling,
  // and guessing wrong would loop.
  const wrongScheme = url.protocol === 'https:' && visitorScheme(req.headers) === 'http';
  if (!wrongHost && !wrongScheme) return null;

  // Joined as strings, never resolved: a path such as "//evil.com" (which
  // "/.//evil.com" normalizes to) would resolve as a protocol-relative URL and
  // turn this into an open redirect.
  return `${url.origin}${path}`;
}
