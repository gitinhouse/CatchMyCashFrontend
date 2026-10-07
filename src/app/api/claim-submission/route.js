import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Step 3 renders whatever this route answers as the reason the claim was
// refused, so text describing how the hop between our servers broke has no
// business crossing the boundary: it tells the claimant nothing they can act
// on and can name an internal host or port.
const TRANSPORT_FAULT =
  /fetch failed|socket hang ?up|getaddrinfo|network error|request to \S+ failed|EXTENSION_URL is not configured|\b(?:ECONN\w*|ETIMEDOUT|ENOTFOUND|EHOSTUNREACH|ENETUNREACH|EAI_AGAIN|EPIPE|UND_ERR_\w+|CERT_\w+)\b/i;

const SERVICE_UNREACHABLE =
  'We could not reach our claim submission service. Please try again in a few minutes.';

const isTransportFault = (text) => TRANSPORT_FAULT.test(String(text ?? ''));

// The flat fields the claimant's dialog reads as a reason. A nested validation
// payload is the claimant's own data by construction, so only these are
// screened.
const SCREENED_KEYS = ['message', 'error', 'upstream'];

// What is left to say once `message` is empty, in the order the client reads.
const OTHER_REASON_KEYS = [
  'error',
  'errors',
  'reason',
  'detail',
  'details',
  'description',
  'upstream',
];

/**
 * Keep what upstream said about the claim, drop what it said about the network.
 *
 * @param {*} data  the answer upstream gave, in whatever shape it gave it
 * @returns {object} a body the failure dialog can show as it stands
 */
function claimantFacingBody(data) {
  // An answer that is not a plain object — a bare string, a list of validation
  // errors — goes under a key the client knows instead of being spread into
  // numbered characters.
  const body =
    data !== null && typeof data === 'object' && !Array.isArray(data)
      ? { ...data }
      : { upstream: data };

  const withheld = {};
  for (const key of SCREENED_KEYS) {
    if (typeof body[key] === 'string' && isTransportFault(body[key])) {
      withheld[key] = body[key];
      delete body[key];
    }
  }

  if (Object.keys(withheld).length) {
    console.error('[claim-submission] withheld from claimant:', withheld);
  }

  if (!String(body.message ?? '').trim()) {
    const hasOtherReason = OTHER_REASON_KEYS.some((key) => {
      const value = body[key];
      return typeof value === 'string'
        ? value.trim().length > 0
        : !!value && typeof value === 'object' && Object.keys(value).length > 0;
    });

    // The placeholder is only there to fill a gap — the client skips it and
    // looks past it for a real reason — so the reachability sentence is used
    // only where nothing readable survived the screening and it would
    // otherwise be the claim's last word.
    body.message =
      Object.keys(withheld).length && !hasOtherReason
        ? SERVICE_UNREACHABLE
        : 'Claim submission failed';
  }

  return body;
}

export async function POST(req) {
  try {
    const extensionUrl = process.env.EXTENSION_URL;

    if (!extensionUrl) {
      // A missing deployment variable is ours to fix and names our own
      // plumbing, so the claimant is told the part that concerns them.
      console.error('[claim-submission] EXTENSION_URL is not configured');
      return NextResponse.json(
        { message: SERVICE_UNREACHABLE },
        { status: 500 },
      );
    }

    const body = await req.json();

    const response = await fetch(`${extensionUrl}/api/claim-submission`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log('--payload--', body);
    const data = await response.json().catch(() => ({}));
    console.log('--data--', data);
    if (!response.ok) {
      console.error('Error from 3rd party API:', {
        payload: body,
        error: data,
      });

      return NextResponse.json(claimantFacingBody(data), {
        status: response.status,
      });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('POST /api/claim-submission error:', error);
    // Nothing thrown here is upstream's word about the claim — it describes
    // our own plumbing — so only the classification crosses the boundary, and
    // anything we cannot classify falls to the client's placeholder, which at
    // least gives the claimant a status to quote at support.
    return NextResponse.json(
      isTransportFault(error.message)
        ? { message: SERVICE_UNREACHABLE }
        : { message: 'Server error' },
      { status: 500 },
    );
  }
}
