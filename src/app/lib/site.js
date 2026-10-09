// Facts about the site itself, shared by page metadata, structured data,
// robots.txt, the sitemap and llms.txt. Keep them true:
// search engines and AI assistants repeat what is written here.

// The address the site is served from in production. Canonical links,
// structured data and the sitemap are all built on it.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://catchmycash.com'
).replace(/\/+$/, '');

export const SITE_NAME = 'CatchMyCash';

export const SITE_TAGLINE = 'Find and claim California unclaimed property';

export const SITE_DESCRIPTION =
  'CatchMyCash searches the California State Controller’s unclaimed property records for money held in your name and files the claim for you. Searching is free, nothing is paid upfront, and the fee is 10% of what you recover, only if you recover it.';

export const SUPPORT_EMAIL = 'help@catchmycash.com';

// The share of the recovered amount we charge, and only on a recovery.
export const FEE_PERCENT = 10;

export const STATE_PROGRAM = {
  name: 'California State Controller’s Office, Unclaimed Property Division',
  url: 'https://www.sco.ca.gov/',
  searchUrl: 'https://ucpi.sco.ca.gov/',
  investigatorRulesUrl: 'https://sco.ca.gov/upd_investigator_about.html',
};

// The people the About page names as running the company.
export const FOUNDERS = [
  { name: 'Brett Carlson', jobTitle: 'Co-Founder' },
  { name: 'Evan Carter', jobTitle: 'Co-Founder' },
];

// The company's own profiles on other sites (LinkedIn, X, Instagram, Google
// Business Profile, BBB, Trustpilot ...). They become `sameAs` in the
// Organization structured data, which is how search engines and assistants tie
// those profiles to this site. Add only accounts that belong to CatchMyCash.
export const SOCIAL_PROFILES = (process.env.NEXT_PUBLIC_SOCIAL_PROFILES || '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

// Pages that are worth a search result, in the order the sitemap and llms.txt
// list them.
export const PUBLIC_PAGES = [
  {
    path: '/',
    title: 'Find and claim California unclaimed property',
    summary:
      'Free search of California unclaimed property, then a done-for-you claim for a 10% fee charged only on a recovery.',
    changeFrequency: 'weekly',
    priority: 1,
  },
  {
    path: '/how-it-works',
    title: 'How it works',
    summary:
      'The six steps from a free search to a payout, and what California’s review window means for timing.',
    changeFrequency: 'monthly',
    priority: 0.9,
  },
  {
    path: '/claim-types',
    title: 'Types of unclaimed property and claims',
    summary:
      'The kinds of property California holds (bank accounts, uncashed checks, securities, insurance, refunds, safe deposit contents) and the claim types: owner, heir, business and multiple-owner.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: '/eligibility',
    title: 'Who can claim',
    summary:
      'Who may claim unclaimed property held by California, what proof the state asks for, and when you do not need us.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: '/track-claim',
    title: 'Track your claim',
    summary:
      'Check the progress of a claim with your Case ID, and what each stage means.',
    changeFrequency: 'monthly',
    priority: 0.7,
  },
  {
    path: '/faq',
    title: 'Frequently asked questions',
    summary:
      'Cost, the recovery agreement, documents, what happens after you submit, timing, and how we differ from the state.',
    changeFrequency: 'monthly',
    priority: 0.8,
  },
  {
    path: '/about',
    title: 'About CatchMyCash',
    summary: 'Who runs CatchMyCash, why it exists, and how it handles your data.',
    changeFrequency: 'yearly',
    priority: 0.6,
  },
  {
    path: '/contact',
    title: 'Contact',
    summary: `Email ${SUPPORT_EMAIL} or use the contact form; replies within one business day.`,
    changeFrequency: 'yearly',
    priority: 0.5,
  },
  {
    path: '/privacy',
    title: 'Privacy policy',
    summary: 'What personal information is collected, why, and your rights.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: '/terms',
    title: 'Terms of service',
    summary: 'The terms that govern use of the site and the recovery service.',
    changeFrequency: 'yearly',
    priority: 0.3,
  },
  {
    path: '/cookies',
    title: 'Cookie policy',
    summary: 'The cookies the site sets and how to change your choice.',
    changeFrequency: 'yearly',
    priority: 0.2,
  },
];

// Signed-in, per-claimant and staff pages. They are kept out of search
// results with a noindex robots tag (see privateMetadata in ./seo).
export const PRIVATE_PATH_PREFIXES = [
  '/admin',
  '/allCases',
  '/allUsers',
  '/myAccount',
  '/userDocs',
  '/notifications',
  '/sign-document',
  '/signed',
  '/ref/',
  '/userLogin',
  '/register',
  '/forgotPassword',
  '/resetPassword',
];

// The home page is the origin with its slash (https://catchmycash.com/), the
// preferred address every http:// and www. variant redirects to (see
// lib/canonicalRedirect.js). Every other path has no trailing slash, matching how Next
// serves them.
export const absoluteUrl = (path = '/') =>
  path === '/' || path === ''
    ? `${SITE_URL}/`
    : `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
