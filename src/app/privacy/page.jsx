'use client';

import { useState, useEffect, useRef } from 'react';

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('p-collect');
  const sectionRefs = useRef({});
  const isScrollingRef = useRef(false);

  const sections = [
    { id: 'p-collect', title: 'What we collect' },
    { id: 'p-use', title: 'How we use it' },
    { id: 'p-share', title: 'What\'s shared with California' },
    { id: 'p-protect', title: 'How it\'s protected' },
    { id: 'p-rights', title: 'Your rights' },
    { id: 'p-contact', title: 'Questions' },
  ];

  useEffect(() => {
    sectionRefs.current = sections.reduce((acc, section) => {
      acc[section.id] = document.getElementById(section.id);
      return acc;
    }, {});
  }, [sections]);

  useEffect(() => {
    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const scrollPosition = window.scrollY + 120;
      
      let currentSection = activeSection;
      
      for (let i = sections.length - 1; i >= 0; i--) {
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
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll);
    setTimeout(handleScroll, 100);
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [activeSection, sections]);

  const handleNavClick = (sectionId, e) => {
    e.preventDefault();
    setActiveSection(sectionId);
    
    const element = document.getElementById(sectionId);
    if (element) {
      isScrollingRef.current = true;
      
      const offset = 100;
      const elementPosition = element.offsetTop - offset;
      
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
      
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 1000);
    }
  };

  return (
    <>
      {/* Privacy Hero Section */}
      <section className="py-12.5 lg:py-25 border-b border-[#E8E6E3] bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[16ch] mb-6">
            Your data, in <em className="italic text-[#E1261C] font-normal">plain language.</em>
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[60ch] leading-relaxed">
            We collect what we need to file your claim — nothing more. We share the minimum required with the State Controller's Office. We never sell your data.
          </p>
          <div className="font-['JetBrains_Mono'] text-xs text-[#888888] mt-6 tracking-[0.05em]">
            LAST UPDATED: JANUARY 2026
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="py-12.5 lg:py-20 max-w-[1240px] mx-auto px-6 sm:px-8">
        <div className="grid md:grid-cols-[280px_1fr] gap-12 md:gap-20">
          {/* Sidebar */}
          <aside className="md:sticky md:top-24 self-start">
            <h4 className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#888888] font-semibold mb-4">
              On this page
            </h4>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    onClick={(e) => handleNavClick(section.id, e)}
                    className={`
                      text-sm block pl-3 border-l-2 transition-all duration-200 cursor-pointer
                      ${activeSection === section.id
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

          {/* Main Content */}
          <div className="space-y-16">
            {/* What we collect */}
            <section id="p-collect" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                What we collect
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                We collect only the information needed to (a) help you find unclaimed property and (b) file a successful claim with the State Controller's Office.
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed ">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Search inputs.</span> The names you enter into our search tool, including any prior or maiden names, and the business names you ask us to look up.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Account information.</span> Your name, email address, and phone number when you create an account or sign a recovery agreement.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Claim documents.</span> Government-issued ID, proof of address, and any supporting documents required by California for your specific claim type.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Communications.</span> Messages you send us about your claim, and our responses.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Technical data.</span> Standard web logs (IP address, browser, pages visited) used to keep the site secure and improve it.
                </li>
              </ul>
            </section>

            {/* How we use it */}
            <section id="p-use" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                How we use it
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                Your information is used for one purpose: to help you recover your unclaimed property. Specifically:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px]">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Running searches against California's public database.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Preparing and filing your claim package with California.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Verifying your identity, which is required by California.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Communicating with you about your claim's status.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Processing payment after California approves your claim.
                </li>
              </ul>
              <div className="bg-[#FCE9E7] border-l-3 border-[#E1261C] p-5 mt-6 rounded-r-lg">
                <p className="text-black font-medium">
                  We do not sell your personal information. We do not share it with advertisers, data brokers, or any third party except as described in "What's shared with California" below.
                </p>
              </div>
            </section>

            {/* What's shared with California */}
            <section id="p-share" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                What's shared with the State Controller's Office
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                To file your claim, we transmit a claim package to the state that contains the information they require. This typically includes:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Your full legal name and any prior names tied to the claimed property.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  A copy of your government-issued ID.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Proof of your connection to the property (e.g., proof of a former address, evidence of an heir relationship for deceased-owner claims).
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  The signed recovery agreement, where required.
                </li>
              </ul>
              <p className="text-base leading-relaxed text-[#4A4A4A] mt-4">
                The state uses this information solely to verify and process your claim under California law. We share only what is required for the specific claim — no more.
              </p>
            </section>

            {/* How it's protected */}
            <section id="p-protect" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                How it's protected
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                We treat your documents the way we'd want our own treated.
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px]">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">In transit:</span> all data is sent over TLS-encrypted connections.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">At rest:</span> documents are stored encrypted in access-controlled cloud storage.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Access:</span> only employees handling your claim can view your documents, and access is logged.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  <span className="text-black font-semibold">Retention:</span> we keep claim records for the period required to support the claim and resolve any disputes; after that, they're deleted on a defined schedule.
                </li>
              </ul>
            </section>

            {/* Your rights */}
            <section id="p-rights" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Your rights
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                You can ask us, at any time, what data we hold about you, request a copy, or request deletion (subject to record-keeping requirements tied to a filed claim). California residents have additional rights under the CCPA, including the right to know, the right to delete, and the right to non-discrimination for exercising those rights.
              </p>
              <p className="text-base leading-relaxed text-[#4A4A4A] mt-4">
                To exercise any of these rights, email <span className="text-black font-semibold">help@catchmycash.com</span>.
              </p>
            </section>

            {/* Questions */}
            <section id="p-contact" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Questions
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                If anything here is unclear, or you want to know how a specific piece of your information is being used, write to <span className="text-black font-semibold">help@catchmycash.com</span> and we'll answer.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}