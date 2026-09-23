'use client';

/**
 * The email a signed-out visitor proved they own, for the rest of this visit.
 *
 * Kept in localStorage so it survives the step-by-step claim flow (and a
 * refresh part-way through), and cleared on sign-out along with everything
 * else. The token beside it is what the server actually checks — the address
 * on its own is a convenience for prefilling the form.
 */
const KEY = 'cmc_verified_email';

export function readVerifiedEmail() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw === 'undefined') return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.email || !parsed?.token) return null;

    // The server enforces the real lifetime; this only avoids offering an
    // address whose proof has certainly expired.
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      clearVerifiedEmail();
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function writeVerifiedEmail({ email, token, ttlMinutes = 120 }) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        email: String(email).trim().toLowerCase(),
        token,
        verifiedAt: new Date().toISOString(),
        expiresAt: Date.now() + ttlMinutes * 60 * 1000,
      }),
    );
  } catch {
    /* storage may be blocked; the flow still works for this page */
  }
}

export function clearVerifiedEmail() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** True when this browser is signed in to an account. */
export function hasActiveSession() {
  if (typeof window === 'undefined') return false;

  try {
    const raw = localStorage.getItem('userLogin');
    if (!raw || raw === 'undefined') return false;
    const session = JSON.parse(raw);
    return !!(session?.token && session?.user?.email);
  } catch {
    return false;
  }
}

/** The signed-in account's address, or null. */
export function sessionEmail() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem('userLogin');
    if (!raw || raw === 'undefined') return null;
    const session = JSON.parse(raw);
    if (!session?.token) return null;
    return session?.user?.email || null;
  } catch {
    return null;
  }
}
