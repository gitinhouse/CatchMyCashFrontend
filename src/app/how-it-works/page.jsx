'use client';

import { useState } from 'react';

export default function HowItWorksPage() {
  const [openStep, setOpenStep] = useState(1);

  const steps = [
    { num: '01', title: 'Search', meta: '~ 30 SECONDS · FREE', description: 'Type your name (and any maiden name or business name you\'ve used). We query California\'s unclaimed property database directly — same data the state publishes — and pull back any matches.', note: 'You pay nothing to search. Searching is and always will be free.' },
    { num: '02', title: 'Review your results', meta: '~ 1 MINUTE', description: 'If we find anything, you\'ll see a list of properties tied to names matching yours — bank accounts, uncashed checks, dividends, refunds, safe deposit contents, and more. Each entry shows the holder, the property type, and (where California publishes it) the amount.', bullets: ['Some matches will be yours. Some won\'t. We help you tell the difference.', 'Decide which properties you want us to pursue.'] },
    { num: '03', title: 'Sign the recovery agreement', meta: '~ 2 MINUTES', description: 'Before we can act on your behalf, you sign a short agreement that authorizes us to file the claim with California and lays out our fee — a percentage of what you ultimately receive. If we don\'t recover anything, you owe nothing.', note: 'The agreement is plain-language, electronic, and you get a copy.' },
    { num: '04', title: 'Upload your documents', meta: '~ 5 MINUTES', description: 'California requires proof of identity and proof of your connection to the property (a former address, a deceased relative, a closed account). You upload these directly to us through encrypted channels.', bullets: ['Government-issued ID', 'Proof of address (current and/or historical, depending on the claim)', 'Additional documents for heir, business, or multi-owner claims'] },
    { num: '05', title: 'California processes the claim', meta: '30 – 180 DAYS · CALIFORNIA REVIEW', description: 'We assemble your claim package and submit it to the state. From there, the timing is in their hands. By California law, the state has up to 180 days to review a complete claim, but cash-only claims are often processed in 30 to 60 days.', note: 'We track your claim\'s status with the state and update you when anything changes. If they request additional documents, we tell you exactly what they need.' },
    { num: '06', title: 'You get paid', meta: 'PAYOUT', description: 'Once approved, California issues payment. Our fee is deducted at payout per your agreement, and the balance goes to you. We confirm the amount before anything is finalized.', note: 'That\'s it. The money was yours all along — now it\'s actually in your account.' },
  ];

  return (
    <>
      <section className=" py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[16ch] mb-6">
            Six steps from <em className="italic text-[#E1261C] font-normal">"is there anything?"</em> to a check in hand.
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[60ch]">
            Most people are done with their part in under ten minutes. The rest is us doing the work — and California doing their review.
          </p>
        </div>
      </section>

      <section className="max-w-[1240px] mx-auto px-6 sm:px-8 pb-20">
        {steps.map((step, idx) => (
          <div key={idx} className="border-t border-[#E8E6E3] py-12 md:py-16 first:border-t-0">
            <div className="grid md:grid-cols-[100px_1fr_1fr] gap-6 md:gap-12">
              <div className="font-['Fraunces'] text-5xl md:text-6xl font-semibold text-[#E1261C] leading-tight tracking-[-0.02em]">
                {step.num}
              </div>
              <div>
                <div className="font-['JetBrains_Mono'] text-xs tracking-[0.1em] uppercase text-[#888888] mb-4">{step.meta}</div>
                <h3 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-3">{step.title}</h3>
              </div>
              <div className="space-y-3">
                <p className="text-base leading-relaxed text-[#4A4A4A]">{step.description}</p>
                {step.bullets && (
                  <ul className="space-y-2 mt-4">
                    {step.bullets.map((bullet, i) => (
                      <li key={i} className="pl-6 relative text-[#4A4A4A] text-sm">
                        <span className="absolute left-0 text-[#E1261C] font-bold">→</span>
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
                {step.note && <p className="text-sm text-[#4A4A4A] mt-2"><strong className="text-black">{step.note.split(' ')[0]}</strong> {step.note.split(' ').slice(1).join(' ')}</p>}
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="bg-[#0A0A0A] text-white py-12.5 lg:py-20">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <h3 className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] leading-tight">
              The honest truth about timing: <em className="text-[#E1261C] not-italic">this is not instant.</em>
            </h3>
            <p className="text-[#D4D4D4] leading-relaxed">
              Most of the wait is California's legal review window — up to 180 days for complex claims, often 30 to 60 days for straightforward cash claims. We can't speed up the state, but we can make sure your package is complete the first time so it doesn't get sent back.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}