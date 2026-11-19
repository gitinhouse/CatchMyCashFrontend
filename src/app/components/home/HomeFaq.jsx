'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQS } from '../../lib/content/faqs';
import { HOME_CONTAINER, SECTION_SPACE, SectionHeader, TEXT_LINK } from './Section';

// The FAQ page's own questions and answers, read from the same list, so the
// two never drift apart. To show fewer here, slice it (FAQS.slice(0, 5)).
// The FAQ page carries the FAQPage structured data; marking the same answers
// up a second time here would be a duplicate, so this section has none.
const HOME_FAQS = FAQS;

/**
 * Home page FAQ. Self contained: removing its line in LandingPage removes the
 * section.
 */
export default function HomeFaq() {
  // Every question starts closed.
  const [open, setOpen] = useState([]);
  const toggle = (index) =>
    setOpen((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));

  return (
    <section aria-labelledby="home-faq-heading" className={`bg-white ${SECTION_SPACE}`}>
      {/* Heading beside the questions on a laptop, above them on smaller screens. */}
      <div className={`${HOME_CONTAINER} lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-16`}>
        <div className="mb-8 lg:mb-0">
          <SectionHeader
            id="home-faq-heading"
            eyebrow="Questions people ask first"
            title="Before you search"
            intro="Straight answers about cost, paperwork and timing."
          />
          <Link href="/faq" className={`${TEXT_LINK} mt-5 inline-block text-[15px]`}>
            Open the FAQ page
          </Link>
        </div>

        <div className="border-b border-[#E8E6E3]">
          {HOME_FAQS.map((faq, index) => {
            const isOpen = open.includes(index);
            return (
              <div key={faq.q} className="border-t border-[#E8E6E3]">
                <h3>
                  <button
                    type="button"
                    id={`home-faq-q-${index}`}
                    aria-expanded={isOpen}
                    aria-controls={`home-faq-a-${index}`}
                    onClick={() => toggle(index)}
                    className="w-full text-left py-5 flex justify-between items-center gap-5 font-['Fraunces'] text-[18px] sm:text-[20px] font-semibold tracking-[-0.005em] text-[#0A0A0A] transition-colors hover:text-[#E1261C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E1261C]"
                  >
                    {faq.q}
                    <span
                      aria-hidden="true"
                      className={`w-8 h-8 shrink-0 rounded-full border flex items-center justify-center text-lg leading-none ${
                        isOpen ? 'bg-[#E1261C] border-[#E1261C] text-white' : 'border-[#D4D4D4] text-[#0A0A0A]'
                      }`}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                </h3>
                <div
                  id={`home-faq-a-${index}`}
                  role="region"
                  aria-labelledby={`home-faq-q-${index}`}
                  hidden={!isOpen}
                  className="pb-6 space-y-3"
                >
                  {faq.a.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="text-[15px] sm:text-base leading-relaxed text-[#4A4A4A] max-w-[75ch]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
