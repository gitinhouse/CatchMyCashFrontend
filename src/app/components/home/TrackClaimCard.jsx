'use client';

import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import ClaimTracker from '../ClaimTracker';
import { TEXT_LINK } from './Section';

/**
 * The Track Your Claim panel in the home page hero, for people who already
 * have a case with us. The lookup and the progress dialog it opens are the
 * shared ClaimTracker, the same one the Track Your Claim page uses. Its button
 * is ink rather than red, so the hero's red "Catch My Cash Now" stays the one
 * main action on the screen.
 */
export default function TrackClaimCard() {
  return (
    <section
      aria-labelledby="home-track-heading"
      className="relative w-full rounded-2xl border border-[#E8E6E3] bg-white p-6 sm:p-8 shadow-[0_24px_48px_-24px_rgba(10,10,10,0.18)]"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FCE9E7]">
          <FileSearch className="h-5 w-5 text-[#E1261C]" aria-hidden="true" />
        </span>
        <p className="font-['JetBrains_Mono'] text-[12px] tracking-[0.16em] uppercase text-[#4A4A4A]">
          Already a client?
        </p>
      </div>

      <h2
        id="home-track-heading"
        className="font-['Fraunces'] text-[26px] sm:text-[28px] font-semibold leading-tight tracking-[-0.01em] text-[#0A0A0A]"
      >
        Track your claim
      </h2>
      <p className="mt-2 mb-6 text-[15px] leading-relaxed text-[#4A4A4A]">
        Enter your Case ID to see every stage of your claim, from documents to approval.
      </p>

      <ClaimTracker
        title={null}
        description={null}
        inputId="home-track-case-id"
        buttonTone="ink"
      />

      <p className="mt-6 border-t border-[#E8E6E3] pt-5 text-[14px] leading-relaxed text-[#4A4A4A]">
        Your Case ID is in the confirmation email we sent when you submitted.{' '}
        <Link href="/track-claim" className={TEXT_LINK}>
          How tracking works
        </Link>
      </p>
    </section>
  );
}
