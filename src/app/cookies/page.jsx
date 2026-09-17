'use client';

import { useEffect, useRef, useState } from 'react';

export default function CookiesPage() {
  const [activeSection, setActiveSection] = useState('c-what');
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

          <div className="space-y-16">
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
                Most browsers let you view, delete, or block cookies through
                their settings. If you block essential cookies, some parts of
                the website, including sign-in and account features, may not
                work correctly. Browser settings also vary, so refer to your
                browser&apos;s help documentation for instructions.
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

