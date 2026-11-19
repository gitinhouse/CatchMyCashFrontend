'use client';
import React from 'react';
import Link from 'next/link';
import { AlertTriangle, Check, ChevronDown, Clock, FileText } from 'lucide-react';
import { FEE_PERCENT } from '../lib/site';
import TrackClaimCard from './home/TrackClaimCard';
import HeirsCallout from './home/HeirsCallout';
import HomeFaq from './home/HomeFaq';
import HomeGuides from './home/HomeGuides';
import { EYEBROW, HOME_CONTAINER, SECTION_SPACE, SectionHeader, TEXT_LINK } from './home/Section';

const STEPS = [
  {
    title: 'We search & find',
    desc: 'Our advanced system scans all California databases',
  },
  {
    title: 'We handle everything',
    desc: 'Professional case preparation and submission',
  },
  {
    title: 'You get paid',
    desc: '94% success rate – money in your account',
  },
];

const REASONS = [
  {
    icon: Clock,
    title: 'Extremely time-consuming',
    desc: 'Average claim takes 6–18 months to process',
  },
  {
    icon: FileText,
    title: 'Complex legal documentation',
    desc: 'Requires multiple forms, notarizations, and proof documents',
  },
  {
    icon: AlertTriangle,
    title: 'High rejection rate',
    desc: 'Over 70% of DIY claims are rejected due to errors',
  },
];

const PROMISES = ['No upfront costs', 'No hidden fees', 'No risk to you'];

const GUIDE_LINKS = [
  { href: '/eligibility', label: 'Who can claim' },
  { href: '/claim-types', label: 'Types of property and claims' },
  { href: '/how-it-works', label: 'How it works' },
  { href: '/track-claim', label: 'Track your claim' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About us' },
];

// Shown as they stand rather than counted in after mount, so the server's HTML
// and every crawler read the same figures the visitor sees.
// TODO(business): these are fixed figures, not read from claim data. Confirm
// them, or wire them to the real totals, before relying on them as proof.
const stats = {
  totalRecovered: 2847392,
  happyClients: 1247,
  successRate: 94,
};

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);

const STATS = [
  { value: formatCurrency(stats.totalRecovered), label: 'Total recovered' },
  { value: stats.happyClients.toLocaleString('en-US'), label: 'Happy clients' },
  { value: `${stats.successRate}%`, label: 'Success rate' },
];

// The fee worked through on a round sum, so the percentage reads as dollars.
const EXAMPLE_RECOVERED = 1000;
const EXAMPLE_FEE = (EXAMPLE_RECOVERED * FEE_PERCENT) / 100;

const ArrowRight = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 12H20M20 12L14 6M20 12L14 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PRIMARY_BUTTON =
  'inline-flex w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 rounded-xl bg-[#E1261C] px-5 sm:px-8 py-4 text-center text-[16px] sm:text-[18px] font-semibold text-white shadow-md transition-colors hover:bg-[#B11912] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1261C]';

