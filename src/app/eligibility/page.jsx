import Link from 'next/link';
import PageHero from '../components/content/PageHero';
import CtaBand from '../components/content/CtaBand';
import JsonLd from '../components/seo/JsonLd';
import { pageCrumbs, pageMetadata, webPageJsonLd } from '../lib/seo';
import { STATE_PROGRAM } from '../lib/site';
import { CLAIM_TYPES, ELIGIBILITY } from '../lib/content/guides';

const PATH = '/eligibility';
const TITLE = 'Who can claim unclaimed property in California';
const DESCRIPTION =
  'Owners, heirs, businesses and joint owners can claim property California holds. What the state asks you to prove, and when you can claim without us.';

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

const Check = () => (
  <span
    className="w-6 h-6 bg-[#E1261C] text-white rounded flex items-center justify-center text-sm font-bold shrink-0 mt-0.5"
    aria-hidden="true"
  >
    ✓
  </span>
);

export default function EligibilityPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: PATH })}
      />
      <PageHero
        crumbs={pageCrumbs('Eligibility', PATH)}
        eyebrow="Eligibility"
        title={
          <>
            Who can claim,{' '}
            <em className="italic text-[#E1261C] font-normal">
              and what you’ll need.
            </em>
          </>
        }
        intro="If California is holding money that was yours — or that belonged to someone whose estate you are entitled to — you can claim it. There is no deadline, and the state never charges to return it."
      />

      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              You can claim if you are
            </h2>
            <ul className="space-y-4">
              {ELIGIBILITY.canClaim.map((item) => (
                <li key={item} className="flex gap-3 text-lg text-[#0A0A0A]">
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              What the state asks you to prove
            </h2>
            <ol className="space-y-4 mb-6">
              {ELIGIBILITY.proof.map((item, i) => (
                <li key={item} className="flex gap-3 text-lg text-[#0A0A0A]">
                  <span className="font-['JetBrains_Mono'] text-[#E1261C] font-medium mt-0.5">
                    0{i + 1}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="text-[#4A4A4A]">
              Every claim needs both. What counts as proof depends on who is
              claiming — the{' '}
              <Link href="/claim-types" className="text-[#E1261C] underline underline-offset-2">
                claim types page
              </Link>{' '}
              lists the usual documents for each.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-[#F7F5F2]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-8">
            Which claim fits you
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] bg-white border border-[#E8E6E3] rounded-lg text-left">
              <thead>
                <tr className="font-['JetBrains_Mono'] text-[12px] tracking-[0.1em] uppercase text-[#888888]">
                  <th scope="col" className="p-4 border-b border-[#E8E6E3] font-medium">Claim</th>
                  <th scope="col" className="p-4 border-b border-[#E8E6E3] font-medium">When it applies</th>
                  <th scope="col" className="p-4 border-b border-[#E8E6E3] font-medium">Typical timing</th>
                </tr>
              </thead>
              <tbody>
                {CLAIM_TYPES.map((claim) => (
                  <tr key={claim.name} className="align-top">
                    <th scope="row" className="p-4 border-b border-[#E8E6E3] font-['Fraunces'] text-lg font-semibold text-[#0A0A0A]">
                      {claim.name}
                    </th>
                    <td className="p-4 border-b border-[#E8E6E3] text-[#4A4A4A]">{claim.who}</td>
                    <td className="p-4 border-b border-[#E8E6E3] text-[#4A4A4A]">{claim.timing}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-12 md:gap-20">
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              What we can’t claim
            </h2>
            <ul className="space-y-3">
              {ELIGIBILITY.limits.map((item) => (
                <li key={item} className="flex gap-3 text-lg text-[#0A0A0A]">
                  <span className="text-[#E1261C]" aria-hidden="true">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              You never need us to claim
            </h2>
            <p className="text-lg text-[#4A4A4A] mb-4">{ELIGIBILITY.freeAlternative}</p>
            <a
              href={STATE_PROGRAM.searchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E1261C] font-semibold underline underline-offset-2"
            >
              Search the State Controller’s records directly
            </a>
          </div>
        </div>
      </section>

      <CtaBand
        title="Rather we handled it?"
        body="Search free, and if we find something we file the claim and follow it to payout — 10% only if you get paid."
        secondary={{ href: '/how-it-works', label: 'How it works' }}
      />
    </>
  );
}
