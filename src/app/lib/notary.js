/**
 * When a claim needs notarising.
 *
 * A claim worth NOTARY_AMOUNT_THRESHOLD dollars or more, in total across every
 * property in the one submission, is signed in front of a remote online notary
 * (RON) rather than with a plain e-signature.
 *
 * This lives in one module rather than beside each use because the browser
 * decides what to warn the claimant about and the server decides which
 * DocuSign envelope to build — if those two disagreed, a claimant could be
 * told one thing and sent the other.
 */
export const NOTARY_AMOUNT_THRESHOLD = 1000;

/**
 * Sum of property amounts, tolerating the strings and blanks that search
 * results and stored rows carry.
 *
 * @param {Array<{amount?: number|string}>} properties
 * @returns {number} Total in dollars.
 */
export function totalClaimAmount(properties = []) {
  return properties.reduce(
    (sum, p) => sum + (parseFloat(p?.amount ?? 0) || 0),
    0,
  );
}

/**
 * @param {number} claimAmount Total dollars in this one submission.
 * @returns {boolean} True when the claim must be notarised.
 */
export function requiresNotary(claimAmount) {
  const amount = Number(claimAmount);
  if (!Number.isFinite(amount)) return false;
  // Compared in whole cents so float noise in summed amounts cannot decide it.
  return Math.round(amount * 100) >= NOTARY_AMOUNT_THRESHOLD * 100;
}

/** The threshold as claimants see it, e.g. "$1,000". */
export const NOTARY_THRESHOLD_LABEL = `$${NOTARY_AMOUNT_THRESHOLD.toLocaleString('en-US')}`;

/**
 * The agreement PDF runs to an extra page when it carries a notarial
 * certificate, so the signing fields sit in a different place. The page count
 * of the document that actually arrived is what decides the layout — not the
 * notary flag — because the two can disagree while a claim is being re-filed.
 *
 * @param {number} pageCount Pages in the agreement PDF.
 * @returns {'compact'|'standard'} Layout profile name.
 */
export function agreementLayoutProfile(pageCount) {
  return Number(pageCount) <= 2 ? 'compact' : 'standard';
}
