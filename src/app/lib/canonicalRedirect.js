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

// A host header value without its port, lower-cased; '' when absent.
const cleanHost = (header) => firstValue(header).replace(/:\d+$/, '');

// The path and query exactly as requested. Parsing the request target as a URL
// would read "//faq" as a host named "faq" and drop it, so only the absolute
// form a proxy may send ("http://host/path") is parsed. Leading slashes are
// collapsed to one: "//faq" lands on /faq in a single hop.
function requestPath(rawUrl) {
  let path = rawUrl || '/';
  if (/^https?:\/\//i.test(path)) {
    const parsed = new URL(path);
    path = `${parsed.pathname}${parsed.search}`;
  }
  if (!path.startsWith('/')) return null; // "*" (OPTIONS *) and anything odd
  return path.replace(/^\/{2,}/, '/');
}

/**
 * The address to permanently redirect a raw Node request to, or null to serve
 * it. API routes and build assets are never redirected: a webhook or form that
 * posts to an old address would be turned into a GET, and assets are only
 * requested from a page that has already redirected.
 *
 * Some of the headers this reads can be sent by the visitor, so a crafted
 * request can make a canonical URL answer with a redirect to itself. That only
 * ever reaches the visitor who crafted it as long as no shared cache stores the
 * redirect, which is why server.js marks it private.
 */
export function canonicalRedirectLocation(req) {
  if (process.env.CANONICAL_REDIRECTS === 'off') return null;

  const path = requestPath(req.url);
  if (!path || /^\/(api|_next)\//.test(path)) return null;

  const { url, host: canonicalHost, variants } = canonicalSite();
  // Host first: when it already names the site it is what the visitor asked
  // for. X-Forwarded-Host is only consulted when a proxy has rewritten Host to
  // its upstream's name, so a visitor's own X-Forwarded-Host cannot turn an
  // apex request into a www one.
  const hostHeader = cleanHost(req.headers.host);
  const host = variants.has(hostHeader)
    ? hostHeader
    : cleanHost(req.headers['x-forwarded-host']);
  if (!variants.has(host)) return null;

  const wrongHost = host !== canonicalHost;
  // Only an explicit "http" counts: with no scheme header there is no telling,
  // and guessing wrong would loop.
  const wrongScheme = url.protocol === 'https:' && visitorScheme(req.headers) === 'http';
  if (!wrongHost && !wrongScheme) return null;

  // Joined as strings, never resolved, so nothing in the path can move the
  // redirect to another host.
  return `${url.origin}${path}`;
}
