'use client';

import { useState } from 'react';

export default function FAQPage() {
  const [openItems, setOpenItems] = useState([0]);

  const toggleItem = (index) => {
    setOpenItems(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const faqs = [
    { q: 'Do I pay anything to search?', a: 'No. Searching is completely free. You can run your name, a maiden name, or a business name as many times as you want without paying anything or even creating an account.\n\nWe only get paid when we recover money for you, and the amount is a percentage of what you receive — disclosed before you sign anything.' },
    { q: 'Why do I have to sign an agreement?', a: 'The State Controller\'s Office only releases unclaimed property to the rightful owner or to someone the rightful owner has authorized to act on their behalf. The recovery agreement is the document that gives us legal authority to file a claim for you.\n\nIt also lays out our fee in writing — what percentage we take if we recover money, and the fact that you owe nothing if we don\'t. There\'s no hidden fee, no auto-renewal, no obligation beyond the specific claim you authorize.' },
    { q: 'Why do I need to upload documents?', a: 'California requires proof of two things before they release money: that you are who you say you are, and that you have a valid connection to the property being claimed.\n\nThat usually means a government-issued ID and some kind of address or relationship documentation. Heir claims, business claims, and claims with multiple owners need a few extra documents — we tell you exactly what\'s needed for your specific claim.' },
    { q: 'What happens after I submit?', a: 'We review your documents, assemble a complete claim package, and submit it to the state. From there:\n\n(1) California acknowledges receipt — usually within a few weeks. (2) They review the package; if anything is missing or unclear, they ask for more. (3) If the documentation supports the claim, they approve it and issue payment. (4) Our fee is deducted per your agreement and the balance goes to you.\n\nWe update you at every stage. You don\'t need to chase us — we\'ll tell you when something changes.' },
    { q: 'Is this the state? Are you the government?', a: 'No. CatchMyCash is a private service. We are not affiliated with the State of California, the State Controller\'s Office, or any government agency.\n\nYou can absolutely file a claim yourself directly with the state at sco.ca.gov — and if that\'s the route you prefer, we encourage it. Searching and claiming are always free through the state. We exist for people who\'d rather pay a percentage than navigate the process themselves.' },
    { q: 'How long does it take?', a: 'Your part takes about ten minutes total. The waiting is on the state\'s side.\n\nBy California law, the state has up to 180 days from receipt of a complete claim package to review and decide. Cash-only owner claims are often processed in 30 to 60 days. Heir claims, business claims, and security-related claims usually run closer to the full 180 days.\n\nOnce approved, payment is issued by check or direct deposit depending on the type of claim.' },
  ];

  return (
    <>
      <section className="py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[14ch] mb-6">
            Questions, answered <em className="italic text-[#E1261C] font-normal">straight.</em>
          </h1>
          <p className="text-xl text-[#4A4A4A] max-w-[60ch]">
            If you don't see your question here, write to us at help@catchmycash.com — real human, same day.
          </p>
        </div>
      </section>

      <section className="max-w-[880px] mx-auto px-6 sm:px-8 pb-20">
        {faqs.map((faq, index) => (
          <div key={index} className={`border-t border-[#E8E6E3] ${index === faqs.length - 1 ? 'border-b' : ''}`}>
            <button
              onClick={() => toggleItem(index)}
              className="w-full text-left py-7 flex justify-between items-center gap-6 font-['Fraunces'] text-xl md:text-[22px] font-semibold tracking-[-0.01em] text-black hover:text-[#E1261C] transition-colors"
            >
              {faq.q}
              <span className={`w-9 h-9 border border-[#D4D4D4] rounded-full flex items-center justify-center text-xl transition-all flex-shrink-0 ${openItems.includes(index) ? 'bg-[#E1261C] border-[#E1261C] text-white rotate-45' : ''}`}>
                +
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openItems.includes(index) ? 'max-h-[600px] pb-7' : 'max-h-0'}`}>
              <div className="space-y-3">
                {faq.a.split('\n\n').map((paragraph, i) => (
                  <p key={i} className="text-base leading-relaxed text-[#4A4A4A] max-w-[75ch]">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </>
  );
}