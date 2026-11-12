// Starter topics, and optionally starter draft guides, for the Resources
// section (/resources).
//
//   node scripts/seed-resources.js            create the topics
//   node scripts/seed-resources.js --drafts   also create the starter guides
//
// Safe to run more than once: a topic or article whose slug is already taken
// is left as it is. Guides are created as drafts, so nothing appears on the
// site until someone reviews and publishes it in Admin → Resources. Their
// facts restate what the site already says (lib/content/guides.js and
// faqs.js); check them against the State Controller's Office before
// publishing.
//
// Reads MONGO_URI from the environment, .env.local or .env.
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ResourceTopic from '../src/app/models/resourceTopic.js';
import ResourcePost from '../src/app/models/resourcePost.js';
import { validatePost, validateTopic } from '../src/app/lib/resources/validate.js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local'), quiet: true });
dotenv.config({ quiet: true });

const STATE_SEARCH = 'https://ucpi.sco.ca.gov/';
const AUTHOR = 'seed script';

const TOPICS = [
  {
    name: 'Unclaimed Property 101',
    slug: 'unclaimed-property-101',
    description: 'What unclaimed property is, where it comes from and how to find out if any is yours.',
    order: 1,
  },
  {
    name: 'Filing a Claim',
    slug: 'filing-a-claim',
    description: 'Proof, paperwork and what California asks for before it releases your money.',
    order: 2,
  },
  {
    name: 'Timing & Fees',
    slug: 'timing-and-fees',
    description: 'How long claims take, what they cost and California’s rules on recovery fees.',
    order: 3,
  },
  {
    name: 'Inheritance & Estates',
    slug: 'inheritance-and-estates',
    description: 'Claiming money that belonged to a relative who has died.',
    order: 4,
  },
  {
    name: 'Avoiding Scams',
    slug: 'avoiding-scams',
    description: 'How to tell a genuine unclaimed property notice from a scam, and keep your details safe.',
    order: 5,
  },
];

