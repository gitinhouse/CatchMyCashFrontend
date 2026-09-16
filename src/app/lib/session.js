'use client';

/**
 * Tear down the client-side session.
 *
 * Clears everything the app has put in localStorage — not just the auth token —
 * so no claim, property or document state survives a sign-out on a shared
 * machine. Storage access can throw in private-browsing modes, so each step is
 * guarded independently.
 *
 * Callers are responsible for resetting in-memory stores and redirecting.
 */
export function clearClientSession() {
  if (typeof window === 'undefined') return;

  try {
    localStorage.clear();
  } catch (error) {
    // Private mode or blocked storage — fall back to removing the auth key.
    try {
      localStorage.removeItem('userLogin');
    } catch {
      /* nothing more we can do */
    }
  }

  try {
    sessionStorage.clear();
  } catch {
    /* sessionStorage may be unavailable for the same reasons */
  }

  // Keeps SiteHeader and any other auth-aware component in sync.
  try {
    window.dispatchEvent(new Event('authChange'));
  } catch {
    /* ignore */
  }
}
