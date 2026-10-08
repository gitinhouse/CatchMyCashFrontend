This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## SEO settings

All optional. Set them in the production environment (or `.env`) before `npm run build`, then restart: most pages are pre-rendered at build time, so a value set after the build only reaches them on the next one. `CANONICAL_REDIRECTS` is the exception and only needs a restart.

| Variable | What it does | Default |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | The preferred address of the site. Canonical links, the sitemap, `robots.txt`, `llms.txt`, Open Graph URLs and structured data are built on it, and the `http://` / `www.` variants of its host redirect to it. | `https://catchmycash.com` |
| `GOOGLE_SITE_VERIFICATION` | The code from Google Search Console's "HTML tag" verification method (only the `content` value). | not set |
| `BING_SITE_VERIFICATION` | The same for Bing Webmaster Tools (`msvalidate.01`). | not set |
| `NEXT_PUBLIC_SOCIAL_PROFILES` | Comma-separated URLs of the company's own profiles (LinkedIn, X, Instagram, Google Business Profile …), published as `sameAs` in the Organization structured data. | not set |
| `CANONICAL_REDIRECTS` | Set to `off` to stop `server.js` redirecting `http://` and `www.` requests (see `src/app/lib/canonicalRedirect.js`). | on |

The redirects only see requests that reach this server. The proxy in front of it has to pass `http://` traffic through (not answer port 80 itself) and send `X-Forwarded-Proto`, and `www.catchmycash.com` needs a DNS record and a TLS certificate. Otherwise set the same redirects up at the proxy or CDN.

After deploying, submit `https://catchmycash.com/sitemap.xml` in Google Search Console and Bing Webmaster Tools.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
