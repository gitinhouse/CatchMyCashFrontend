import Link from 'next/link';
import PageHero from '../components/content/PageHero';
import CtaBand from '../components/content/CtaBand';
import JsonLd from '../components/seo/JsonLd';
import { pageCrumbs, pageMetadata, webPageJsonLd } from '../lib/seo';
import { STATE_PROGRAM } from '../lib/site';
import {
  CLAIM_TYPES,
  FEE_FACTS,
  PROPERTY_BASICS,
  PROPERTY_TYPES,
} from '../lib/content/guides';

const PATH = '/claim-types';
const TITLE = 'Types of unclaimed property and claims in California';
const DESCRIPTION =
  'Bank accounts, uncashed checks, stocks, insurance, refunds and safe deposit contents: what California holds, the four kinds of claim, and the documents each one needs.';

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

export default function ClaimTypesPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: PATH })}
      />
      <PageHero
        crumbs={pageCrumbs('Claim types', PATH)}
        eyebrow="Claim types"
        title={
          <>
            What California may be holding,{' '}
            <em className="italic text-[#E1261C] font-normal">
              and how it’s claimed.
            </em>
          </>
        }
        intro={PROPERTY_BASICS[0]}
      />

      <section className="py-14 md:py-20 bg-[#F7F5F2]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-4">
            Types of unclaimed property
          </h2>
          <p className="text-[#4A4A4A] text-lg max-w-[65ch] mb-10">
            {PROPERTY_BASICS[1]}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROPERTY_TYPES.map((type) => (
              <div
                key={type.name}
                className="bg-white border border-[#E8E6E3] rounded-lg p-6"
              >
                <h3 className="font-['Fraunces'] text-xl font-semibold mb-2 text-[#0A0A0A]">
                  {type.name}
                </h3>
                <p className="text-[#4A4A4A] leading-relaxed">{type.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
          <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-4">
            Types of claim
          </h2>
          <p className="text-[#4A4A4A] text-lg max-w-[65ch] mb-10">
            Who is claiming decides what the state asks for. The lists below are
            what each claim usually needs; the exact set depends on the property
            and the amount, and we tell you precisely what yours needs before you
            upload anything.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {CLAIM_TYPES.map((claim) => (
              <article
                key={claim.name}
                className="border border-[#E8E6E3] rounded-lg p-7"
              >
                <h3 className="font-['Fraunces'] text-2xl font-semibold mb-2 text-[#0A0A0A]">
                  {claim.name}
                </h3>
                <p className="text-[#4A4A4A] mb-4">{claim.who}</p>
                <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.1em] uppercase text-[#888888] mb-2">
                  Documents usually needed
                </p>
                <ul className="space-y-1.5 mb-4">
                  {claim.documents.map((doc) => (
                    <li key={doc} className="flex gap-2 text-[#0A0A0A]">
                      <span className="text-[#E1261C]" aria-hidden="true">
                        →
                      </span>
                      {doc}
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-[#4A4A4A]">
                  <strong className="text-[#0A0A0A]">Timing:</strong>{' '}
                  {claim.timing}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-8 text-[#4A4A4A]">
            Not sure which applies to you? See{' '}
            <Link href="/eligibility" className="text-[#E1261C] underline underline-offset-2">
              who can claim
            </Link>
            , or read{' '}
            <Link href="/how-it-works" className="text-[#E1261C] underline underline-offset-2">
              how a claim runs from search to payout
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-[#F7F5F2]">
        <div className="max-w-[880px] mx-auto px-6 sm:px-8">
          <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
            What it costs
          </h2>
          <ul className="space-y-3 mb-6">
            {FEE_FACTS.map((fact) => (
              <li key={fact} className="flex gap-3 text-lg text-[#0A0A0A]">
                <span className="mt-2.5 w-2 h-2 rounded-full bg-[#E1261C] shrink-0" aria-hidden="true" />
                {fact}
              </li>
            ))}
          </ul>
          <p className="text-[#4A4A4A]">
            The State Controller’s Office explains the rules for recovery
            services in its{' '}
            <a
              href={STATE_PROGRAM.investigatorRulesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#E1261C] underline underline-offset-2"
            >
              guidance on investigators
            </a>
            .
          </p>
        </div>
      </section>

      <CtaBand secondary={{ href: '/eligibility', label: 'Check who can claim' }} />
    </>
  );
}
