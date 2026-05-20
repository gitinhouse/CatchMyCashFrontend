export default function AboutPage() {
  return (
    <>
      <section className="about-hero py-12.5 lg:py-25 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#E1261C] mb-6">
            About CatchMyCash
          </div>
          <h1 className="font-['Fraunces'] text-[clamp(40px,6vw,78px)] font-semibold tracking-[-0.02em] leading-[1.02] max-w-[14ch] mb-8">
            Reuniting Californians
            <br />
            with money {"that's"}{' '}
            <em className="italic text-[#E1261C] font-normal">
              already theirs.
            </em>
          </h1>
          <p className="text-xl leading-snug text-[#4A4A4A] max-w-[60ch]">
            The State of California is holding $15.5 billion in unclaimed
            property — old paychecks, forgotten bank balances, refunds,
            dividends. We help Californians find {"what's"} theirs and walk them
            through getting it back, without the paperwork headache.
          </p>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-4 border-y border-[#E8E6E3] bg-white">
        <div className="p-8 md:p-10 border-r border-[#E8E6E3]">
          <div className="font-['Fraunces'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight mb-2">
            $15.5<span className="text-[#E1261C]">B</span>
          </div>
          <div className="font-['JetBrains_Mono'] text-xs tracking-[0.05em] text-[#4A4A4A]">
            held by California
          </div>
        </div>
        <div className="p-8 md:p-10 border-r border-[#E8E6E3]">
          <div className="font-['Fraunces'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight mb-2">
            76<span className="text-[#E1261C]">M</span>
          </div>
          <div className="font-['JetBrains_Mono'] text-xs tracking-[0.05em] text-[#4A4A4A]">
            unclaimed properties
          </div>
        </div>
        <div className="p-8 md:p-10 border-r border-[#E8E6E3]">
          <div className="font-['Fraunces'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight mb-2">
            1 in 7
          </div>
          <div className="font-['JetBrains_Mono'] text-xs tracking-[0.05em] text-[#4A4A4A]">
            Americans have unclaimed funds
          </div>
        </div>
        <div className="p-8 md:p-10">
          <div className="font-['Fraunces'] text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-tight mb-2">
            100<span className="text-[#E1261C]">%</span>
          </div>
          <div className="font-['JetBrains_Mono'] text-xs tracking-[0.05em] text-[#4A4A4A]">
            contingency — no recovery, no fee
          </div>
        </div>
      </div>

      <section className="py-12.5 lg:py-25 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <div>
              <div className="font-['JetBrains_Mono'] text-xs tracking-[0.15em] uppercase text-[#E1261C] mb-4">
                Why we exist
              </div>
              <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-semibold tracking-[-0.01em] leading-tight">
                The money is sitting there. Most people never know.
              </h2>
            </div>
            <div className="space-y-4">
              <p className="text-lg leading-relaxed text-[#4A4A4A]">
                The state of California holds this property for as long as it
                takes to find the rightful owner.{' '}
                <strong className="text-black">
                  The search is free. The claim is free.
                </strong>{' '}
                But the process — knowing what to search, gathering the right
                documents, navigating the agreement, waiting through review — is
                where most people give up.
              </p>
              <p className="text-lg leading-relaxed text-[#4A4A4A]">
                CatchMyCash exists for the people who {"don't"} have time to
                figure that out. We do the search, prepare the claim package,
                and shepherd it through {"California's"} review process until
                the check is in your hand. You only pay if we recover money for
                you.
              </p>
              <p className="text-lg leading-relaxed text-[#4A4A4A]">
                {"We're"} not the state. {"We're"} not a government agency.
                {"We're"} a service that knows how the system works and gets
                paid only when it works for you.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F5F2] py-12.5 lg:py-25">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h3 className="font-['Fraunces'] text-3xl md:text-4xl font-semibold tracking-[-0.01em] mb-12 max-w-[20ch]">
            Why people trust us with their information.
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-8 border border-[#E8E6E3] rounded-lg">
              <div className="w-10 h-10 bg-[#E1261C] text-white rounded flex items-center justify-center mb-5 font-bold">
                ✓
              </div>
              <h4 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-2">
                Contingency only
              </h4>
              <p className="text-[#4A4A4A] leading-relaxed">
                You pay nothing upfront. If we {"don't"} recover money for you,
                you owe nothing. Our fee is a percentage of what you receive —
                disclosed before you sign.
              </p>
            </div>
            <div className="bg-white p-8 border border-[#E8E6E3] rounded-lg">
              <div className="w-10 h-10 bg-[#E1261C] text-white rounded flex items-center justify-center mb-5 font-bold">
                ✓
              </div>
              <h4 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-2">
                Bank-grade security
              </h4>
              <p className="text-[#4A4A4A] leading-relaxed">
                All documents are transmitted over TLS, stored encrypted, and
                accessible only to the staff handling your claim. We never sell
                or share your data with third parties.
              </p>
            </div>
            <div className="bg-white p-8 border border-[#E8E6E3] rounded-lg">
              <div className="w-10 h-10 bg-[#E1261C] text-white rounded flex items-center justify-center mb-5 font-bold">
                ✓
              </div>
              <h4 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-2">
                California-compliant process
              </h4>
              <p className="text-[#4A4A4A] leading-relaxed">
                Every claim we file follows the California State{' '}
                {"Controller's"}
                Office requirements. {"We're"} transparent about what we are: a
                private service that helps you claim {"what's"} already yours.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-hero py-12.5 lg:py-25 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-semibold tracking-[-0.01em] mb-12">
            Who runs CatchMyCash.
          </h2>
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="border border-[#E8E6E3] p-8 rounded-lg flex gap-6">
              <div className="w-20 h-20 bg-[#F0EEEB] rounded-full flex items-center justify-center font-['Fraunces'] text-2xl font-bold text-[#E1261C] flex-shrink-0">
                BC
              </div>
              <div>
                <h4 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-1">
                  Brett Carlson
                </h4>
                <div className="font-['JetBrains_Mono'] text-xs text-[#E1261C] uppercase tracking-[0.05em] mb-3">
                  Co-Founder
                </div>
                <p className="text-sm leading-relaxed text-[#4A4A4A]">
                  Serial entrepreneur with two decades of operating experience.
                  Currently CEO of ServiceUp, previously at Swim.it and
                  Cloudera. At CatchMyCash, Brett shapes strategy and growth,
                  advises on the operating playbook for building a
                  consumer-trust business, and opens doors with partners and
                  capital.
                </p>
              </div>
            </div>
            <div className="border border-[#E8E6E3] p-8 rounded-lg flex gap-6">
              <div className="w-20 h-20 bg-[#F0EEEB] rounded-full flex items-center justify-center font-['Fraunces'] text-2xl font-bold text-[#E1261C] flex-shrink-0">
                EC
              </div>
              <div>
                <h4 className="font-['Fraunces'] text-xl md:text-2xl font-semibold mb-1">
                  Evan Carter
                </h4>
                <div className="font-['JetBrains_Mono'] text-xs text-[#E1261C] uppercase tracking-[0.05em] mb-3">
                  Co-Founder
                </div>
                <p className="text-sm leading-relaxed text-[#4A4A4A]">
                  Runs CatchMyCash day-to-day. Started the company after
                  watching family members struggle to claim what was already
                  theirs. Evan leads product and operations — building the
                  search and claim flow, working with the engineering team, and
                  overseeing the claims process so every claim package goes in
                  complete.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
