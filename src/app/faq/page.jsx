'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FAQS } from '../lib/content/faqs';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState([0]);

  const toggleItem = (index) => {
    setOpenItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index],
    );
  };

  const faqs = FAQS;

  return (
    <>
      <section className="py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[14ch] mb-6">
            Questions, answered{' '}
            <em className="italic text-[#E1261C] font-normal">straight.</em>
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[63ch]">
            If you don't see your question here, write to us at
            help@catchmycash.com or through our{' '}
            <Link href="/contact" className="text-[#E1261C] underline underline-offset-2">contact page</Link> — real human, same
            day.
          </p>
        </div>
      </section>

      <section className="max-w-[880px] mx-auto px-6 sm:px-8 pb-20">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className={`border-t border-[#E8E6E3] ${index === faqs.length - 1 ? 'border-b' : ''}`}
          >
            {/* Question headings, so the page outline reads as the list of
                questions it is; the button inside is what toggles. */}
            <h2>
              <button
                id={`faq-q-${index}`}
                aria-expanded={openItems.includes(index)}
                aria-controls={`faq-a-${index}`}
                onClick={() => toggleItem(index)}
                className="w-full text-left py-7 flex justify-between items-center gap-6 font-['Fraunces'] text-xl md:text-[22px] font-semibold tracking-[-0.01em] text-black hover:text-[#E1261C] transition-colors"
              >
                {faq.q}
                <span
                  aria-hidden="true"
                  className={`w-9 h-9 border border-[#D4D4D4] rounded-full flex items-center justify-center text-xl transition-all flex-shrink-0 ${openItems.includes(index) ? 'bg-[#E1261C] border-[#E1261C] text-white rotate-45' : ''}`}
                >
                  +
                </span>
              </button>
            </h2>
            <div
              id={`faq-a-${index}`}
              role="region"
              aria-labelledby={`faq-q-${index}`}
              className={`overflow-hidden transition-all duration-300 ${openItems.includes(index) ? 'max-h-[600px] pb-7' : 'max-h-0'}`}
            >
              <div className="space-y-3">
                {faq.a.split('\n\n').map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-base leading-relaxed text-[#4A4A4A] max-w-[75ch]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}

        <p className="mt-10 text-[#4A4A4A]">
          More detail:{' '}
          <Link href="/claim-types" className="text-[#E1261C] underline underline-offset-2">
            types of property and claims
          </Link>
          ,{' '}
          <Link href="/eligibility" className="text-[#E1261C] underline underline-offset-2">
            who can claim
          </Link>{' '}
          and{' '}
          <Link href="/track-claim" className="text-[#E1261C] underline underline-offset-2">
            tracking your claim
          </Link>
          .
        </p>
      </section>
    </>
  );
}
