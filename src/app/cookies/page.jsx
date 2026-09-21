'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CONSENT_EVENT,
  clearConsent,
  readConsent,
} from '../lib/cookieConsent';

// What the site actually stores. Kept next to the prose so the policy and the
// implementation cannot drift apart.
const STORAGE_IN_USE = [
  {
    name: 'cmc_cookie_consent',
    kind: 'Cookie',
    purpose: 'Remembers your cookie choice so we stop asking.',
    retention: '180 days',
    category: 'Essential',
  },
  {
    name: 'userLogin',
    kind: 'Local storage',
    purpose: 'Keeps you signed in and identifies your account.',
    retention: 'Until you sign out',
    category: 'Essential',
  },
  {
    name: 'userData, userCase, userAgreement, ownPropertyIds, propertyData',
    kind: 'Local storage',
    purpose:
      'Holds the claim you are part-way through so a refresh does not lose it.',
    retention: 'Until you sign out',
    category: 'Essential',
  },
  {
    name: 'cmc_verified_email',
    kind: 'Local storage',
    purpose:
      'Remembers the email address you verified by code, so your claim is filed under it.',
    retention: 'Until you sign out, or 2 hours',
    category: 'Essential',
  },
  {
    name: 'activeReferralCode, referralCode',
    kind: 'Local storage',
    purpose: 'Credits the person who referred you when your claim is created.',
    retention: 'Until you sign out',
    category: 'Essential',
  },
  {
    name: 'cmc_analytics_id, cmc_last_seen',
    kind: 'Local storage',
    purpose:
      'Anonymous usage statistics. Only set if you accept analytics, and removed if you decline.',
    retention: 'Removed when you decline',
    category: 'Analytics',
  },
];

