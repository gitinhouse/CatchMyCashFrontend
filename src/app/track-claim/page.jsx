import Link from 'next/link';
import PageHero from '../components/content/PageHero';
import CtaBand from '../components/content/CtaBand';
import ClaimTracker from '../components/ClaimTracker';
import JsonLd from '../components/seo/JsonLd';
import { pageCrumbs, pageMetadata, webPageJsonLd } from '../lib/seo';
import { SUPPORT_EMAIL } from '../lib/site';
import { CASE_ID_FACTS, TRACKING_STAGES } from '../lib/content/guides';

const PATH = '/track-claim';
const TITLE = 'Track your unclaimed property claim';
const DESCRIPTION =
  'Enter your CatchMyCash Case ID to see where your claim stands, from documents and agreements to submission to the State of California and approval.';

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
});

export default function TrackClaimPage() {
  return (
    <>
      <JsonLd
        data={webPageJsonLd({ title: TITLE, description: DESCRIPTION, path: PATH })}
      />
      <PageHero
        crumbs={pageCrumbs('Track your claim', PATH)}
        eyebrow="Track your claim"
        title={
          <>
            Where’s my money?{' '}
            <em className="italic text-[#E1261C] font-normal">
              Check in seconds.
            </em>
          </>
        }
        intro="Your Case ID shows every stage of your claim — what’s done, what’s next, and whether the state needs anything else from you."
      >
        <div className="mt-10 max-w-3xl bg-[#F7F5F2] border border-[#E8E6E3] rounded-xl p-6 shadow-sm">
          <ClaimTracker
            title="Look up your claim"
            description="Enter the Case ID from your confirmation email, for example CM-2026-123456."
            readCaseFromUrl
          />
        </div>
      </PageHero>

      <section className="py-14 md:py-20 bg-white">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 grid md:grid-cols-[1fr_1.4fr] gap-12 md:gap-20">
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              Your Case ID
            </h2>
            <ul className="space-y-4">
              {CASE_ID_FACTS.map((fact) => (
                <li key={fact} className="flex gap-3 text-[#0A0A0A]">
                  <span className="text-[#E1261C]" aria-hidden="true">→</span>
                  {fact}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-3xl md:text-[40px] font-semibold tracking-[-0.01em] leading-tight mb-6">
              What each stage means
            </h2>
            <ol className="border-l-2 border-[#E8E6E3] ml-3 space-y-6">
              {TRACKING_STAGES.map((stage, i) => (
                <li key={stage.name} className="relative pl-8">
                  <span
                    className="absolute -left-[13px] top-0 w-6 h-6 rounded-full bg-white border-2 border-[#E1261C] text-[#E1261C] font-['JetBrains_Mono'] text-[11px] flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <h3 className="font-['Fraunces'] text-xl font-semibold text-[#0A0A0A] mb-1">
                    {stage.name}
                  </h3>
                  <p className="text-[#4A4A4A]">{stage.detail}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 bg-[#F7F5F2]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-8 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-3">
              Have an account?
            </h2>
            <p className="text-[#4A4A4A]">
              <Link href="/userLogin" className="text-[#E1261C] underline underline-offset-2">
                Log in
              </Link>{' '}
              to see every claim on your account, your documents and any
              messages from us in one place.
            </p>
          </div>
          <div>
            <h2 className="font-['Fraunces'] text-2xl md:text-3xl font-semibold tracking-[-0.01em] mb-3">
              How long it takes
            </h2>
            <p className="text-[#4A4A4A]">
              California has up to 180 days to decide a complete claim; cash-only
              owner claims are often paid in 30 to 60 days. Questions about your
              claim? Email{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-[#E1261C] underline underline-offset-2">
                {SUPPORT_EMAIL}
              </a>{' '}
              with your Case ID, or use our{' '}
              <Link href="/contact" className="text-[#E1261C] underline underline-offset-2">
                contact form
              </Link>
              .
            </p>
          </div>
        </div>
      </section>

      <CtaBand
        title="Haven’t started a claim yet?"
        secondary={{ href: '/faq', label: 'Read the FAQ' }}
      />
    </>
  );
}
