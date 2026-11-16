'use client';

/**
 * Home page band inviting people to search a late relative's name. Self
 * contained: removing its line in LandingPage removes the section.
 */
export default function HeirsCallout({ onSearch }) {
  return (
    <section
      aria-labelledby="home-heirs-heading"
      className="relative overflow-hidden rounded-2xl bg-[#0A0A0A] text-white px-6 py-10 sm:px-10 sm:py-12"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 hidden h-72 w-72 rounded-full border-[40px] border-[#E1261C]/25 sm:block"
      />
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-[60ch]">
          <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.15em] uppercase text-[#E1261C] mb-3">
            Heirs can claim
          </p>
          <h2
            id="home-heirs-heading"
            className="font-['Fraunces'] text-[28px] sm:text-[36px] font-semibold leading-[1.1] tracking-[-0.01em] mb-3"
          >
            Lost a parent or grandparent?
          </h2>
          <p className="text-[16px] sm:text-[18px] leading-relaxed text-[#D4D4D4]">
            Money left in their name can be claimed by their heirs. Search their name the same way you search your own.
          </p>
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="shrink-0 inline-flex w-full items-center justify-center rounded-lg bg-[#E1261C] px-7 py-4 text-[16px] font-semibold text-white transition-colors hover:bg-[#B11912] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:w-auto"
        >
          Search a relative’s name
        </button>
      </div>
    </section>
  );
}
