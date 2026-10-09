'use client';

import React, { useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Award,
} from 'lucide-react';
import { ImageWithFallback } from './uicomponents/ImageWithFallback';
import { Button } from './uicomponents/Button';
import ClaimTracker from './ClaimTracker';

// ============================================================
// DESIGN TOKENS — matching the HTML mockup exactly
// ============================================================
const colors = {
  black: '#0A0A0A',
  white: '#FFFFFF',
  offWhite: '#F7F5F2',
  red: '#E1261C',
  redDeep: '#B11912',
  redTint: '#FCE9E7',
  gray900: '#1A1A1A',
  gray700: '#4A4A4A',
  gray500: '#888888',
  gray300: '#D4D4D4',
  gray200: '#E8E6E3',
  gray100: '#F0EEEB',
};

// ============================================================
// Header Component — exactly matching the HTML mockup
// ============================================================

const SolutionArray = [
  {
    num: '1',
    title: 'We Search & Find',
    desc: 'Our advanced system scans all California databases',
    delay: 2.8,
  },
  {
    num: '2',
    title: 'We Handle Everything',
    desc: 'Professional case preparation and submission',
    delay: 3.0,
  },
  {
    num: '3',
    title: 'You Get Paid',
    desc: '94% success rate - money in your account',
    delay: 3.2,
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

// One rule shared by the three cards below, so the three cannot drift apart. It wipes in from
// the left once two separate things are true: the rule has been scrolled to, and the card it
// sits on has finished its own mount reveal. Both are needed, because an observer sees layout
// boxes and not opacity — a visitor who reloads mid-page or scrolls straight down would
// otherwise spend the one-shot trigger on a card that is still fully transparent, and the wipe
// would never be seen. Each condition latches, so a drawn rule stays drawn and never replays.
const SectionTopBorder = ({ revealed, sheenDuration }) => {
  const ref = useRef(null);
  // The negative bottom viewport margin holds the wipe back until a good slice of the card
  // is on screen; `amount` cannot stand in for that here, the rule itself is only 4px tall.
  // At 120px the wipe was often finishing while the card was still arriving from below,
  // which is most of why nobody noticed it.
  const inView = useInView(ref, { once: true, margin: '0px 0px -220px 0px' });
  const reduceMotion = useReducedMotion();
  const drawn = reduceMotion || (inView && revealed);

  return (
    <motion.div
      ref={ref}
      // origin-top-left so the height it gains while sweeping grows downwards
      // into the card's own padding and never nudges anything.
      className="absolute top-0 left-0 w-full h-1 origin-top-left bg-gradient-to-r from-[#E1261C] to-[#B11912]"
      // A 4px rule sliding in is almost impossible to catch, so it sweeps across
      // at three times its height and then settles back to a hairline: the eye
      // has something to follow, and what is left behind is the same rule as
      // before. The settle is deliberately slower than the sweep and starts
      // before it ends, which is what keeps it reading as one movement.
      initial={{ scaleX: 0, scaleY: 3, opacity: 0.75 }}
      animate={
        drawn
          ? { scaleX: 1, scaleY: 1, opacity: 1 }
          : { scaleX: 0, scaleY: 3, opacity: 0.75 }
      }
      transition={
        reduceMotion
          ? { duration: 0 }
          : {
              scaleX: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
              scaleY: { duration: 0.7, delay: 0.55, ease: [0.33, 1, 0.68, 1] },
              opacity: { duration: 0.35, ease: 'easeOut' },
            }
      }
    >
      {/* Opt-in, so a card that never carried a travelling sheen does not acquire one. */}
      {sheenDuration && !reduceMotion ? (
        <motion.div
          className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: sheenDuration,
            repeat: Infinity,
            ease: 'linear',
          }}
        />
      ) : null}
    </motion.div>
  );
};

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

