// Plain facts about California unclaimed property and how a claim with us
// runs. The claim types, eligibility and tracking pages render these, and
// llms-full.txt and the chat assistant read the same text, so a correction made
// here reaches all of them.
import { FEE_PERCENT } from '../site';

export const PROPERTY_BASICS = [
  'Unclaimed property is money or another financial asset a business has lost contact with its owner about, usually after about three years with no activity. The business must then report it and send it to the California State Controller’s Office, which holds it for the owner.',
  'Once the State Controller holds it, there is no deadline to claim it and the state charges nothing to return it. California’s unclaimed property law does not cover real estate.',
  'Over 76 million properties worth more than $15 billion are waiting to be claimed in California, and new names are added all the time.',
];

export const PROPERTY_TYPES = [
  {
    name: 'Bank and credit union accounts',
    detail:
      'Checking and savings balances, certificates of deposit and closed-account balances that were never paid out.',
  },
  {
    name: 'Uncashed checks and wages',
    detail:
      'Final paychecks, vendor and refund checks, cashier’s and money orders that were issued but never cashed.',
  },
  {
    name: 'Stocks, bonds, dividends and mutual funds',
    detail:
      'Shares and unpaid dividends from companies and brokerages that could no longer reach the shareholder. These are security-related claims and usually take longer.',
  },
  {
    name: 'Insurance proceeds',
    detail:
      'Life insurance benefits, annuity payments and policy refunds that went unpaid.',
  },
  {
    name: 'Refunds, deposits and credit balances',
    detail:
      'Utility and rental deposits, overpayments, store credits and other money owed back to a customer.',
  },
  {
    name: 'Safe deposit box contents',
    detail:
      'Contents of boxes whose rent went unpaid and whose holder could not be found.',
  },
  {
    name: 'Estates and trust funds',
    detail:
      'Money left to someone who has died, which their heirs or the estate can claim.',
  },
];

export const CLAIM_TYPES = [
  {
    name: 'Owner claim',
    who: 'You are the person named on the property.',
    documents: [
      'Government-issued photo ID',
      'Proof of the address the property was reported under (current or past)',
    ],
    timing:
      'Cash-only owner claims are often processed in 30 to 60 days once the state has a complete package.',
  },
  {
    name: 'Heir or beneficiary claim',
    who: 'The owner has died and you are entitled to their property — as an heir, a beneficiary or the estate’s representative.',
    documents: [
      'Your government-issued photo ID',
      'The owner’s death certificate',
      'Proof of your entitlement, such as a will, trust, court order, or documents showing your relationship to the owner',
    ],
    timing: 'Usually runs closer to the state’s full 180-day review window.',
  },
  {
    name: 'Business claim',
    who: 'The property belongs to a company, partnership or other organization and you are authorized to act for it.',
    documents: [
      'Photo ID of the person filing',
      'Proof of your authority to act for the business',
      'Proof of the business’s connection to the property, such as its name and address at the time',
    ],
    timing: 'Usually runs closer to the state’s full 180-day review window.',
  },
  {
    name: 'Multiple-owner claim',
    who: 'The property is held jointly, such as a joint bank account.',
    documents: [
      'Identification for each owner who is claiming',
      'Proof of each owner’s connection to the property',
    ],
    timing:
      'Depends on the property type; every owner’s paperwork has to be complete before the state decides.',
  },
];

export const ELIGIBILITY = {
  canClaim: [
    'The person the property was reported under, including under a maiden name, former name or old address.',
    'Heirs and beneficiaries of an owner who has died, and the representative of their estate.',
    'A business or organization, through someone authorized to act for it.',
    'Each owner of jointly held property.',
  ],
  proof: [
    'That you are who you say you are — a government-issued photo ID.',
    'That you are connected to the property — usually an address you lived at when it was reported, or documents showing your relationship to the owner.',
  ],
  limits: [
    'We file claims for property reported to the State of California. Money held by another state has to be claimed through that state’s program.',
    'Property that has already been paid out by the state cannot be claimed again.',
  ],
  freeAlternative:
    'You never need a service to claim from California: you can search and file yourself, free, with the State Controller’s Office. We exist for people who would rather hand the paperwork, the follow-up and the waiting to someone else.',
};