const ARTICLES = [
  {
    topic: 'unclaimed-property-101',
    title: 'What Is Unclaimed Property? A Plain-English Guide for Californians',
    slug: 'what-is-unclaimed-property',
    excerpt:
      'Unclaimed property is money a business lost touch with you about and sent to the state. What it is, the forms it takes and how to get it back.',
    tags: ['basics', 'searching', 'property types'],
    featured: true,
    content: `
<p>Unclaimed property is money or another financial asset that a business has lost contact with its owner about. After a period with no activity, usually about three years, the business has to report it and send it to the California State Controller’s Office, which holds it until the owner or their heirs claim it.</p>
<p>It is more common than most people think. A final paycheck mailed to an old address, a utility deposit nobody asked for back, or dividends from shares you forgot about can all end up with the state.</p>
<h2>Where unclaimed money comes from</h2>
<p>Most of it comes from ordinary accounts and payments that lost track of their owner:</p>
<ul>
<li><strong>Bank and credit union accounts</strong>: checking and savings balances, certificates of deposit and closed-account balances that were never paid out.</li>
<li><strong>Uncashed checks and wages</strong>: final paychecks, vendor and refund checks, cashier’s checks and money orders that were never cashed.</li>
<li><strong>Stocks, bonds, dividends and mutual funds</strong>: shares and unpaid dividends from companies and brokerages that could no longer reach the shareholder.</li>
<li><strong>Insurance proceeds</strong>: life insurance benefits, annuity payments and policy refunds that went unpaid.</li>
<li><strong>Refunds, deposits and credit balances</strong>: utility and rental deposits, overpayments and store credits owed back to a customer.</li>
<li><strong>Safe deposit box contents</strong>: the contents of boxes whose rent went unpaid and whose holder could not be found.</li>
</ul>
<p>California’s unclaimed property law does not cover real estate.</p>
<h2>How long the state keeps it</h2>
<p>Once the State Controller holds your property, there is no deadline to claim it. The state keeps it for the owner, or for their heirs, and charges nothing to return it.</p>
<p>New names are added to the state’s records all the time, so a search that finds nothing today can find something later. It is worth searching again every year or two, and after a move, a job change or a death in the family.</p>
<h2>How to find out if you have any</h2>
<p>Search every name you have used, including a maiden name, a former married name and any business name, because property is listed under the name the business had on file. Old addresses matter too: the address the property was reported under is how it is matched to you.</p>
<p>You can search California’s records for free with the State Controller’s <a href="${STATE_SEARCH}">unclaimed property search</a>, or with the <a href="/?step=search">CatchMyCash search</a>, which uses the same data the state publishes.</p>
<h2>How to get it back</h2>
<p>Before it releases property, California needs proof of two things: that you are who you say you are, and that you are connected to the property. For most owners that means a government-issued photo ID and proof of the address the property was reported under. Claims for a relative who has died, for a business or for jointly owned property need a few more documents; <a href="/claim-types">claim types</a> lists them.</p>
<p>You can file the claim yourself with the State Controller’s Office for free. If you would rather hand over the paperwork and the follow-up, a recovery service can file it for you. In California a recovery service’s fee is capped at 10% of the property returned.</p>
`,
    faqs: [
      {
        question: 'Is there a deadline to claim unclaimed property in California?',
        answer: 'No. Once property has been transferred to the State Controller’s Office, the state holds it for the owner or their heirs with no deadline to claim it.',
      },
      {
        question: 'Does it cost anything to claim from the state?',
        answer: 'No. Searching and claiming directly with the State Controller’s Office are free. A recovery service charges a fee, which California caps at 10% of the property returned.',
      },
    ],
    seo: {
      metaTitle: 'What Is Unclaimed Property? A Guide for Californians',
      metaDescription:
        'What unclaimed property is, where it comes from, how long California keeps it and how to claim it back for free. A plain-English guide.',
      focusKeyword: 'unclaimed property',
    },
  },
  {
    topic: 'timing-and-fees',
    title: 'How Long Does a California Unclaimed Property Claim Take?',
    slug: 'how-long-does-a-claim-take',
    excerpt:
      'California has up to 180 days to decide a complete claim, but many owner claims are paid much sooner. What happens after you file, and what slows a claim down.',
    tags: ['timing', 'claims'],
    content: `
<p>By California law, the State Controller’s Office has up to 180 days to review and decide a complete claim. Many claims are paid well before that: cash-only claims by the property’s owner are often processed in 30 to 60 days once the state has everything it needs.</p>
<h2>What happens after you file</h2>
<ol>
<li><strong>The state acknowledges the claim.</strong> This usually happens within a few weeks of it arriving.</li>
<li><strong>It reviews the documents.</strong> If anything is missing or unclear, the state asks for more, and the review waits until it gets it.</li>
<li><strong>It approves the claim and pays.</strong> Payment is issued by check or direct deposit, depending on the type of claim.</li>
</ol>
<p>The 180 days are counted from a <em>complete</em> claim. A request for more paperwork is a common reason a claim takes longer than expected, so sending everything the first time is the best way to keep it moving.</p>
<h2>Which claims take longer</h2>
<p>Some claims usually run closer to the full 180-day review window:</p>
<ul>
<li><strong>Heir and beneficiary claims</strong>, where the owner has died and the state has to confirm who is entitled to the property.</li>
<li><strong>Business claims</strong>, which need proof that the person filing may act for the company.</li>
<li><strong>Security-related claims</strong> for stocks, bonds and dividends.</li>
</ul>
<h3>Claims with more than one owner</h3>
<p>For jointly held property, such as a joint bank account, every owner’s paperwork has to be complete before the state makes a decision. The timing then depends on the property type.</p>
<h2>How to keep a claim moving</h2>
<ul>
<li>Claim under the name and address the property was reported under, and include proof of that address.</li>
<li>Send clear copies of every document your claim type needs; <a href="/claim-types">claim types</a> lists them.</li>
<li>Reply quickly if the state asks for anything else.</li>
</ul>
<p>If CatchMyCash files your claim, you can follow every stage with your Case ID on the <a href="/track-claim">claim tracker</a>, and we tell you when anything changes. <a href="/how-it-works">How it works</a> walks through each step.</p>
<h2>Is there a deadline?</h2>
<p>Not for you. Once property is with the State Controller’s Office there is no deadline to claim it, so there is no penalty for taking the time to gather the right documents.</p>
`,
    faqs: [
      {
        question: 'How long does California have to decide a claim?',
        answer: 'Up to 180 days from receiving a complete claim. Cash-only owner claims are often processed in 30 to 60 days.',
      },
      {
        question: 'How is the money paid?',
        answer: 'Once a claim is approved, the state issues payment by check or direct deposit, depending on the type of claim.',
      },
    ],
    seo: {
      metaTitle: 'How Long Does a California Unclaimed Property Claim Take?',
      metaDescription:
        'California has up to 180 days to decide a complete unclaimed property claim. What happens after you file, which claims take longer and how to avoid delays.',
      focusKeyword: 'unclaimed property claim',
    },
  },
  {
    topic: 'inheritance-and-estates',
    title: 'Claiming Unclaimed Money for a Relative Who Has Died',
    slug: 'claiming-for-a-relative-who-died',
    excerpt:
      'Heirs, beneficiaries and estate representatives can claim money a relative left with the state. What to prove, what to send and how long it takes.',
    tags: ['heirs', 'estates', 'documents'],
    content: `
<p>When someone dies, money owed to them does not disappear. Final paychecks, insurance benefits, refunds and old bank balances can all end up with the California State Controller’s Office, which holds them for the owner’s heirs with no deadline to claim.</p>
<h2>Who can claim</h2>
<p>The state releases a deceased owner’s property to the people entitled to it:</p>
<ul>
<li>the owner’s heirs,</li>
<li>beneficiaries named in a will or trust, and</li>
<li>the representative of the owner’s estate.</li>
</ul>
<h2>What you need to prove</h2>
<p>An heir or beneficiary claim asks you to show who you are, that the owner has died, and that you are entitled to what they left. That usually means:</p>
<ul>
<li>your government-issued photo ID,</li>
<li>the owner’s death certificate, and</li>
<li>proof of your entitlement, such as a will, trust, court order, or documents showing your relationship to the owner.</li>
</ul>
<p>Which document proves entitlement depends on how the estate was handled. If you are unsure, the State Controller’s Office can tell you what it needs for your situation.</p>
<h2>How to find property in a relative’s name</h2>
<p>Search the owner’s full name and any other names they used, and look at every result tied to an address where they lived. The state’s <a href="${STATE_SEARCH}">unclaimed property search</a> and the <a href="/?step=search">CatchMyCash search</a> are both free.</p>
<h2>How long it takes</h2>
<p>Heir claims usually run closer to the state’s full 180-day review window than a simple owner claim, because the state has to confirm who is entitled to the property. Sending every document the first time is the best way to avoid delays.</p>
<h2>Filing it yourself or with help</h2>
<p>You can claim directly from the State Controller’s Office for free. If you would rather not handle the paperwork while dealing with a loss, a recovery service such as CatchMyCash can file for you; California caps its fee at 10% of the property returned. <a href="/eligibility">Who can claim</a> has more on eligibility.</p>
`,
    faqs: [
      {
        question: 'Is there a deadline to claim a deceased relative’s property?',
        answer: 'No. Property held by the State Controller’s Office can be claimed by the owner’s heirs at any time.',
      },
      {
        question: 'Do I need a court order?',
        answer:
          'Not always. The state asks for proof of entitlement, which can be a will, a trust, a court order, or documents showing your relationship to the owner, depending on how the estate was handled.',
      },
    ],
    seo: {
      metaTitle: 'Claiming Unclaimed Money for a Relative Who Has Died',
      metaDescription:
        'How heirs, beneficiaries and estate representatives claim a deceased relative’s unclaimed money in California: who can claim, documents and timing.',
      focusKeyword: 'deceased relative',
    },
  },
  {
    topic: 'avoiding-scams',
    title: 'How to Spot an Unclaimed Money Scam',
    slug: 'how-to-spot-an-unclaimed-money-scam',
    excerpt:
      'Real unclaimed property is free to search and claim from the state. The warning signs that tell a genuine notice from a scam.',
    tags: ['scams', 'safety'],
    content: `
<p>Because unclaimed property is real, it is also a favourite story for scammers. The genuine process follows a few fixed rules, and a message that breaks them is a red flag.</p>
<h2>What the real process looks like</h2>
<ul>
<li><strong>Searching is free.</strong> Anyone can search California’s records at no cost with the State Controller’s <a href="${STATE_SEARCH}">unclaimed property search</a>.</li>
<li><strong>Claiming from the state is free.</strong> The State Controller’s Office charges nothing to return property.</li>
<li><strong>The state asks for identity and a connection to the property</strong>, typically a photo ID and proof of an address, never passwords.</li>
<li><strong>A reputable recovery service puts its fee in writing</strong> before it files anything, and in California that fee is capped at 10% of the property returned.</li>
</ul>
<h2>Warning signs</h2>
<ul>
<li>A demand for an upfront payment, a “release fee” or a “tax” before you can receive the money.</li>
<li>A request to pay by gift card, wire transfer or cryptocurrency.</li>
<li>A request for your online banking password, a PIN or a one-time code.</li>
<li>Pressure to act today or lose the money. Property held by the State Controller’s Office has no deadline to claim.</li>
<li>A fee above 10% of the property, or no written agreement at all.</li>
</ul>
<h2>How to check a notice</h2>
<p>Do not use a phone number or link from the message itself. Search your name yourself on the state’s site, or with the <a href="/?step=search">CatchMyCash search</a>, which shows the same records. If the property is listed, you can claim it directly from the state, or choose a service you have checked.</p>
<h3>If you use a recovery service</h3>
<p>Read the agreement before you sign it. It should name the property, give the fee as a percentage of what is recovered, and say what happens if nothing is recovered. With CatchMyCash the fee is 10% of what we recover, taken at payout, and you owe nothing if we recover nothing.</p>
<h2>If you think you have been targeted</h2>
<p>Stop replying, do not send money or documents, and contact the State Controller’s Office using the details on its official website, <a href="https://www.sco.ca.gov/">sco.ca.gov</a>.</p>
`,
    faqs: [
      {
        question: 'Will the State Controller’s Office ever charge me to claim my money?',
        answer: 'No. Searching and claiming directly with the State Controller’s Office are free.',
      },
      {
        question: 'How much can a recovery service charge in California?',
        answer:
          'California caps a recovery service’s fee at 10% of the property returned to you (Code of Civil Procedure section 1582).',
      },
    ],
    seo: {
      metaTitle: 'How to Spot an Unclaimed Money Scam',
      metaDescription:
        'Real unclaimed property is free to search and claim from California. The warning signs of an unclaimed money scam, and how to check a notice safely.',
      focusKeyword: 'unclaimed money scam',
    },
  },
];

