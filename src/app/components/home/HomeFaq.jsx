'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQS } from '../../lib/content/faqs';

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
  const [open, setOpen] = useState([0]);
  const toggle = (index) =>
    setOpen((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]));

  return (
    <section
      aria-labelledby="home-faq-heading"
      className="relative overflow-hidden bg-white border border-[#E8E6E3] rounded-xl px-5 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-12 shadow-md"
    >
      <div aria-hidden="true" className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#E1261C] to-[#B11912]" />
      {/* Heading beside the questions on a laptop, above them on smaller screens. */}
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-14">
        <div className="mb-6 lg:mb-0">
          <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.15em] uppercase text-[#E1261C] mb-2">
            Questions people ask first
          </p>
          <h2
            id="home-faq-heading"
            className="font-['Fraunces'] text-[28px] sm:text-[34px] font-semibold leading-tight tracking-[-0.01em] text-[#0A0A0A]"
          >
            Before you search
          </h2>
          <p className="mt-3 text-[15px] sm:text-base leading-relaxed text-[#4A4A4A] max-w-sm">
            Straight answers about cost, paperwork and timing.
          </p>
          <Link
            href="/faq"
            className="mt-4 inline-block text-[15px] font-semibold text-[#E1261C] underline-offset-4 hover:underline"
          >
            Open the FAQ page →
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
