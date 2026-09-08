'use client';

/** Read the JWT the login flow stored in localStorage. */
export function getAdminSession() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('userLogin');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function isAdminSession(session) {
  return session?.user?.type === 'Admin';
}

export class AdminApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
  }
}

/**
 * Fetch an /api/admin endpoint with the stored bearer token.
 * Throws AdminApiError so callers can distinguish auth failures from data ones.
 */
export async function adminFetch(path, options = {}) {
  const session = getAdminSession();
  if (!session?.token) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  const res = await fetch(path, {
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {}),
      Authorization: `Bearer ${session.token}`,
    },
    cache: 'no-store',
  });

  if (res.status === 204) return null;

  const contentType = res.headers.get('content-type') || '';
  const payload = contentType.includes('application/json')
    ? await res.json().catch(() => ({}))
    : await res.text();

  if (!res.ok) {
    const message =
      (typeof payload === 'object' && (payload.error || payload.message)) ||
      `Request failed (${res.status})`;
    throw new AdminApiError(message, res.status);
  }

  return payload;
}

/** Build a query string, skipping empty values and expanding arrays. */
export function buildQuery(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      if (value.length) search.set(key, value.join(','));
    } else {
      search.set(key, String(value));
    }
  }
  const str = search.toString();
  return str ? `?${str}` : '';
}

/** Download a file from an authenticated admin endpoint. */
export async function adminDownload(path, filename) {
  const session = getAdminSession();
  if (!session?.token) {
    throw new AdminApiError('Your session has expired. Please sign in again.', 401);
  }

  const res = await fetch(path, {
    headers: { Authorization: `Bearer ${session.token}` },
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new AdminApiError(`Export failed (${res.status})`, res.status);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