export const FEE_FACTS = [
  `Searching is free. There is nothing to pay upfront.`,
  `Our fee is ${FEE_PERCENT}% of what we recover for you, deducted at payout. If we recover nothing, you owe nothing.`,
  'California law caps what a recovery service may charge at 10% of the property returned to you (Code of Civil Procedure section 1582).',
  'The fee is written into the recovery agreement you sign before we file anything.',
];

export const PROCESS_STEPS = [
  {
    num: '01',
    title: 'Search',
    meta: '~ 30 SECONDS · FREE',
    description:
      "Type your name (and any maiden name or business name you've used). We query California's unclaimed property database directly — same data the state publishes — and pull back any matches.",
    note: 'You pay nothing to search. Searching is and always will be free.',
  },
  {
    num: '02',
    title: 'Review your results',
    meta: '~ 1 MINUTE',
    description:
      "If we find anything, you'll see a list of properties tied to names matching yours — bank accounts, uncashed checks, dividends, refunds, safe deposit contents, and more. Each entry shows the holder, the property type, and (where California publishes it) the amount.",
    bullets: [
      "Some matches will be yours. Some won't. We help you tell the difference.",
      'Decide which properties you want us to pursue.',
    ],
  },
  {
    num: '03',
    title: 'Sign the recovery agreement',
    meta: '~ 2 MINUTES',
    description:
      'Before we can act on your behalf, you sign a short agreement that authorizes us to file the claim with California and lays out our fee — a percentage of what you ultimately receive. ',
    highlight: "If we don't recover anything, you owe nothing.",
    note: 'The agreement is plain-language, electronic, and you get a copy.',
  },
  {
    num: '04',
    title: 'Upload your documents',
    meta: '~ 5 MINUTES',
    description:
      'California requires proof of identity and proof of your connection to the property (a former address, a deceased relative, a closed account). You upload these directly to us through encrypted channels.',
    bullets: [
      'Government-issued ID',
      'Proof of address (current and/or historical, depending on the claim)',
      'Additional documents for heir, business, or multi-owner claims',
    ],
  },
  {
    num: '05',
    title: 'California processes the claim',
    meta: '30 – 180 DAYS · CALIFORNIA REVIEW',
    description:
      'We assemble your claim package and submit it to the state. From there, the timing is in their hands. By California law, the state has up to 180 days to review a complete claim, but cash-only claims are often processed in 30 to 60 days.',
    note: "We track your claim's status with the state and update you when anything changes. If they request additional documents, we tell you exactly what they need.",
  },
  {
    num: '06',
    title: 'You get paid',
    meta: 'PAYOUT',
    description:
      'Once approved, California issues payment. Our fee is deducted at payout per your agreement, and the balance goes to you. We confirm the amount before anything is finalized.',
    note: "That's it. The money was yours all along — now it's actually in your account.",
  },
];

// The stages the Case ID tracker reports, in order.
export const TRACKING_STAGES = [
  {
    name: 'Property selected',
    detail: 'The properties you chose for this claim are on your case.',
  },
  {
    name: 'Your information',
    detail: 'Your contact details and legal name are on file.',
  },
  {
    name: 'Documents uploaded',
    detail: 'Your ID and proof documents have reached us.',
  },
  {
    name: 'Investigator agreement',
    detail:
      'You have signed the recovery agreement that authorizes us and sets the fee.',
  },
  {
    name: 'State authorization signed',
    detail:
      'You have signed the State Controller’s Office authorization form that lets us file for you.',
  },
  {
    name: 'Claim submitted',
    detail:
      'The claim package has been filed with the state. If the filing or document check fails, this stage says why and we contact you about what to fix.',
  },
  {
    name: 'Claim approved',
    detail:
      'The State Controller’s Office has approved the claim; payment follows.',
  },
];

export const CASE_ID_FACTS = [
  'Your Case ID (for example CM-2026-123456) is created the moment your case is opened, and it is in the confirmation email we send when you submit.',
  'The state issues its own Claim ID only once the filing is accepted. You do not need it to track your claim; once it exists, the tracker shows it too.',
  'Anyone with your Case ID can see your claim’s progress, so treat it like a reference number and share it only with people you trust.',
];
