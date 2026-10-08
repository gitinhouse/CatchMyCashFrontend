// The text behind /llms.txt: everything an AI assistant needs to answer
// questions about the site in one file, so it never has to crawl every page.
// It follows the llmstxt.org layout (title, one-line summary, then sections of
// facts and links) and is built from the same content modules as the pages, so
// it cannot drift from what the site says.
import {
  FEE_PERCENT,
  PUBLIC_PAGES,
  SITE_DESCRIPTION,
  SITE_NAME,
  STATE_PROGRAM,
  SUPPORT_EMAIL,
  absoluteUrl,
} from '../site';
import { FAQS, faqAnswerText } from './faqs';
import {
  CASE_ID_FACTS,
  CLAIM_TYPES,
  ELIGIBILITY,
  FEE_FACTS,
  PROCESS_STEPS,
  PROPERTY_BASICS,
  PROPERTY_TYPES,
  TRACKING_STAGES,
} from './guides';

const KEY_FACTS = [
  `${SITE_NAME} is a private recovery service for unclaimed property held by the State of California. It is not the state and is not affiliated with the State Controller's Office or any government agency.`,
  `Searching is free and needs no account. The fee is ${FEE_PERCENT}% of the amount recovered, taken at payout, and nothing is owed if nothing is recovered.`,
  `Anyone can also search and claim directly from the State Controller's Office for free: ${STATE_PROGRAM.searchUrl}`,
  'California has up to 180 days to decide a complete claim; cash-only owner claims are often paid in 30 to 60 days.',
  `Claim progress can be checked with a Case ID at ${absoluteUrl('/track-claim')}.`,
  `Support: ${SUPPORT_EMAIL}, answered by a person within one business day.`,
];

const bullets = (items) => items.map((item) => `- ${item}`).join('\n');

export function llmsTxt() {
  const legalPaths = ['/privacy', '/terms', '/cookies'];
  const pages = PUBLIC_PAGES.filter((p) => !legalPaths.includes(p.path));
  const legal = PUBLIC_PAGES.filter((p) => legalPaths.includes(p.path));
  return `# ${SITE_NAME}

> ${SITE_DESCRIPTION}

Source: ${absoluteUrl('/')}. Everything below restates the public pages of the site.

## Key facts

${bullets(KEY_FACTS)}

## Pages

${pages.map((p) => `- [${p.title}](${absoluteUrl(p.path)}): ${p.summary}`).join('\n')}

## What unclaimed property is

${PROPERTY_BASICS.join('\n\n')}

## Fees

${bullets(FEE_FACTS)}

## How it works

${PROCESS_STEPS.map(
  (s) =>
    `### ${s.num}. ${s.title} (${s.meta.toLowerCase()})\n\n${s.description.trim()}${
      s.highlight ? ` ${s.highlight}` : ''
    }${s.bullets ? `\n\n${bullets(s.bullets)}` : ''}${s.note ? `\n\n${s.note}` : ''}`,
).join('\n\n')}

## Types of property

${PROPERTY_TYPES.map((t) => `- **${t.name}**: ${t.detail}`).join('\n')}

## Types of claim

${CLAIM_TYPES.map(
  (c) =>
    `### ${c.name}\n\n${c.who}\n\nDocuments usually needed:\n\n${bullets(c.documents)}\n\nTiming: ${c.timing}`,
).join('\n\n')}

## Who can claim

${bullets(ELIGIBILITY.canClaim)}

What the state asks you to prove:

${bullets(ELIGIBILITY.proof)}

Limits:

${bullets(ELIGIBILITY.limits)}

${ELIGIBILITY.freeAlternative}

## Tracking a claim

${bullets(CASE_ID_FACTS)}

The tracker reports these stages, in order:

${TRACKING_STAGES.map((s, i) => `${i + 1}. **${s.name}**: ${s.detail}`).join('\n')}

## Frequently asked questions

${FAQS.map((f) => `### ${f.q}\n\n${faqAnswerText(f)}`).join('\n\n')}

## Contact

Email ${SUPPORT_EMAIL} or use ${absoluteUrl('/contact')}. A person replies within one business day.

## Optional

${legal.map((p) => `- [${p.title}](${absoluteUrl(p.path)}): ${p.summary}`).join('\n')}
- [California State Controller's unclaimed property search](${STATE_PROGRAM.searchUrl}): the state's own free search.
- [State Controller's guidance on investigators](${STATE_PROGRAM.investigatorRulesUrl}): the state's rules for recovery services, including the 10% fee limit.
`;
}
