// Answers a visitor's question from the site's own FAQ when the AI assistant
// is unavailable (no API key, or the API failed): picks the FAQ entry whose
// words overlap the question most, or points to a person.
import { FAQS } from '../content/faqs';
import { SUPPORT_EMAIL } from '../site';

const STOP_WORDS = new Set(
  'a an and are as at be but by can do does for from have how i if in is it me my of on or so that the this to was we what when where which who why will with you your'.split(
    ' ',
  ),
);

const words = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9%\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
    // Crude stemming so "claims"/"claiming" meet "claim".
    .map((w) => w.replace(/(ing|ed|es|s)$/, ''));

// Extra words people use for each FAQ that its own text may not contain.
const SYNONYMS = {
  'How much does CatchMyCash charge?': 'cost price fee fees percent 10% charge pay expensive commission',
  'Do I pay anything to search?': 'free search cost account',
  'How do I check the status of my claim?': 'track tracking status progress case id update where',
  'How long does it take?': 'long time timing wait days weeks months when paid',
  'Is this the state? Are you the government?': 'government state official scam legit legitimate affiliated',
  'Is there a deadline to claim my money?': 'deadline expire expiry late old',
  'Why do I need to upload documents?': 'document documents id proof upload need',
  'How do I reach a person?': 'contact email phone call human person support help',
};

const INDEX = FAQS.map((faq) => ({
  faq,
  terms: new Set(words(`${faq.q} ${faq.q} ${SYNONYMS[faq.q] || ''}`)),
}));

export function answerFromFaq(question) {
  const asked = words(question);
  let best = null;
  let bestScore = 0;
  for (const entry of INDEX) {
    const score = asked.reduce((n, w) => n + (entry.terms.has(w) ? 1 : 0), 0);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }

  if (!best) {
    return `I can answer questions about searching for and claiming California unclaimed property, our fee, documents, timing and tracking a claim. For anything else, email ${SUPPORT_EMAIL} and a person will reply within one business day.`;
  }
  return `${best.faq.a.split('\n\n').join(' ')}\n\n(From our FAQ: “${best.faq.q}”)`;
}