// The home page has no motion: everything is on screen as soon as it loads.
// Each section is a full-width band whose content lines up with the site
// header (see home/Section.jsx).
const LandingPage = ({ onNext, guides = [] }) => {
  return (
    <div className="bg-[#F7F5F2] font-body">
      {/* Hero. It fills the first screen under the site header (see .home-hero
          in globals.css). The pitch on the left, Track Your Claim on the right;
          on smaller screens the card follows the pitch. */}
      <section
        aria-labelledby="home-hero-heading"
        className="home-hero relative flex flex-col overflow-hidden"
      >
        <div className="relative flex flex-1 items-center">
          <div className={`${HOME_CONTAINER} py-12 sm:py-16 lg:py-12`}>
            <div className="grid items-center gap-10 sm:gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-14 xl:gap-20">
              <div className="max-w-2xl">
                <p className={`${EYEBROW} mb-5`}>California unclaimed property</p>
                <h1
                  id="home-hero-heading"
                  className="font-['Fraunces'] text-[36px] sm:text-[48px] xl:text-[60px] font-bold leading-[1.06] tracking-[-0.02em] text-[#0A0A0A] mb-6 text-balance"
                >
                  Millions in Unclaimed Property
                  <span className="block text-[#E1261C] italic font-normal">Waiting for You</span>
                </h1>

                <p className="text-[17px] sm:text-[19px] xl:text-[20px] leading-relaxed text-[#4A4A4A] max-w-[36rem] mb-8">
                  The California unclaimed property process is complex,
                  time-consuming, and often unsuccessful. Let our expert investigators
                  recover what&apos;s rightfully yours.
                </p>

                <button type="button" onClick={onNext} className={PRIMARY_BUTTON}>
                  Catch My Cash Now
                  <ArrowRight />
                </button>

                {/* 13px in the narrow two-column hero of a small laptop, so the
                    three stay on one line. */}
                <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[13px] sm:text-[14px] lg:text-[13px] xl:text-[14px] text-[#4A4A4A] font-['JetBrains_Mono']">
                  {['Free search', 'No upfront costs', `${FEE_PERCENT}% only if we recover`].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#E1261C]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative w-full max-w-xl lg:max-w-none">
                {/* A soft ring behind the card's top corner, anchored to the
                    card so it stays with it on any screen width. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-40 -top-40 hidden h-[440px] w-[440px] rounded-full border-[56px] border-[#E1261C]/[0.07] lg:block"
                />
                <TrackClaimCard />
              </div>
            </div>
          </div>
        </div>

        {/* Only where the hero is a single screen: on a phone or tablet the
            card already runs past the fold. */}
        <a
          href="#home-how"
          className="relative mx-auto mb-5 hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-[#888888] transition-colors hover:text-[#0A0A0A] lg:inline-flex"
        >
          See how it works
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      {/* Figures: a row of three from tablet up, a short list on a phone. */}
      <section aria-label="CatchMyCash in numbers" className="border-y border-[#E8E6E3] bg-white">
        <dl className={`${HOME_CONTAINER} grid divide-y divide-[#E8E6E3] md:grid-cols-3 md:divide-x md:divide-y-0`}>
          {STATS.map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between gap-4 py-5 md:flex-col-reverse md:items-start md:justify-end md:gap-2 md:px-8 md:py-9 md:first:pl-0 lg:px-12"
            >
              <dt className="font-['JetBrains_Mono'] text-[12px] sm:text-[13px] tracking-[0.14em] uppercase text-[#4A4A4A]">
                {item.label}
              </dt>
              <dd className="font-['Fraunces'] text-[26px] md:text-[34px] lg:text-[40px] font-semibold leading-none tracking-[-0.01em] text-[#0A0A0A]">
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Why most people never get their money back */}
      <section aria-labelledby="home-why-heading" className={`bg-[#F7F5F2] ${SECTION_SPACE}`}>
        <div className={`${HOME_CONTAINER} grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20`}>
          <SectionHeader
            id="home-why-heading"
            eyebrow="The problem"
            title="Why most people never get their money back"
            intro="We handle the process for you: we prepare the paperwork, file the claim and track it to payout."
          />
          <ul className="divide-y divide-[#E8E6E3] border-y border-[#E8E6E3]">
            {REASONS.map((item) => (
              <li key={item.title} className="flex gap-5 py-6 sm:py-7">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#E8E6E3] bg-white">
                  <item.icon className="h-5 w-5 text-[#E1261C]" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="text-[17px] sm:text-[18px] font-semibold text-[#0A0A0A]">{item.title}</h3>
                  <p className="mt-1 text-[15px] sm:text-[16px] leading-relaxed text-[#4A4A4A]">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section
        id="home-how"
        aria-labelledby="home-how-heading"
        className={`scroll-mt-20 bg-white ${SECTION_SPACE}`}
      >
        <div className={HOME_CONTAINER}>
          <div className="mb-10 flex flex-col gap-4 sm:mb-14 md:flex-row md:items-end md:justify-between">
            <SectionHeader
              id="home-how-heading"
              eyebrow="How it works"
              // No-break space before the dash, so a line never starts with it.
              title={'We make it simple\u00A0– you get paid'}
            />
            <Link href="/how-it-works" className={`${TEXT_LINK} shrink-0 text-[15px]`}>
              See the full process
            </Link>
          </div>

          <ol className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative border-t border-[#E8E6E3] pt-6">
                <span aria-hidden="true" className="absolute -top-px left-0 h-[3px] w-12 bg-[#E1261C]" />
                <p aria-hidden="true" className="font-['JetBrains_Mono'] text-[13px] tracking-[0.14em] uppercase text-[#E1261C]">
                  Step {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-['Fraunces'] text-[22px] sm:text-[24px] font-semibold leading-snug tracking-[-0.01em] text-[#0A0A0A]">
                  {step.title}
                </h3>
                <p className="mt-2 text-[15px] sm:text-[16px] leading-relaxed text-[#4A4A4A]">{step.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Simple pricing */}
      <section aria-labelledby="home-pricing-heading" className={`bg-[#F7F5F2] ${SECTION_SPACE}`}>
        <div className={`${HOME_CONTAINER} grid items-center gap-10 lg:grid-cols-2 lg:gap-20`}>
          <div>
            <SectionHeader
              id="home-pricing-heading"
              eyebrow="Pricing"
              title="Simple pricing"
              intro="You only pay when we successfully recover your money."
            />
            <ul className="mt-8 space-y-3.5">
              {PROMISES.map((item) => (
                <li key={item} className="flex items-center gap-3 text-[16px] sm:text-[17px] font-medium text-[#0A0A0A]">
                  <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E1261C]">
                    <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-[#E8E6E3] bg-white p-6 shadow-sm sm:p-10">
            <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.16em] uppercase text-[#4A4A4A]">Our fee</p>
            <p className="mt-3 font-['Fraunces'] text-[64px] sm:text-[80px] font-bold leading-none tracking-[-0.03em] text-[#0A0A0A]">
              {FEE_PERCENT}
              <span className="text-[#E1261C]">%</span>
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-[#4A4A4A]">
              of the money we recover, taken at payout. If we recover nothing, you owe nothing.
            </p>

            <div className="mt-8 border-t border-[#E8E6E3] pt-6">
              <p className="font-['JetBrains_Mono'] text-[11px] tracking-[0.16em] uppercase text-[#888888] mb-3">
                For example
              </p>
              <dl className="space-y-2.5 text-[15px] sm:text-[16px] tabular-nums">
                <div className="flex justify-between gap-4">
                  <dt className="text-[#4A4A4A]">We recover</dt>
                  <dd className="font-medium text-[#0A0A0A]">{formatCurrency(EXAMPLE_RECOVERED)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-[#4A4A4A]">Our fee ({FEE_PERCENT}%)</dt>
                  <dd className="font-medium text-[#0A0A0A]">−{formatCurrency(EXAMPLE_FEE)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-[#E8E6E3] pt-2.5">
                  <dt className="font-semibold text-[#0A0A0A]">You receive</dt>
                  <dd className="font-semibold text-[#0A0A0A]">{formatCurrency(EXAMPLE_RECOVERED - EXAMPLE_FEE)}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Optional sections: each is its own component, so removing one line
          here removes that section and nothing else. */}
      <HeirsCallout onSearch={onNext} />
      <HomeFaq />
      <HomeGuides guides={guides} />

      {/* Closing call to action, with plain links into the guides so they are
          reachable from the body of the page and not only from the header and
          footer. */}
      <section
        aria-labelledby="home-cta-heading"
        className="border-b border-white/10 bg-[#0A0A0A] text-white"
      >
        <div className={`${HOME_CONTAINER} py-16 sm:py-20`}>
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="max-w-[40rem]">
              <h2
                id="home-cta-heading"
                className="font-['Fraunces'] text-[30px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.1] tracking-[-0.015em] text-balance"
              >
                See what California is holding in your name.
              </h2>
              <p className="mt-4 text-[16px] sm:text-[18px] text-[#D4D4D4]">
                Join{' '}
                <span className="font-semibold text-white">{stats.happyClients.toLocaleString('en-US')}+</span>{' '}
                people who have recovered their money.
              </p>
            </div>
            <button
              type="button"
              onClick={onNext}
              className={`${PRIMARY_BUTTON} shrink-0 shadow-none focus-visible:outline-white`}
            >
              Start Your Free Property Search
              <ArrowRight />
            </button>
          </div>

          <nav aria-label="Guides" className="mt-12 border-t border-white/15 pt-8">
            <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.16em] uppercase text-[#888888] mb-4">
              Before you start
            </p>
            <ul className="flex flex-wrap gap-x-6 gap-y-3 text-[15px]">
              {GUIDE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white underline decoration-[#E1261C] decoration-2 underline-offset-4 transition-colors hover:text-[#FCE9E7]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
