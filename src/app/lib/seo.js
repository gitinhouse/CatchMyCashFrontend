// Page metadata and schema.org structured data, built from the facts in
// ./site so every page describes the business the same way.
import {
  FEE_PERCENT,
  FOUNDERS,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  STATE_PROGRAM,
  SUPPORT_EMAIL,
  absoluteUrl,
} from './site';
import { faqAnswerText } from './content/faqs';

/**
 * Metadata for a public page: its title (the root layout appends the brand
 * unless absoluteTitle is set), description, canonical URL and the matching
 * Open Graph / Twitter card.
 */
// The share card from app/opengraph-image.png. A page that sets its own
// openGraph replaces the one it would inherit, image included, so every page
// names it explicitly.
const SHARE_IMAGE = {
  url: '/opengraph-image.png',
  width: 1200,
  height: 630,
  alt: `${SITE_NAME} — Millions in unclaimed property waiting for you. Free search, nothing upfront, 10% only if you get paid.`,
};

export function pageMetadata({ title, description, path, absoluteTitle = false }) {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: 'en_US',
      url,
      title: fullTitle,
      description,
      images: [SHARE_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [SHARE_IMAGE.url],
    },
  };
}

/**
 * Metadata for signed-in, per-claimant and staff pages: still crawlable, so a
 * search engine can read the noindex and drop any copy it already has, but
 * never listed in results.
 */
export function privateMetadata(title) {
  return {
    title,
    robots: {
      index: false,
      follow: false,
      googleBot: { index: false, follow: false },
    },
  };
}

const ORGANIZATION_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: SITE_NAME,
    url: SITE_URL,
    logo: absoluteUrl('/logo.png'),
    description: SITE_DESCRIPTION,
    email: SUPPORT_EMAIL,
    areaServed: { '@type': 'State', name: 'California' },
    founder: FOUNDERS.map((f) => ({
      '@type': 'Person',
      name: f.name,
      jobTitle: f.jobTitle,
    })),
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: SUPPORT_EMAIL,
        url: absoluteUrl('/contact'),
        availableLanguage: ['English'],
        areaServed: 'US-CA',
      },
    ],
    ...(SOCIAL_PROFILES.length ? { sameAs: SOCIAL_PROFILES } : {}),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    inLanguage: 'en-US',
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function serviceJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/#service`,
    name: 'California unclaimed property recovery',
    serviceType: 'Unclaimed property claim filing',
    description: `We search the California State Controller’s unclaimed property records for property held in your name, prepare the claim package and file it for you. Searching is free; the fee is ${FEE_PERCENT}% of what is recovered, charged only on a recovery.`,
    provider: { '@id': ORGANIZATION_ID },
    areaServed: { '@type': 'State', name: 'California' },
    url: SITE_URL,
    offers: {
      '@type': 'Offer',
      description: `Free search. ${FEE_PERCENT}% of the amount recovered, deducted at payout; nothing is owed if nothing is recovered.`,
      priceSpecification: {
        '@type': 'PriceSpecification',
        price: 0,
        priceCurrency: 'USD',
        description: `No upfront cost. Contingency fee of ${FEE_PERCENT}% of the recovered amount.`,
      },
    },
    isRelatedTo: {
      '@type': 'GovernmentService',
      name: 'California Unclaimed Property Program',
      provider: {
        '@type': 'GovernmentOrganization',
        name: STATE_PROGRAM.name,
        url: STATE_PROGRAM.url,
      },
      url: STATE_PROGRAM.searchUrl,
    },
  };
}

export function faqPageJsonLd(faqs, path = '/faq') {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${absoluteUrl(path)}#faq`,
    url: absoluteUrl(path),
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: { '@type': 'Answer', text: faqAnswerText(faq) },
    })),
  };
}

/** crumbs: [{ name, path }] from the home page down to the current page. */
export function breadcrumbJsonLd(crumbs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/** The home crumb plus one for a page directly under it. */
export const pageCrumbs = (name, path) => [
  { name: 'Home', path: '/' },
  { name, path },
];

export function webPageJsonLd({ type = 'WebPage', title, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': WEBSITE_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };
}
