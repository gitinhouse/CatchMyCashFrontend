'use client';

import { useState, useEffect, useRef } from 'react';

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('p-collect');
  const sectionRefs = useRef({});
  const isScrollingRef = useRef(false);

  const sections = [
    { id: 'p-acceptanceTerms', title: 'Acceptance of Terms' },
    { id: 'p-use', title: 'Use of Our Services' },
    { id: 'p-accountResponsibility', title: 'Account Responsibilities ' },
    { id: 'p-smsCommunications', title: 'SMS Communications' },
    // { id: 'p-share', title: "What's shared with California" },
    { id: 'p-smsProgramTerms', title: 'SMS Program Terms' },
    { id: 'p-optIn', title: 'Opt-In and Consent' },
    { id: 'p-optOut', title: 'Opt-Out Instructions' },
    { id: 'p-help', title: 'Help and Support' },
    { id: 'p-message', title: 'Message Frequency' },
    { id: 'p-contact', title: 'Contact Us' },
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
        behavior: 'smooth',
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
            Terms & Conditions in{' '}
            <em className="italic text-[#E1261C] font-normal">
              plain language.
            </em>
          </h1>
          {/*<p className="text-xl text-[#4A4A4A] max-w-[60ch] leading-relaxed">
            We collect what we need to file your claim — nothing more. We share the minimum required with the State Controller's Office. We never sell your data.
          </p> */}
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

          {/* Main Content */}
          <div className="space-y-16">
            {/* What we collect */}
            <section id="p-acceptanceTerms" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Acceptance of Terms
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                By using the CatchMyCash website or services, you agree to
                comply with these Terms & Conditions. If you do not agree with
                these terms, please do not use our website or services.
              </p>
            </section>

            {/* How we use it */}
            <section id="p-use" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Use of Our Services
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                Our services are intended for lawful purposes only. You agree to
                provide accurate and complete information when using our website
                and to use our services in accordance with all applicable laws
                and regulations.
              </p>
            </section>

            <section id="p-accountResponsibility" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Account Responsibilities
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                If you create an account, you are responsible for maintaining
                the confidentiality of your account credentials and for all
                activities that occur under your account. <br /> You agree to
                notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section id="p-smsCommunications" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                SMS Communications
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                If you choose to receive SMS messages from CatchMyCash, you
                agree to receive transactional text messages related to your
                account activity and service updates.
                <br />
                Examples of SMS messages include:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Account notifications
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Service request confirmations
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Status updates
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Requests for additional information
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Security or verification notifications
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Important service announcements
                </li>
              </ul>
              <p className="text-base leading-relaxed text-[#4A4A4A] mt-4">
                SMS messages are sent only to users who have provided their
                mobile phone number and explicitly consented to receive SMS
                communications.
              </p>
            </section>

            <section id="p-smsProgramTerms" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                SMS Program Terms
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                By opting in to receive SMS messages:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  You authorize CatchMyCash to send SMS notifications to the
                  mobile number you provided.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  SMS messages are intended only for the person who provided the
                  phone number.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Consent to receive SMS messages is not a condition of
                  purchasing any product or service.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  SMS communications are intended for informational and
                  transactional purposes only.
                </li>
              </ul>
            </section>

            <section id="p-optIn" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Opt-In and Consent
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                You may opt in to receive SMS messages by:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Selecting the SMS consent checkbox during process.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Providing your mobile phone number through our website.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Explicitly requesting SMS notifications through our services.
                </li>
              </ul>
              <p className="text-base leading-relaxed text-[#4A4A4A] mt-4">
                The SMS consent checkbox is never pre-selected. Your consent is
                recorded at the time of opt-in.
              </p>
            </section>

            <section id="p-optOut" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Opt-Out Instructions
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                You may stop receiving SMS messages at any time by replying:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Stop:After opting out, you will receive one confirmation
                  message confirming your unsubscribe request. No additional SMS
                  messages will be sent unless you opt in again.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  You may opt back in by replying: START
                </li>
              </ul>
            </section>

            {/* What's shared with California */}
            {/* <section id="p-share" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                What's shared with the State Controller's Office
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                To file your claim, we transmit a claim package to the state
                that contains the information they require. This typically
                includes:
              </p>
              <ul className="space-y-3 mt-4 font-['Inter'] font-[15px] ">
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Your full legal name and any prior names tied to the claimed
                  property.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  A copy of your government-issued ID.
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  Proof of your connection to the property (e.g., proof of a
                  former address, evidence of an heir relationship for
                  deceased-owner claims).
                </li>
                <li className="pl-8 pb-2 border-b border-[#E8E6E3] font-[15px] relative text-[#4A4A4A] leading-relaxed">
                  <span className="absolute left-2 top-2.5 w-2 h-2 bg-[#E1261C]"></span>
                  The signed recovery agreement, where required.
                </li>
              </ul>
              <p className="text-base leading-relaxed text-[#4A4A4A] mt-4">
                The state uses this information solely to verify and process
                your claim under California law. We share only what is required
                for the specific claim — no more.
              </p>
            </section> */}

            {/* Questions */}
            <section id="p-help" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Help and Support
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                If you need assistance with our SMS program, reply:{' '}
                <span className="text-black font-semibold">HELP</span> and we'll
                answer.
              </p>
            </section>

            <section id="p-message" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Message Frequency
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                Message frequency varies based on your account activity and
                service interactions.
              </p>
              <p className="text-base leading-relaxed text-[#4A4A4A] mb-4">
                We only send messages when necessary to provide requested
                updates or important notifications.
              </p>
            </section>

            <section id="p-contact" className="scroll-mt-24">
              <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-5 pb-3 border-b-2 border-[#E1261C] inline-block">
                Contact Us
              </h2>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                If you have questions regarding these Terms & Conditions, please
                contact us.
              </p>
              <p className="text-base leading-relaxed text-[#4A4A4A]">
                <span className="text-black font-semibold">
                  <br /> Email: help@catchmycash.com <br /> Website:
                  https://catchmycash.com
                  <br />
                  SMS Support: Reply HELP to any SMS message.
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
