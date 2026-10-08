import { REVIEW_PROFILES, TESTIMONIALS } from '../../lib/content/proof';

/**
 * Named client quotes and links to independent review profiles. Renders
 * nothing until lib/content/proof.js has real entries.
 */
export default function CustomerProof() {
  if (!TESTIMONIALS.length && !REVIEW_PROFILES.length) return null;

  return (
    <section className="py-12.5 lg:py-20 bg-[#F7F5F2]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
        <h2 className="font-['Fraunces'] text-3xl md:text-5xl font-semibold tracking-[-0.01em] mb-10">
          What clients say.
        </h2>
        {TESTIMONIALS.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {TESTIMONIALS.map((t) => (
              <figure
                key={`${t.name}-${t.date || ''}`}
                className="bg-white border border-[#E8E6E3] rounded-lg p-7 flex flex-col"
              >
                <blockquote className="text-lg leading-relaxed text-[#0A0A0A] mb-5 flex-1">
                  “{t.quote}”
                </blockquote>
                <figcaption>
                  <div className="font-semibold text-[#0A0A0A]">{t.name}</div>
                  <div className="font-['JetBrains_Mono'] text-[12px] tracking-[0.05em] uppercase text-[#888888]">
                    {[t.location, t.claimType, t.amount].filter(Boolean).join(' · ')}
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
        {REVIEW_PROFILES.length > 0 && (
          <p className="text-[#4A4A4A]">
            Read independent reviews on{' '}
            {REVIEW_PROFILES.map((profile, i) => (
              <span key={profile.url}>
                {i > 0 && (i === REVIEW_PROFILES.length - 1 ? ' and ' : ', ')}
                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E1261C] underline underline-offset-2"
                >
                  {profile.name}
                </a>
              </span>
            ))}
            .
          </p>
        )}
      </div>
    </section>
  );
}