function fail(message) {
  console.error(`seed-resources: ${message}`);
  process.exitCode = 1;
}

async function seedTopics() {
  const bySlug = new Map();
  for (const topic of TOPICS) {
    const existing = await ResourceTopic.findOne({ slug: topic.slug }).lean();
    if (existing) {
      console.log(`  = topic "${existing.name}" already exists`);
      bySlug.set(topic.slug, existing._id);
      continue;
    }
    const { value, errors } = validateTopic(topic);
    if (Object.keys(errors).length) {
      fail(`topic "${topic.name}" is invalid: ${JSON.stringify(errors)}`);
      continue;
    }
    const doc = await ResourceTopic.create(value);
    console.log(`  + topic "${doc.name}" (/resources/topic/${doc.slug})`);
    bySlug.set(topic.slug, doc._id);
  }
  return bySlug;
}

async function seedDrafts(topicIds) {
  for (const article of ARTICLES) {
    const taken = await ResourcePost.exists({ $or: [{ slug: article.slug }, { previous_slugs: article.slug }] });
    if (taken) {
      console.log(`  = article "${article.slug}" already exists`);
      continue;
    }
    const topicId = topicIds.get(article.topic);
    const { value, errors } = validatePost({
      ...article,
      topicId: topicId ? String(topicId) : '',
      status: 'draft',
    });
    if (Object.keys(errors).length) {
      fail(`article "${article.slug}" is invalid: ${JSON.stringify(errors)}`);
      continue;
    }
    await ResourcePost.create({ ...value, created_by: AUTHOR, updated_by: AUTHOR });
    console.log(`  + draft "${value.title}" (${value.word_count} words)`);
  }
}

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    fail('MONGO_URI is not set (environment, .env.local or .env).');
    return;
  }
  const withDrafts = process.argv.includes('--drafts');
  await mongoose.connect(uri);
  try {
    console.log('Topics:');
    const topicIds = await seedTopics();
    if (withDrafts) {
      console.log('Draft articles:');
      await seedDrafts(topicIds);
      console.log('\nReview and publish the drafts in Admin → Resources.');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  fail(error.stack || String(error));
  mongoose.disconnect().catch(() => {});
});
