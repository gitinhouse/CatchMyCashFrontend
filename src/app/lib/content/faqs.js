// The FAQ page, its FAQPage structured data and llms.txt
// all read this list, so an answer only ever has to be corrected here.
// Paragraphs are separated by a blank line.
import { FEE_PERCENT, SUPPORT_EMAIL } from '../site';

export const FAQS = [
  {
    q: 'Do I pay anything to search?',
    a: 'No. Searching is completely free. You can run your name, a maiden name, or a business name as many times as you want without paying anything or even creating an account.\n\nWe only get paid when we recover money for you, and the amount is a percentage of what you receive — disclosed before you sign anything.',
  },
  {
    q: 'How much does CatchMyCash charge?',
    a: `Our fee is ${FEE_PERCENT}% of the money we recover for you, taken at payout. There is nothing to pay upfront, and if we don't recover anything you owe nothing.\n\nCalifornia law caps what a recovery service may charge at 10% of the property returned to you (Code of Civil Procedure section 1582), so our fee never goes above that limit.`,
  },
  {
    q: 'Why do I have to sign an agreement?',
    a: "The State Controller's Office only releases unclaimed property to the rightful owner or to someone the rightful owner has authorized to act on their behalf. The recovery agreement is the document that gives us legal authority to file a claim for you.\n\nIt also lays out our fee in writing — what percentage we take if we recover money, and the fact that you owe nothing if we don't. There's no hidden fee, no auto-renewal, no obligation beyond the specific claim you authorize.",
  },
  {
    q: 'Why do I need to upload documents?',
    a: "California requires proof of two things before they release money: that you are who you say you are, and that you have a valid connection to the property being claimed.\n\nThat usually means a government-issued ID and some kind of address or relationship documentation. Heir claims, business claims, and claims with multiple owners need a few extra documents — we tell you exactly what's needed for your specific claim.",
  },
  {
    q: 'What happens after I submit?',
    a: "We review your documents, assemble a complete claim package, and submit it to the state. From there:\n\n(1) California acknowledges receipt — usually within a few weeks. (2) They review the package; if anything is missing or unclear, they ask for more. (3) If the documentation supports the claim, they approve it and issue payment. (4) Our fee is deducted per your agreement and the balance goes to you.\n\nWe update you at every stage. You don't need to chase us — we'll tell you when something changes.",
  },
  {
    q: 'How do I check the status of my claim?',
    a: 'Enter your Case ID on the Track Your Claim page (catchmycash.com/track-claim) or in the tracker on the home page. Your Case ID is issued as soon as your case is opened and is in the emails we send you.\n\nThe tracker shows each stage — property selected, your details, documents, the two agreements, submission to the state, and approval. If you have an account, your dashboard shows the same progress.',
  },
  {
    q: 'Is this the state? Are you the government?',
    a: "No. CatchMyCash is a private service. We are not affiliated with the State of California, the State Controller's Office, or any government agency.\n\nYou can absolutely file a claim yourself directly with the state at sco.ca.gov — and if that's the route you prefer, we encourage it. Searching and claiming are always free through the state. We exist for people who'd rather pay a percentage than navigate the process themselves.",
  },
  {
    q: 'Is there a deadline to claim my money?',
    a: "No. Once property has been transferred to the State Controller's Office, there is no deadline to claim it — the state holds it for the owner or their heirs indefinitely.\n\nNew names are added to the state's records all the time, so a search that finds nothing today can find something later.",
  },
  {
    q: 'How long does it take?',
    a: "Your part takes about ten minutes total. The waiting is on the state's side.\n\nBy California law, the state has up to 180 days from receipt of a complete claim package to review and decide. Cash-only owner claims are often processed in 30 to 60 days. Heir claims, business claims, and security-related claims usually run closer to the full 180 days.\n\nOnce approved, payment is issued by check or direct deposit depending on the type of claim.",
  },
  {
    q: 'How do I reach a person?',
    a: `Email ${SUPPORT_EMAIL} or use the form on our Contact page. A person on the team reads every message and replies within one business day, usually within a few hours.`,
  },
];

// The answer as plain sentences, for structured data and llms.txt.
export const faqAnswerText = (faq) => faq.a.split('\n\n').join(' ');
