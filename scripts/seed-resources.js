// Starter topics, and optionally draft guides, for the Resources section
// (/resources).
//
//   node scripts/seed-resources.js                  create the topics
//   node scripts/seed-resources.js --drafts         also create every guide below
//   node scripts/seed-resources.js --only=<slug>    create just that guide (and its
//                                                   topic); separate several slugs
//                                                   with commas
//
// Safe to run more than once: a topic or article whose slug is already taken
// is left as it is. Guides are created as drafts, so nothing appears on the
// site until someone reviews and publishes it in Admin → Resources. Their
// facts restate what the site already says (lib/content/guides.js and
// faqs.js) or what the State Controller's Office publishes; check them
// against the State Controller's Office before publishing.
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
const CLAIMIT = 'https://claimit.ca.gov/';
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
  {
    // Researched November 2026 against the State Controller's claim
    // instructions, Claim Affirmation Form, claim regulations and document
    // upload page, and the courts' small estate limits.
    topic: 'filing-a-claim',
    title: 'Documents to Claim Unclaimed Property in California: The Complete Checklist',
    slug: 'documents-to-claim-unclaimed-property-in-california',
    excerpt:
      'California pays a claim only when your paperwork proves who you are and that the property is yours. What to send for each type of claim, when you need a notary, and how to avoid delays.',
    tags: ['documents', 'proof of address', 'notarization', 'claim checklist', 'heirs', 'business claims'],
    content: `
<p>California returns unclaimed property only when a claim proves two things: that you are who you say you are, and that the property really is yours. The documents to claim unclaimed property depend on whose name is on the record and what kind of property it is, so a claim for a forgotten paycheck needs less than one for a late parent’s shares. This checklist covers what the State Controller’s Office asks for in each situation, and how to send it without slowing your claim down.</p>
<h2>The documents to claim unclaimed property, at a glance</h2>
<p>For a cash claim in your own name, most people need four things:</p>
<ol>
<li><strong>A signed Claim Affirmation Form.</strong> This is the claim form the state creates when you file at <a href="${CLAIMIT}">claimit.ca.gov</a>. Your Claim ID is printed in its top corner.</li>
<li><strong>A copy of your photo ID</strong>, such as a current driver’s license or state ID card.</li>
<li><strong>Proof of your current mailing address.</strong></li>
<li><strong>Proof that you lived at, or received mail at, the address on the record</strong>, known as the reported address.</li>
</ol>
<p>Add a notary’s stamp if the claim is worth $1,000 or more, or if it includes securities or a safe deposit box. Heirs, businesses and people who share the property with someone else send a few extra papers, covered below.</p>
<h2>Why California asks for so much</h2>
<p>The State Controller holds unclaimed property for as long as it takes its owners to come forward, and it never meets you in person. Your paperwork is how it tells you apart from someone with a similar name, or from someone trying to collect money that isn’t theirs. The claim form asks for details such as your Social Security number and date of birth, and you sign it under penalty of perjury. Your documents then back up two things: <strong>identity</strong> (you are the person named on the record) and <strong>entitlement</strong> (the property belongs to you).</p>
<h2>A claim in your own name</h2>
<h3>Photo identification</h3>
<p>Send a clear copy of a current government-issued photo ID, such as a driver’s license or state ID card. Copy the whole card, with your name, photo and expiration date readable.</p>
<h3>Proof of your current address</h3>
<p>The state needs to know where to send your payment, and that you really live there. A recent document with your name and current address works, such as a mortgage statement, a property tax bill, a pay stub, or a bank or credit card statement.</p>
<h3>Proof of the reported address</h3>
<p>This is the step that trips most people up. Every unclaimed property record carries the address the business had for its owner when it lost touch, and that address appears on the claim details printed with your claim form. You need to show a link to it: a document from that time with your name at that address, such as an old utility bill, a tax document or a bank statement. It doesn’t need to be recent. It needs to match.</p>
<p>If the record shows no address at all, send something else that ties the property to you, such as the original account statement, the uncashed check or the policy paperwork.</p>
<h3>If your name has changed</h3>
<p>Property is listed under the name the business had on file, which may be a maiden name or a former married name. Include the document that links the two names, such as a marriage certificate, a divorce decree or a court order for a name change.</p>
<h2>When your claim needs a notary</h2>
<p>Most small claims don’t. California requires your signature on the Claim Affirmation Form to be notarized when:</p>
<ul>
<li>the claim is worth <strong>$1,000 or more</strong> in total;</li>
<li>it includes <strong>securities</strong>, such as stocks, bonds or mutual fund shares, whatever their value; or</li>
<li>it includes the contents of a <strong>safe deposit box</strong>, whatever their value.</li>
</ul>
<p>Don’t sign the form until you are with the notary, and bring a current photo ID.</p>
<h2>Extra documents for other kinds of claims</h2>
<h3>Property you share with someone else</h3>
<p>When a record lists more than one owner, such as a joint bank account, each owner signs a Claim Affirmation Form. Owners can file together and share the same supporting documents; if they file separately, each claim needs the full set. Safe deposit box contents are released to one person, so the other owners or heirs sign a release form authorizing it.</p>
<h3>A relative who has died</h3>
<p>Heirs and beneficiaries prove both the death and their right to the property. Expect to send:</p>
<ul>
<li>a <strong>certified copy of the death certificate</strong>;</li>
<li>if the estate went through probate, a certified or court-endorsed copy of the <strong>Letters Testamentary or Letters of Administration</strong>, or the Final Decree of Distribution if the probate has closed, along with the estate’s federal employer identification number (FEIN);</li>
<li>if there was no probate and the estate was small enough, a <strong>small estate declaration</strong> under California Probate Code section 13101. For deaths on or after April 1, 2025, the limit is $208,850 of the person’s California personal property, and it is adjusted every few years;</li>
<li>documents showing how you are related to the owner, such as birth or marriage certificates, and your own photo ID.</li>
</ul>
<p>If the property passed through a trust with more than one trustee, every trustee signs the claim unless the trust lets them act alone. Our <a href="/claim-types">claim types</a> page explains heir claims in more detail.</p>
<h3>A business</h3>
<p>A business claim has to show that the company owns the property and that the person filing may act for it. That usually means proof of the filer’s role, such as an officer’s title, the company’s federal employer identification number, and records tying the company to the property, such as its name and address at the time. A company that has closed adds its certificate of dissolution. If a claim can’t show both ownership and authority, the state may not be able to pay it.</p>
<h2>How to send your documents</h2>
<ol>
<li><strong>Find your property.</strong> Search at claimit.ca.gov, or with the free <a href="/?step=search">CatchMyCash search</a>, which uses the same records, and select everything that is yours.</li>
<li><strong>File the claim.</strong> If your claim qualifies, you can file it online. Otherwise the site gives you a Claim Affirmation Form to print, sign and, when required, have notarized.</li>
<li><strong>Upload your documents.</strong> The state’s upload page asks for your Claim ID and email address and takes up to five files at a time. Upload only to the claim the documents belong to: files sent to a closed or different claim are not reviewed.</li>
<li><strong>Watch your email.</strong> A few claims need original documents, and the State Controller’s Office emails you if yours does. It also writes if anything is missing.</li>
</ol>
<p>Scan or photograph each page flat, in full and in good light. A copy the reviewer can’t read is treated the same as a missing one.</p>
<h2>Mistakes that slow a claim down</h2>
<ul>
<li><strong>Proving the wrong address.</strong> A current utility bill doesn’t show where you lived when the property was reported. Send proof of both addresses.</li>
<li><strong>A name that doesn’t match.</strong> If the record uses a former name, include the document that connects it to your current one.</li>
<li><strong>A missing notary stamp</strong> on a claim of $1,000 or more, or on any securities or safe deposit box claim.</li>
<li><strong>A missing co-owner.</strong> Every listed owner signs the claim, or releases their share.</li>
<li><strong>Cropped or blurry copies.</strong> Every corner of the page should be visible.</li>
<li><strong>An unanswered letter.</strong> The state has up to 180 days to decide a claim, counted from when it is complete, so a request left unanswered means a longer wait.</li>
</ul>
<p>Once the state has everything, cash-only claims by owners are often paid in 30 to 60 days. Heir, business and securities claims usually take closer to the full 180 days. <a href="/how-it-works">How it works</a> walks through each stage.</p>
<h2>Getting the paperwork right the first time</h2>
<p>You can file directly with the State Controller’s Office for free, and many people do. If you would rather not work out which documents your claim needs, CatchMyCash files it for you: we tell you exactly what to upload for your claim type, check every document before it goes to the state, and track the claim until it is paid. Our fee is 10% of what you recover, and only if you recover it. <a href="/?step=search">Start a free search</a> to see what California is holding in your name.</p>
`,
    faqs: [
      {
        question: 'Do I have to mail original documents?',
        answer:
          'Usually not. Most documents can be uploaded as clear copies with your Claim ID. A few claims need originals, and the State Controller’s Office tells you by email when yours does.',
      },
      {
        question: 'What if I have nothing from my old address?',
        answer:
          'Look for anything from the years you lived there that shows your name and that address, such as a tax document, a bank or credit card statement, a utility bill or a pay stub. If you still come up empty, call the State Controller’s Office at (800) 992-4647 and ask what it will accept before you file.',
      },
      {
        question: 'Does my claim need to be notarized?',
        answer:
          'Only if the claim totals $1,000 or more, or includes securities (such as stocks or mutual fund shares) or the contents of a safe deposit box. Smaller cash claims do not need a notary.',
      },
      {
        question: 'How long does the state take once it has my documents?',
        answer:
          'The State Controller’s Office has up to 180 days to decide a complete claim. Cash-only owner claims are often paid in 30 to 60 days; claims for heirs, businesses and securities usually take longer.',
      },
    ],
    seo: {
      metaTitle: 'Documents to Claim Unclaimed Property in California',
      metaDescription:
        'The documents to claim unclaimed property in California: ID, proof of address, when you need a notary, and the extra papers heirs and businesses must send.',
      focusKeyword: 'documents to claim unclaimed property',
    },
  },
  {
    // Researched November 2026: dormancy periods and reporting dates from the
    // table California files with the National Association of Unclaimed
    // Property Administrators; Code of Civil Procedure sections 1513, 1513.5,
    // 1520, 1531, 1540(c) and 1563; the State Controller's IRA reporting
    // guide, Owner Bill of Rights, claim guidelines and ClaimIt FAQ.
    topic: 'unclaimed-property-101',
    title: 'When Does Money Become Unclaimed in California? Dormancy Periods Explained',
    slug: 'california-dormancy-periods-unclaimed-property',
    excerpt:
      'Most forgotten money in California goes to the state after three years without contact, but paychecks go after one year and traveler’s checks after fifteen. How the clock works, and how to stop it.',
    tags: ['dormancy periods', 'bank accounts', 'uncashed checks', 'wages', 'stocks and dividends', 'California law'],
    content: `
<p>Money doesn’t become unclaimed overnight. In California, a business holding your money has to wait out a set stretch of silence, called the dormancy period, before it hands that money to the State Controller’s Office. For most property the dormancy period is three years. Some kinds of money move much faster, and a few take far longer. Here is how the clock works, how long it runs for each kind of property, and what you can do to keep your money out of the state’s hands in the first place.</p>
<h2>What starts the clock</h2>
<p>For a bank or credit union account, the clock measures time without any sign of life from you. Under California law, an account counts as abandoned once more than three years pass in which you have not:</p>
<ul>
<li>made a deposit or a withdrawal;</li>
<li>cashed an interest check or presented a passbook;</li>
<li>written to the bank, or contacted it electronically, about the account; or</li>
<li>otherwise shown interest in the account in a way the bank has on record.</li>
</ul>
<p>The law also looks at your wider relationship with the bank. If you have been active on another account with the same institution in the last three years, including an IRA, a quiet account generally isn’t reported, as long as the bank has been corresponding with you.</p>
<p>For money that was simply owed to you, such as a paycheck, a refund or an insurance benefit, the clock starts when the money became payable and runs for as long as it stays unclaimed. A check you never cashed starts aging on the day it was issued.</p>
<h2>California dormancy periods by type of property</h2>
<p>These are the waiting periods California applies before a business must report property to the state:</p>
<ul>
<li><strong>Checking, savings and certificates of deposit:</strong> 3 years</li>
<li><strong>Cashier’s checks and other official bank checks:</strong> 3 years</li>
<li><strong>Money orders:</strong> 7 years</li>
<li><strong>Traveler’s checks:</strong> 15 years</li>
<li><strong>Wages and paychecks:</strong> 1 year</li>
<li><strong>Refunds ordered by a court or government agency:</strong> 1 year</li>
<li><strong>Stocks, dividends and bonds:</strong> 3 years</li>
<li><strong>Life insurance benefits that have become payable:</strong> 3 years</li>
<li><strong>IRA and Keogh retirement accounts:</strong> 3 years after the funds become payable or distributable</li>
<li><strong>Safe deposit box contents:</strong> 3 years</li>
<li><strong>Utility deposits and refunds:</strong> 3 years</li>
<li><strong>Money held by courts and government agencies:</strong> 3 years</li>
<li><strong>Payouts from a company that is dissolving or liquidating:</strong> 6 months</li>
<li><strong>Everything else</strong>, including vendor payments, customer refunds and credit balances: 3 years</li>
</ul>
<p>Gift cards are a special case. Most gift cards sold in California can’t carry an expiration date, and those aren’t turned over to the state. Gift certificates that do carry an expiration date follow the three-year rule.</p>
<h2>What happens when the dormancy period runs out</h2>
<p>California uses a two-step process, so in most cases you get two warnings before your money moves:</p>
<ol>
<li><strong>The business tries to reach you.</strong> It generally has to mail you a notice six to twelve months before it reports your property. A notice from a bank opens with the words “THE STATE OF CALIFORNIA REQUIRES US TO NOTIFY YOU”. Banks don’t have to send one for balances under $50.</li>
<li><strong>The business reports the property.</strong> Most businesses file their report with the State Controller by October 31; life insurers file by April 30.</li>
<li><strong>The State Controller writes to you.</strong> For owners it has an address for, it mails a notice by mid-April (mid-October for life insurance). The notice gives a date by which you can still claim the money from the business itself.</li>
<li><strong>The business sends the money to the state.</strong> Payment is due in June for most property, and in December for life insurance. From then on, you claim from the state.</li>
</ol>
<p>If the letters went to an old address, you may never see them. That is the most common reason people learn about their property only when they search for it.</p>
<h2>What changes once the state holds it</h2>
<ul>
<li><strong>There is no deadline.</strong> The State Controller holds the property for you or your heirs for as long as it takes, and claiming it from the state is free.</li>
<li><strong>No interest is added.</strong> California stopped paying interest on unclaimed property claims in August 2003.</li>
<li><strong>Stocks may be sold.</strong> The state generally sells securities 18 to 20 months after they are reported. If yours have been sold, a claim pays the sale proceeds, not the shares, and not any growth after the sale.</li>
<li><strong>Claims take time.</strong> The State Controller’s Office has up to 180 days to decide a complete claim.</li>
<li><strong>Real estate isn’t included.</strong> California’s unclaimed property law covers money and other financial assets, not land or homes.</li>
</ul>
<h2>How to keep your money from going dormant</h2>
<ul>
<li><strong>Touch every account at least once a year.</strong> A small deposit or withdrawal, or a message to the bank about the account, restarts the clock.</li>
<li><strong>Update your address everywhere when you move:</strong> banks, brokerages, insurers, utilities, your employer and any former employer that still owes you a final paycheck.</li>
<li><strong>Cash checks when they arrive.</strong> A final paycheck has only a one-year dormancy period.</li>
<li><strong>Open letters that mention unclaimed property.</strong> A notice from your bank or the State Controller is your chance to keep the money where it is.</li>
<li><strong>Keep a list of your accounts</strong> and tell someone you trust where it is, so your family can find them if they ever need to.</li>
<li><strong>Search once a year.</strong> New property is reported every year, so a search that finds nothing today can find something next year.</li>
</ul>
<h2>Already lost track of something?</h2>
<p>If a dormancy period has already run out on an account of yours, the money is waiting with the State Controller’s Office. You can search California’s records for free at <a href="${CLAIMIT}">claimit.ca.gov</a> or with the <a href="/?step=search">CatchMyCash search</a>, which uses the same data, and claim it directly from the state at no cost. If you would rather hand over the paperwork, CatchMyCash files the claim for you for 10% of what you recover, and nothing if you recover nothing. <a href="/how-it-works">How it works</a> explains each step, and <a href="/claim-types">claim types</a> covers what California holds.</p>
`,
    faqs: [
      {
        question: 'How long does money have to sit before California considers it unclaimed?',
        answer:
          'Three years for most property, counted from your last contact about the account or from when the money became payable to you. Wages go after one year, money orders after seven years and traveler’s checks after fifteen.',
      },
      {
        question: 'Will I be warned before my money is sent to the state?',
        answer:
          'Usually. The business generally has to mail you a notice six to twelve months before it reports your property (banks don’t have to for balances under $50), and the State Controller’s Office mails a notice to owners it has an address for before the money is transferred.',
      },
      {
        question: 'Does California pay interest on unclaimed property?',
        answer:
          'No. California stopped paying interest on unclaimed property claims in August 2003. You receive the property itself: the amount that was reported, or for securities the state has sold, the sale proceeds.',
      },
      {
        question: 'Can an account go dormant if I still use the same bank?',
        answer:
          'Recent activity on another account you hold at the same bank, including an IRA, generally keeps a quiet account from being reported, as long as the bank has been corresponding with you. The safest habit is still to use every account at least once a year.',
      },
    ],
    seo: {
      metaTitle: 'California Dormancy Periods: When Money Becomes Unclaimed',
      metaDescription:
        'How long money can sit untouched before California treats it as unclaimed: the dormancy period for bank accounts, paychecks, checks, stocks and more.',
      focusKeyword: 'dormancy period',
    },
  },
];

function fail(message) {
  console.error(`seed-resources: ${message}`);
  process.exitCode = 1;
}

async function seedTopics(only = null) {
  const bySlug = new Map();
  for (const topic of TOPICS) {
    if (only && !only.has(topic.slug)) continue;
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

async function seedDrafts(topicIds, articles) {
  for (const article of articles) {
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
  const onlyArg = process.argv.find((arg) => arg.startsWith('--only='));
  const onlySlugs = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null;
  let articles = process.argv.includes('--drafts') ? ARTICLES : [];
  if (onlySlugs) {
    const unknown = onlySlugs.filter((slug) => !ARTICLES.some((a) => a.slug === slug));
    if (unknown.length) {
      fail(`no guide with slug ${unknown.join(', ')}. Known: ${ARTICLES.map((a) => a.slug).join(', ')}`);
      return;
    }
    articles = ARTICLES.filter((a) => onlySlugs.includes(a.slug));
  }
  await mongoose.connect(uri);
  try {
    console.log('Topics:');
    // With --only, just the topics those guides need.
    const topicIds = await seedTopics(onlySlugs ? new Set(articles.map((a) => a.topic)) : null);
    if (articles.length) {
      console.log('Draft articles:');
      await seedDrafts(topicIds, articles);
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
