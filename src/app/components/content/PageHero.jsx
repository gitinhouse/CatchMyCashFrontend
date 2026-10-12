import Breadcrumbs from '../seo/Breadcrumbs';

/**
 * The opening of a content page: breadcrumb trail, eyebrow, the page's one
 * <h1>, and an intro paragraph. Styled like the About and FAQ pages.
 */
export default function PageHero({ crumbs, eyebrow, title, intro, children }) {
  return (
    <section className="py-12.5 lg:py-20 bg-white border-b border-[#E8E6E3]">
      <div className="max-w-[1240px] mx-auto px-6 sm:px-8">
        <Breadcrumbs crumbs={crumbs} className="mb-8" />
        {eyebrow && (
          <p className="font-['JetBrains_Mono'] text-[13px] tracking-[0.15em] uppercase text-[#E1261C] mb-5">
            {eyebrow}
          </p>
        )}
        <h1 className="font-['Fraunces'] text-[clamp(36px,5.5vw,68px)] font-semibold tracking-[-0.02em] leading-[1.04] max-w-[18ch] mb-6 text-[#0A0A0A]">
          {title}
        </h1>
        {intro && (
          <p className="text-lg md:text-xl leading-snug text-[#4A4A4A] max-w-[62ch]">
            {intro}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
