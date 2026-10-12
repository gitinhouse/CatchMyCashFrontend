// Customer proof shown on the home and About pages. Both lists are empty on
// purpose: only add what is real and can be checked.
//
// TESTIMONIALS — from actual clients who agreed in writing to be quoted by
// name. Leave `amount` out unless the client agreed to share it.
//   { quote: '...', name: 'Maria G.', location: 'Fresno, CA',
//     claimType: 'Heir claim', amount: '$4,210', date: '2026-08' }
//
// REVIEW_PROFILES — the company's pages on independent review sites, so
// visitors (and search engines) can read reviews the company does not control.
//   { name: 'Google', url: 'https://g.page/...' },
//   { name: 'Trustpilot', url: 'https://www.trustpilot.com/review/catchmycash.com' },
//   { name: 'BBB', url: 'https://www.bbb.org/...' }
//
// Neither is turned into Review or AggregateRating structured data: search
// engines ignore, and can penalize, review markup a business publishes about
// itself.
export const TESTIMONIALS = [];

export const REVIEW_PROFILES = [];
