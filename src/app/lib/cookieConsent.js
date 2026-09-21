'use client';

/**
 * Cookie consent.
 *
 * The Cookies policy describes essential and analytics cookies, so the site
 * has to actually honour that split: nothing beyond the consent record itself
 * is stored until the visitor chooses, and analytics stay off unless they opt
 * in. The choice is kept in a first-party cookie so it survives across
 * sessions and is readable by the server if ever needed.
 */
export const CONSENT_COOKIE = 'cmc_cookie_consent';
export const CONSENT_VERSION = 1;
const MAX_AGE_DAYS = 180;

/** Fired on the window whenever the stored choice changes. */
export const CONSENT_EVENT = 'cookieConsentChange';

export function readConsent() {
  if (typeof document === 'undefined') return null;

  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${CONSENT_COOKIE}=`));
  if (!match) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(match.slice(CONSENT_COOKIE.length + 1)));
    // A policy change bumps the version and re-asks.
    if (parsed?.v !== CONSENT_VERSION) return null;
    return {
      essential: true,
      analytics: parsed.analytics === true,
      decidedAt: parsed.ts || null,
    };
  } catch {
    return null;
  }
}

export function writeConsent({ analytics }) {
  if (typeof document === 'undefined') return;

  const value = encodeURIComponent(
    JSON.stringify({
      v: CONSENT_VERSION,
      analytics: analytics === true,
      ts: new Date().toISOString(),
    }),
  );

  const secure = window.location?.protocol === 'https:' ? '; Secure' : '';
  document.cookie =
    `${CONSENT_COOKIE}=${value}; Max-Age=${MAX_AGE_DAYS * 24 * 60 * 60}` +
    `; Path=/; SameSite=Lax${secure}`;

  // If analytics are declined, clear anything they left behind rather than
  // leaving it to expire on its own.
  if (analytics !== true) clearAnalyticsStorage();

  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    /* ignore */
  }
}

/** Forget the decision so the banner asks again. */
export function clearConsent() {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSENT_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`;
  try {
    window.dispatchEvent(new Event(CONSENT_EVENT));
  } catch {
    /* ignore */
  }
}

export function hasAnalyticsConsent() {
  return readConsent()?.analytics === true;
}

/**
 * Remove analytics-only storage. Sign-in and claim-progress keys are
 * essential and are left alone — clearing those would sign the visitor out
 * and lose an in-progress claim.
 */
const ANALYTICS_KEYS = ['cmc_analytics_id', 'cmc_last_seen'];

export function clearAnalyticsStorage() {
  if (typeof window === 'undefined') return;
  for (const key of ANALYTICS_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* storage may be blocked */
    }
  }
}
