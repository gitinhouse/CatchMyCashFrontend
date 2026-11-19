// Shared layout for the home page sections.
//
// Every band uses the site header's width and side padding, so the edges of
// the content line up with the logo and the header buttons all the way down
// the page. Every section opens the same way: a small label, a heading, and an
// optional intro.

/** The content column: the same width and side padding as the site header. */
export const HOME_CONTAINER = 'mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8';

/** Vertical space above and below a section's content. */
export const SECTION_SPACE = 'py-16 sm:py-20 lg:py-24';

/** The small red label above a heading. */
export const EYEBROW =
  "font-['JetBrains_Mono'] text-[12px] sm:text-[13px] tracking-[0.16em] uppercase text-[#E1261C]";

/** A text link with the brand's red underline. */
export const TEXT_LINK =
  'font-semibold text-[#0A0A0A] underline decoration-[#E1261C] decoration-2 underline-offset-4 transition-colors hover:text-[#E1261C]';

export function SectionHeader({ id, eyebrow, title, intro, className = '' }) {
  return (
    <div className={`max-w-2xl ${className}`}>
      {eyebrow && <p className={`${EYEBROW} mb-3`}>{eyebrow}</p>}
      <h2
        id={id}
        className="font-['Fraunces'] text-[30px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.1] tracking-[-0.015em] text-[#0A0A0A] text-balance"
      >
        {title}
      </h2>
      {intro && (
        <p className="mt-4 text-[16px] sm:text-[18px] leading-relaxed text-[#4A4A4A]">{intro}</p>
      )}
    </div>
  );
}
