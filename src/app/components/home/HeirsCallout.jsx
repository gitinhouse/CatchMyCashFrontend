'use client';

import { EYEBROW, HOME_CONTAINER } from './Section';

/**
 * Home page band inviting people to search a late relative's name. Self
 * contained: removing its line in LandingPage removes the section.
 */
export default function HeirsCallout({ onSearch }) {
  return (
    <section
      aria-labelledby="home-heirs-heading"
      className="relative overflow-hidden bg-[#0A0A0A] text-white"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-32 hidden h-80 w-80 rounded-full border-[44px] border-[#E1261C]/25 sm:block"
      />
      <div
        className={`${HOME_CONTAINER} relative flex flex-col gap-8 py-14 sm:py-16 lg:py-20 md:flex-row md:items-center md:justify-between`}
      >
        <div className="max-w-[60ch]">
          <p className={`${EYEBROW} mb-3`}>Heirs can claim</p>
          <h2
            id="home-heirs-heading"
            className="font-['Fraunces'] text-[30px] sm:text-[36px] lg:text-[40px] font-semibold leading-[1.1] tracking-[-0.015em] mb-4"
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
          className="relative shrink-0 inline-flex w-full items-center justify-center rounded-xl bg-[#E1261C] px-8 py-4 text-[16px] sm:text-[17px] font-semibold text-white transition-colors hover:bg-[#B11912] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto"
        >
          Search a relative’s name
        </button>
      </div>
    </section>
  );
}