const LandingPage = ({ onNext }) => {
  const router = useRouter();

  // Each of the three cards below tells its own top rule when its mount reveal has landed, so
  // the rule never wipes in behind a still-transparent card. See SectionTopBorder.
  const [reasonsRevealed, setReasonsRevealed] = useState(false);
  const [solutionRevealed, setSolutionRevealed] = useState(false);
  const [pricingRevealed, setPricingRevealed] = useState(false);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleLogin = async () => {
    router.push('/userLogin');
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] font-body">
      {/* Header - exactly matching HTML mockup */}
      {/* <SiteHeader onLoginClick={handleLogin} /> */}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section. Painted as it stands by the server: it is the largest
            thing on a phone's first screen, so an entrance fade here would only
            push back the moment the page counts as loaded. */}
        <div className="text-center mb-16">
          <h1 className="md:text-5xl text-[30px] font-bold text-[#0A0A0A] mb-6 font-['Fraunces']">
            Millions in Unclaimed Property
            <span className="text-[#E1261C] italic font-normal block">
              Waiting for You
            </span>
          </h1>

          <p className="md:text-[20px] text-[16px] text-[#4A4A4A] mb-8 max-w-3xl mx-auto font-['Inter'] ">
            The California unclaimed property process is complex,
            time-consuming, and often unsuccessful. Let our expert investigators
            recover what's rightfully yours.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <button
              onClick={onNext}
              className="inline-flex items-center justify-center gap-3 px-12 py-6 bg-[#E1261C] text-white text-[16px] sm:text-[20px] font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg"
            >
              Catch My Cash Now
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 12H20M20 12L14 6M20 12L14 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </motion.span>
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-white border border-[#E8E6E3] rounded-xl p-6 mb-12 shadow-md hover:shadow-lg transition-all duration-300 max-w-3xl mx-auto"
        >
          <ClaimTracker />
        </motion.div>


        {/* Stats Cards - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="grid md:grid-cols-3 grid-cols-1 gap-4 md:gap-6 mb-16"
        >
          {[
            {
              icon: TrendingUp,
              value: formatCurrency(stats.totalRecovered),
              label: 'Total Recovered',
            },
            {
              icon: Users,
              value: stats.happyClients.toLocaleString('en-US'),
              label: 'Happy Clients',
            },
            {
              icon: Award,
              value: `${stats.successRate}%`,
              label: 'Success Rate',
            },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              className="bg-white text-center p-6 rounded-xl border border-[#E8E6E3] shadow-md hover:shadow-lg transition-all duration-300"
              whileHover={{ scale: 1.03, y: -5 }}
            >
              <div className="w-12 h-12 bg-[#FCE9E7] rounded-full flex items-center justify-center mx-auto mb-3">
                <item.icon className="h-6 w-6 text-[#E1261C]" />
              </div>
              <div className="sm:text-[30px] text-[24px] font-bold text-[#0A0A0A] mb-1 font-['Fraunces']">
                {item.value}
              </div>
              <p className="text-[#4A4A4A] text-sm font-['JetBrains_Mono']">
                {item.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Why Most People Never Get Their Money Back - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          onAnimationComplete={() => setReasonsRevealed(true)}
          className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-12 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <SectionTopBorder revealed={reasonsRevealed} sheenDuration={2} />

          <motion.div
            className="flex items-center mb-6"
            whileHover={{ scale: 1.02 }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <AlertTriangle className="h-8 w-8 text-[#E1261C] mr-3" />
            </motion.div>
            <h2 className="sm:text-[24px] text-[20px] font-bold text-[color:var(--color-red-300)] font-['Fraunces']">
              Why Most People Never Get Their Money Back
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.6 }}
              className="hidden md:block w-full h-48 lg:h-[192px]"
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1590966550724-e041c146b85f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb25leSUyMGNhc2glMjBwcm9wZXJ0eSUyMGRvY3VtZW50cyUyMGxlZ2FsfGVufDF8fHx8MTc1NzA0MjE1Mnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Complex legal documents"
                className="w-full h-full object-cover rounded-lg filter brightness-95 hover:brightness-100 transition-all duration-300 shadow-sm"
              />
            </motion.div>

            <div className="space-y-4 md:space-y-6">
              {ResonsArray.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.8 + index * 0.2 }}
                  className="flex items-start group p-3 rounded-lg hover:bg-[#FCE9E7] transition-colors duration-300"
                  whileHover={{ x: 5 }}
                >
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.3 }}
                  >
                    <item.icon className="h-6 w-6 text-[#E1261C] mr-3 mt-1" />
                  </motion.div>
                  <div>
                    {/* Both hover states of the title are brand reds a shade apart, so the
                        underline is what actually signals the row is interactive. */}
                    <div className="font-semibold font-['JetBrains_Mono'] text-[color:var(--color-red-300)] group-hover:text-[color:var(--color-red-400)] group-hover:underline group-hover:underline-offset-2 transition-colors">
                      {item.title}
                    </div>
                    <div className="text-[color:var(--color-red-400)] font-['Inter'] text-sm">
                      {item.desc}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* We Make It Simple - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 2.4 }}
          onAnimationComplete={() => setSolutionRevealed(true)}
          className="bg-white border border-[#E8E6E3] rounded-xl p-8 mb-12 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <SectionTopBorder revealed={solutionRevealed} sheenDuration={3} />

          <motion.h2
            className="sm:text-[24px] text-[20px] font-bold text-[#0A0A0A] mb-8 text-center font-['Fraunces']"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 2.6 }}
          >
            We Make It Simple - You Get Paid
          </motion.h2>

          <div className="grid md:grid-cols-3 grid-cols-1 gap-4 md:gap-6">
            {SolutionArray.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: item.delay }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white text-center p-6 border border-[#E8E6E3] rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <motion.div
                  className="bg-[#FCE9E7] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 relative"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.span
                    className="text-2xl font-bold text-[#E1261C] relative z-10 font-['Fraunces']"
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.5,
                    }}
                  >
                    {item.num}
                  </motion.span>
                  <motion.div
                    className="absolute inset-0 bg-[#FCE9E7] rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      delay: index * 0.7,
                    }}
                  />
                </motion.div>
                <h3 className="text-base font-semibold font-['JetBrains_Mono'] mb-2 text-[#0A0A0A] group-hover:text-[#E1261C] transition-colors">
                  {item.title}
                </h3>
                <p className="text-[#4A4A4A] group-hover:text-[#0A0A0A] transition-colors text-sm">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Simple Pricing - with visible borders and shadows */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 3.4 }}
          whileHover={{ scale: 1.02 }}
          onAnimationComplete={() => setPricingRevealed(true)}
          className="text-center bg-white border border-[#E8E6E3] rounded-xl p-8 relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
        >
          <SectionTopBorder revealed={pricingRevealed} />

          <motion.div
            className="flex items-center justify-center mb-4"
            whileHover={{ scale: 1.1 }}
          >
            <motion.div
              className="w-10 h-10 bg-[#FCE9E7] rounded-full flex items-center justify-center"
              animate={{ rotate: [0, 360] }} // ✅ ADDED: continuous rotation, matching Figma
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }} // ✅ ADDED: slow, smooth, infinite spin
            >
              <DollarSign className="h-5 w-5 text-[#E1261C]" />
            </motion.div>
            <h2 className="sm:text-[24px] text-[20px] font-bold text-[#0A0A0A] ml-2 font-['Fraunces']">
              Simple Pricing
            </h2>
          </motion.div>

          <motion.div className="relative" whileHover={{ scale: 1.1 }}>
            <motion.div className="text-4xl sm:text-6xl font-bold text-[#E1261C] mb-2 relative z-10 font-['Fraunces']">
              <span className="text-black"> 10</span>%
            </motion.div>
          </motion.div>

          <div className="text-[#4A4A4A] mb-6 sm:text-[18px] text-[16px]">
            You only pay when we successfully recover your money
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.8 }}
            className="flex flex-wrap justify-center items-center gap-2 sm:text-[14px] text-[12px] text-[#888888] font-['JetBrains_Mono']"
          >
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No upfront costs</span>
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No hidden fees</span>
            <span className="w-2 h-2 bg-[#E1261C] rounded-full"></span>
            <span>No risk to you</span>
          </motion.div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 4 }}
          className="text-center mt-12"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <button
              onClick={onNext}
              className="inline-flex items-center justify-center gap-3 px-6 sm:px-16 py-6 bg-[#E1261C] text-white text-[16px] sm:text-[20px] font-semibold rounded-xl hover:bg-[#B11912] transition-all shadow-md hover:shadow-lg relative overflow-hidden group"
            >
              <motion.span
                className="relative z-10 flex items-center gap-3"
                whileHover={{ x: 5 }}
              >
                Start Your Free Property Search
                <motion.span
                  animate={{ x: [0, 8, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12H20M20 12L14 6M20 12L14 18"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.span>
              </motion.span>
            </button>
          </motion.div>

          <motion.div
            className="text-[#888888] mt-6 sm:text-[18px] text-[16px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.4 }}
          >
            Join{' '}
            <span className="text-[#E1261C] font-semibold">
              {stats.happyClients.toLocaleString('en-US')}+
            </span>{' '}
            people who have recovered their money
          </motion.div>
        </motion.div>

        {/* Plain links into the guides, so they are reachable from the body of
            the page and not only from the header and footer. */}
        <nav
          aria-label="Guides"
          className="mt-14 pt-8 border-t border-[#E8E6E3] text-center"
        >
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
