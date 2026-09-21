'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import {
  CONSENT_EVENT,
  readConsent,
  writeConsent,
} from '../lib/cookieConsent';

/**
 * Consent banner shown until the visitor makes a choice.
 *
 * Also listens for the consent event so the "Manage cookie preferences"
 * control on the Cookies page can reopen it.
 */
export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [analytics, setAnalytics] = useState(false);

  const sync = useCallback(() => {
    const consent = readConsent();
    setOpen(!consent);
    setAnalytics(consent?.analytics === true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, [sync]);

  if (!open) return null;

  const decide = (allowAnalytics) => {
    writeConsent({ analytics: allowAnalytics });
    setOpen(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie preferences"
      className="fixed inset-x-0 bottom-0 z-[70] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-4xl rounded-2xl border border-[#E8E6E3] bg-white shadow-2xl">
        <div className="p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FCE9E7] flex items-center justify-center shrink-0">
              <Cookie className="w-4 h-4 text-[#E1261C]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#0A0A0A]">
                We use cookies
              </p>
              <p className="text-xs text-[#4A4A4A] mt-1 leading-relaxed">
                Essential cookies keep you signed in and remember your claim
                progress, so they are always on. Analytics cookies are optional
                and help us see which pages are useful. Read our{' '}
                <Link
                  href="/cookies"
                  className="text-[#E1261C] font-semibold hover:underline"
                >
                  Cookies Policy
                </Link>
                .
              </p>

              {showDetail && (
                <div className="mt-3 space-y-2">
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#E8E6E3] bg-[#F7F5F2] p-3">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      aria-label="Essential cookies, always on"
                      className="mt-0.5 h-4 w-4 accent-[#E1261C] cursor-not-allowed"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#0A0A0A]">
                        Essential — always on
                      </p>
                      <p className="text-[11px] text-[#888888]">
                        Sign-in session, your cookie choice, and the claim you
                        are part-way through.
                      </p>
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 rounded-lg border border-[#E8E6E3] p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={analytics}
                      onChange={(e) => setAnalytics(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#E1261C]"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[#0A0A0A]">
                        Analytics — optional
                      </p>
                      <p className="text-[11px] text-[#888888]">
                        Anonymous usage statistics. Off unless you turn it on.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>

            <button
              onClick={() => decide(false)}
              aria-label="Reject optional cookies and close"
              className="text-[#B4B0AA] hover:text-[#E1261C] shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
            <button
              onClick={() => setShowDetail((v) => !v)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E6E3] text-[#4A4A4A] hover:bg-[#F7F5F2] transition-colors"
            >
              {showDetail ? 'Hide options' : 'Manage options'}
            </button>
            <button
              onClick={() => decide(false)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-[#E8E6E3] text-[#4A4A4A] hover:bg-[#F7F5F2] transition-colors"
            >
              Reject optional
            </button>
            <button
              onClick={() => decide(showDetail ? analytics : true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#E1261C] text-white hover:bg-[#B11912] transition-colors"
            >
              {showDetail ? 'Save choices' : 'Accept all'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