export default function CookiesPage() {
  const [activeSection, setActiveSection] = useState('c-what');
  const [consent, setConsent] = useState(null);

  // Reflect the visitor's actual stored choice on the page.
  useEffect(() => {
    const sync = () => setConsent(readConsent());
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);
  const sectionRefs = useRef({});
  const isScrollingRef = useRef(false);

  const sections = [
    { id: 'c-what', title: 'What are cookies?' },
    { id: 'c-use', title: 'How we use cookies' },
    { id: 'c-essential', title: 'Essential cookies' },
    { id: 'c-analytics', title: 'Analytics cookies' },
    { id: 'c-third-party', title: 'Third-party services' },
    { id: 'c-manage', title: 'Managing cookies' },
    { id: 'c-changes', title: 'Changes to this policy' },
    { id: 'c-contact', title: 'Contact us' },
  ];

  useEffect(() => {
    sectionRefs.current = sections.reduce((acc, section) => {
      acc[section.id] = document.getElementById(section.id);
      return acc;
    }, {});
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const scrollPosition = window.scrollY + 120;
      let currentSection = activeSection;

      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sectionRefs.current[sections[i].id];
        if (section) {
          const sectionTop = section.offsetTop;
          const sectionBottom = sectionTop + section.offsetHeight;

          if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
            currentSection = sections[i].id;
            break;
          }
        }
      }

      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };

    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [activeSection, sections]);

  const handleNavClick = (sectionId, event) => {
    event.preventDefault();
    setActiveSection(sectionId);

    const element = document.getElementById(sectionId);
    if (element) {
      isScrollingRef.current = true;

      window.scrollTo({
        top: element.offsetTop - 100,
        behavior: 'smooth',
      });

      window.setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  };

  return (
    <>
      <section className="py-12.5 lg:py-25 border-b border-[#E8E6E3] bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[16ch] mb-6">
            Cookies, in{' '}
            <em className="italic text-[#E1261C] font-normal">
              plain language.
            </em>
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[60ch] leading-relaxed">
            We use cookies to keep CatchMyCash working, understand how people
            use our site, and improve your experience.
          </p>
          <div className="font-['JetBrains_Mono'] text-xs text-[#888888] mt-6 tracking-[0.05em]">
            LAST UPDATED: JANUARY 2026
          </div>
        </div>
      </section>

      <section className="py-12.5 lg:py-20 max-w-[1240px] mx-auto px-6 sm:px-8">
        <div className="grid md:grid-cols-[280px_1fr] gap-12 md:gap-20">
          <aside className="md:sticky md:top-24 self-start">
            <h4 className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#888888] font-semibold mb-4">
              On this page
            </h4>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(event) => handleNavClick(section.id, event)}
                    className={`
                      text-sm block pl-3 border-l-2 transition-all duration-200 cursor-pointer
                      ${
                        activeSection === section.id
                          ? 'border-[#E1261C] text-black'
                          : 'border-[#E8E6E3] text-[#4A4A4A] hover:border-[#E1261C] hover:text-black'
                      }
                    `}
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          {/* min-w-0: a grid item defaults to its content's minimum width, which
              would let the storage table push the page wider than the screen. */}
          <div className="space-y-16 min-w-0">
            <section id="c-what" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                What are cookies?
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                Cookies are small text files stored on your device when you
                visit a website. They help a website remember information about
                your visit and make the site work more reliably.
              </p>
            </section>

            <section id="c-use" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                How we use cookies
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                CatchMyCash uses cookies and similar technologies to:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px]">
                {[
                  'Keep our website secure and available.',
                  'Remember information needed while you use our services.',
                  'Understand website usage and improve our services.',
                  'Measure the performance of our pages and communications.',
                ].map((item) => (
                  <li
                    key={item}
                    className="pl-8 pb-2 border-b border-[#E8E6E3] relative text-[#4A4A4A] leading-relaxed"
                  >
                    <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section id="c-essential" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Essential cookies
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                Essential cookies are required for core features such as
                authentication, account security, navigation, and maintaining
                your session. Because the website cannot function properly
                without them, these cookies cannot be disabled through our
                services.
              </p>
            </section>

            <section id="c-analytics" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Analytics cookies
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                Analytics cookies help us understand which pages are useful,
                how visitors move through the site, and whether features are
                working as intended. We use this information in aggregate to
                improve the CatchMyCash experience. These cookies are not used
                to sell your personal information.
              </p>
            </section>

            <section id="c-third-party" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Third-party services
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                Some features may be provided by trusted service providers,
                such as authentication, communications, analytics, or document
                services. Those providers may set their own cookies or use
                similar technologies in accordance with their privacy policies.
                We only use providers needed to operate and improve our
                services.
              </p>
            </section>

            <section id="c-manage" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Managing cookies
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                You can change your choice at any time using the button below.
                Most browsers also let you view, delete, or block cookies
                through their settings. If you block essential cookies, some
                parts of the website, including sign-in and account features,
                may not work correctly.
              </p>

              <div className="mt-5 rounded-xl border border-[#E8E6E3] bg-[#F7F5F2] p-4">
                <p className="text-sm font-semibold text-[#0A0A0A]">
                  Your current choice
                </p>
                <p className="text-sm text-[#4A4A4A] mt-1">
                  {consent
                    ? consent.analytics
                      ? 'Essential and analytics cookies are allowed.'
                      : 'Only essential cookies are allowed. Analytics are off.'
                    : 'You have not made a choice yet.'}
                </p>
                <button
                  onClick={clearConsent}
                  className="mt-3 inline-flex items-center px-4 py-2 rounded-lg bg-[#E1261C] text-white text-sm font-semibold hover:bg-[#B11912] transition-colors"
                >
                  Manage cookie preferences
                </button>
              </div>

              <h3 className="font-['Fraunces'] text-xl font-semibold mt-8 mb-3">
                What we store
              </h3>
              {/* Stacked cards on phones, a table from md up: four columns of
                  prose cannot be read at 375px. */}
              <ul className="md:hidden space-y-3">
                {STORAGE_IN_USE.map((row) => (
                  <li
                    key={row.name}
                    className="rounded-xl border border-[#E8E6E3] p-4"
                  >
                    <p className="font-['JetBrains_Mono'] text-[12px] text-[#0A0A0A] break-words">
                      {row.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5">
                      <span className="text-xs text-[#4A4A4A]">{row.kind}</span>
                      <span className="text-[#E8E6E3]">&middot;</span>
                      <span
                        className={`text-[11px] font-semibold ${
                          row.category === 'Analytics'
                            ? 'text-[#9A6400]'
                            : 'text-[#00785A]'
                        }`}
                      >
                        {row.category}
                      </span>
                    </div>
                    <p className="text-sm text-[#4A4A4A] mt-2 leading-relaxed">
                      {row.purpose}
                    </p>
                    <p className="text-xs text-[#888888] mt-2">
                      Kept: {row.retention}
                    </p>
                  </li>
                ))}
              </ul>

              <div className="hidden md:block overflow-x-auto rounded-xl border border-[#E8E6E3]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#F7F5F2] text-left">
                      <th className="px-4 py-2.5 font-semibold text-[#0A0A0A]">Name</th>
                      <th className="px-4 py-2.5 font-semibold text-[#0A0A0A]">Type</th>
                      <th className="px-4 py-2.5 font-semibold text-[#0A0A0A]">Purpose</th>
                      <th className="px-4 py-2.5 font-semibold text-[#0A0A0A]">Retention</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STORAGE_IN_USE.map((row) => (
                      <tr key={row.name} className="border-t border-[#E8E6E3] align-top">
                        <td className="px-4 py-3 font-['JetBrains_Mono'] text-[12px] text-[#0A0A0A] break-all">
                          {row.name}
                        </td>
                        <td className="px-4 py-3 text-[#4A4A4A] whitespace-nowrap">
                          {row.kind}
                          <span
                            className={`block text-[11px] font-semibold ${
                              row.category === 'Analytics'
                                ? 'text-[#9A6400]'
                                : 'text-[#00785A]'
                            }`}
                          >
                            {row.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#4A4A4A]">{row.purpose}</td>
                        <td className="px-4 py-3 text-[#4A4A4A] whitespace-nowrap">
                          {row.retention}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-sm text-[#888888] mt-3">
                Some of these are stored in your browser&apos;s local storage
                rather than as cookies. They serve the same purposes and are
                listed here so this page reflects everything the site keeps on
                your device.
              </p>
            </section>

            <section id="c-changes" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Changes to this policy
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                We may update this Cookies Policy when our services or legal
                requirements change. The updated version will be posted on this
                page with a new “Last updated” date.
              </p>
            </section>

            <section id="c-contact" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Contact us
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                If you have questions about our use of cookies, contact us at
                <span className="text-black font-semibold">
                  {' '}
                  help@catchmycash.com
                </span>
                .
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}

