'use client';
import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react';
import { ImageWithFallback } from './uicomponents/ImageWithFallback';
import ClaimTracker from './ClaimTracker';
import HeirsCallout from './home/HeirsCallout';
import HomeFaq from './home/HomeFaq';
import HomeGuides from './home/HomeGuides';

const SolutionArray = [
  {
    num: '1',
    title: 'We Search & Find',
    desc: 'Our advanced system scans all California databases',
  },
  {
    num: '2',
    title: 'We Handle Everything',
    desc: 'Professional case preparation and submission',
  },
  {
    num: '3',
    title: 'You Get Paid',
    desc: '94% success rate - money in your account',
  },
];

const ResonsArray = [
  {
    icon: Clock,
    title: 'Extremely Time-Consuming',
    desc: 'Average claim takes 6-18 months to process',
  },
  {
    icon: FileText,
    title: 'Complex Legal Documentation',
    desc: 'Requires multiple forms, notarizations, and proof documents',
  },
  {
    icon: AlertTriangle,
    title: 'High Rejection Rate',
    desc: 'Over 70% of DIY claims are rejected due to errors',
  },
];

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

const ArrowRight = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M4 12H20M20 12L14 6M20 12L14 18"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// The brand rule along the top edge of a card.
const CardTopRule = () => (
  <div
    aria-hidden="true"
    className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]"
  />
);

const CARD = 'relative overflow-hidden bg-white border border-[#E8E6E3] rounded-xl shadow-md';

