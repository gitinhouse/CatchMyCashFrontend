'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PROCESS_STEPS } from '../lib/content/guides';

export default function HowItWorksPage() {
  const [openStep, setOpenStep] = useState(1);

  const steps = PROCESS_STEPS;

  return (
    <>
      <section className=" py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[16ch] mb-6">
            Six steps from{' '}
            <em className="italic text-[#E1261C] font-normal">
              "is there anything?"
            </em>{' '}
            to a check in hand.
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[60ch]">
            Most people are done with their part in under ten minutes. The rest
            is us doing the work — and California doing their review.
          </p>
        </div>
      </section>

      <section className="max-w-[1240px] mx-auto px-6 sm:px-8 pb-20">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className="border-t border-[#E8E6E3] py-12 md:py-16 first:border-t-0"
          >
            <div className="grid md:grid-cols-[100px_1fr_1fr] gap-6 md:gap-12">
              <div className="font-['Fraunces'] text-5xl md:text-6xl font-semibold text-[#E1261C] leading-tight tracking-[-0.02em]">
                {step.num}
              </div>
              <div>
                <div className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#888888] mb-4">
                  {step.meta}
                </div>
                <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-3">
                  {step.title}
                </h2>
              </div>
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-[#4A4A4A]">
                  {step.description}
                  {step.highlight && (
                    <strong className="text-black font-semibold">
                      {step.highlight}
                    </strong>
                  )}
                </p>
                {step.bullets && (
                  <ul className="space-y-2 mt-4">
                    {step.bullets.map((bullet, i) => (
                      <li
                        key={i}
                        className="pl-6 relative text-[#4A4A4A] text-sm"
                      >
                        <span className="absolute left-0 text-[#E1261C] font-bold">
                          →
                        </span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {step.note && (
                  <p className="text-sm text-[#4A4A4A] mt-2"> {step.note}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[#0A0A0A] text-white py-12.5 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <h2 className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] leading-tight">
              The honest truth about timing:{' '}
              <em className="text-[#E1261C] not-italic">
                this is not instant.
              </em>
            </h2>
            <p className="text-[#D4D4D4] leading-relaxed">
              Most of the wait is California's legal review window — up to 180
              days for complex claims, often 30 to 60 days for straightforward
              cash claims. We can't speed up the state, but we can make sure
              your package is complete the first time so it doesn't get sent
              back. You can follow every stage with your Case ID on{' '}
              <Link href="/track-claim" className="text-white underline underline-offset-2 hover:text-[#E1261C]">
                Track Your Claim
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 text-[#4A4A4A]">
          Before you start:{' '}
          <Link href="/eligibility" className="text-[#E1261C] underline underline-offset-2">
            who can claim
          </Link>{' '}
          and{' '}
          <Link href="/claim-types" className="text-[#E1261C] underline underline-offset-2">
            the documents each type of claim needs
          </Link>
          .
        </div>
      </section>
    </>
  );
}