// The home page has no motion: everything is on screen as soon as it loads.
const LandingPage = ({ onNext, guides = [] }) => {
  return (
    <div className="bg-[#F7F5F2] font-body">
      {/* Hero. It fills the first screen under the site header (see .home-hero
          in globals.css), so on a laptop at 100% the next section no longer
          peeks in under it. */}
      <section className="home-hero relative overflow-hidden flex flex-col">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -left-40 -top-40 hidden h-[460px] w-[460px] rounded-full border-[56px] border-[#E1261C]/[0.06] md:block"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -bottom-48 hidden h-[520px] w-[520px] rounded-full border-[64px] border-[#E1261C]/[0.07] md:block"
        />

        <div className="relative flex-1 flex items-center">
          <div className="w-full max-w-5xl mx-auto px-5 sm:px-6 lg:px-8 py-14 sm:py-16 text-center">
            <p className="font-['JetBrains_Mono'] text-[12px] sm:text-[13px] tracking-[0.18em] uppercase text-[#E1261C] mb-5">
              California unclaimed property
            </p>
            <h1 className="font-['Fraunces'] text-[34px] sm:text-[46px] lg:text-[60px] font-bold leading-[1.06] tracking-[-0.02em] text-[#0A0A0A] mb-6 text-balance">
              Millions in Unclaimed Property
              <span className="block text-[#E1261C] italic font-normal">Waiting for You</span>
            </h1>

            <p className="text-[17px] sm:text-[20px] leading-relaxed text-[#4A4A4A] max-w-3xl mx-auto mb-9">
              The California unclaimed property process is complex,
              time-consuming, and often unsuccessful. Let our expert investigators
              recover what&apos;s rightfully yours.
            </p>

            <button
              type="button"
              onClick={onNext}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 px-8 sm:px-12 py-5 bg-[#E1261C] text-white text-[17px] sm:text-[20px] font-semibold rounded-xl shadow-md transition-colors hover:bg-[#B11912] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1261C]"
            >
              Catch My Cash Now
              <ArrowRight />
            </button>

            <ul className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-[13px] sm:text-[14px] text-[#4A4A4A] font-['JetBrains_Mono']">
              {['Free search', 'No upfront costs', '10% only if we recover'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-[#E1261C]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <a
          href="#home-details"
          className="relative mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium text-[#888888] transition-colors hover:text-[#0A0A0A]"
        >
          See how it works
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>

      <div
        id="home-details"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-16 sm:pb-20 space-y-10 sm:space-y-14 scroll-mt-24"
      >
        <div className={`${CARD} p-5 sm:p-6 max-w-3xl mx-auto`}>
          <ClaimTracker />
        </div>

        {/* Stats: a row of three from tablet up; on a phone each is a short
            line (icon beside the figure) so the three do not fill a screen. */}
        <div className="grid md:grid-cols-3 grid-cols-1 gap-3 md:gap-6">
          {[
            { icon: TrendingUp, value: formatCurrency(stats.totalRecovered), label: 'Total Recovered' },
            { icon: Users, value: stats.happyClients.toLocaleString('en-US'), label: 'Happy Clients' },
            { icon: Award, value: `${stats.successRate}%`, label: 'Success Rate' },
          ].map((item) => (
            <div
              key={item.label}
              className={`${CARD} flex items-center gap-4 px-5 py-4 md:flex-col md:gap-0 md:p-6 md:text-center`}
            >
              <div className="w-12 h-12 shrink-0 bg-[#FCE9E7] rounded-full flex items-center justify-center md:mb-3">
                <item.icon className="h-6 w-6 text-[#E1261C]" aria-hidden="true" />
              </div>
              <div>
                <div className="sm:text-[30px] text-[24px] leading-tight font-bold text-[#0A0A0A] md:mb-1 font-['Fraunces']">
                  {item.value}
                </div>
                <p className="text-[#4A4A4A] text-sm font-['JetBrains_Mono']">{item.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Why most people never get their money back */}
        <section aria-labelledby="home-why-heading" className={`${CARD} p-6 sm:p-8`}>
          <CardTopRule />
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 shrink-0 bg-[#FCE9E7] rounded-full flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-[#E1261C]" aria-hidden="true" />
            </div>
            <h2
              id="home-why-heading"
              className="sm:text-[26px] text-[22px] font-bold leading-tight text-[#0A0A0A] font-['Fraunces']"
            >
              Why Most People Never Get Their Money Back
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
            <div className="hidden md:block w-full h-56 lg:h-60">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1590966550724-e041c146b85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25leSUyMGNhc2glMjBwcm9wZXJ0eSUyMGRvY3VtZW50cyUyMGxlZ2FsfGVufDF8fHx8MTc1NzA0MjE1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Complex legal documents"
                loading="lazy"
                className="w-full h-full object-cover rounded-lg shadow-sm"
              />
            </div>

            <ul className="divide-y divide-[#E8E6E3]">
              {ResonsArray.map((item) => (
                <li key={item.title} className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
                  <item.icon className="h-6 w-6 shrink-0 text-[#E1261C] mt-0.5" aria-hidden="true" />
                  <div>
                    <div className="font-semibold font-['JetBrains_Mono'] text-[#0A0A0A]">
                      {item.title}
                    </div>
                    <div className="text-[#4A4A4A] font-['Inter'] text-[15px] mt-1">
                      {item.desc}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* We make it simple */}
        <section aria-labelledby="home-simple-heading" className={`${CARD} p-6 sm:p-8`}>
          <CardTopRule />
          <h2
            id="home-simple-heading"
            className="sm:text-[26px] text-[22px] font-bold text-[#0A0A0A] mb-8 text-center font-['Fraunces']"
          >
            We Make It Simple – You Get Paid
          </h2>

          {/* Three columns from tablet up; on a phone each step is a row with
              its number beside it. */}
          <ol className="grid md:grid-cols-3 grid-cols-1 gap-3 md:gap-6">
            {SolutionArray.map((item) => (
              <li
                key={item.num}
                className="flex items-start gap-4 p-4 border border-[#E8E6E3] rounded-xl bg-white md:block md:p-6 md:text-center"
              >
                <div className="bg-[#FCE9E7] rounded-full w-12 h-12 md:w-16 md:h-16 shrink-0 flex items-center justify-center md:mx-auto md:mb-4">
                  <span className="text-xl md:text-2xl font-bold text-[#E1261C] font-['Fraunces']">{item.num}</span>
                </div>
                <div>
                  <h3 className="text-base font-semibold font-['JetBrains_Mono'] mb-1 md:mb-2 text-[#0A0A0A]">{item.title}</h3>
                  <p className="text-[#4A4A4A] text-sm">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Simple pricing */}
        <section aria-labelledby="home-pricing-heading" className={`${CARD} text-center p-6 sm:p-8`}>
          <CardTopRule />
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-[#E1261C]" aria-hidden="true" />
            </div>
            <h2
              id="home-pricing-heading"
              className="sm:text-[26px] text-[22px] font-bold text-[#0A0A0A] font-['Fraunces']"
            >
              Simple Pricing
            </h2>
          </div>

          <div className="text-5xl sm:text-6xl font-bold text-[#E1261C] mb-2 font-['Fraunces']">
            <span className="text-black">10</span>%
          </div>

          <p className="text-[#4A4A4A] mb-6 sm:text-[18px] text-[16px]">
            You only pay when we successfully recover your money
          </p>
          <ul className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 sm:text-[14px] text-[13px] text-[#888888] font-['JetBrains_Mono']">
            {['No upfront costs', 'No hidden fees', 'No risk to you'].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span aria-hidden="true" className="w-2 h-2 bg-[#E1261C] rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Optional sections: each is its own component, so removing one line
            here removes that section and nothing else. */}
        <HeirsCallout onSearch={onNext} />
        <HomeFaq />
        <HomeGuides guides={guides} />

        {/* Closing call to action */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onNext}
            className="inline-flex w-full sm:w-auto items-center justify-center gap-2 sm:gap-3 px-5 sm:px-14 py-5 bg-[#E1261C] text-white text-[16px] sm:text-[20px] font-semibold rounded-xl shadow-md transition-colors hover:bg-[#B11912] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E1261C]"
          >
            Start Your Free Property Search
            <ArrowRight />
          </button>

          <p className="text-[#888888] mt-5 sm:text-[18px] text-[16px]">
            Join{' '}
            <span className="text-[#E1261C] font-semibold">
              {stats.happyClients.toLocaleString('en-US')}+
            </span>{' '}
            people who have recovered their money
          </p>
        </div>

        {/* Plain links into the guides, so they are reachable from the body of
            the page and not only from the header and footer. */}
        <nav aria-label="Guides" className="pt-8 border-t border-[#E8E6E3] text-center">
          <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.15em] uppercase text-[#888888] mb-4">
            Before you start
          </p>
          <ul className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-[15px]">
            {GUIDE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-[#0A0A0A] underline decoration-[#E1261C] decoration-2 underline-offset-4 hover:text-[#E1261C] transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default LandingPage;
