/**
 * When a claim needs notarising.
 *
 * A claim covering more than a handful of properties is signed in front of a
 * remote online notary (RON) rather than with a plain e-signature. The number
 * is deliberately a single constant: it is set low while the notary path is
 * being tested and is expected to move to roughly a thousand in production, so
 * raising it is a one-line change here.
 *
 * This lives in one module rather than beside each use because the browser
 * decides what to warn the claimant about and the server decides which
 * DocuSign envelope to build — if those two disagreed, a claimant could be
 * told one thing and sent the other.
 */
export const NOTARY_CLAIM_THRESHOLD = 3;

/**
 * @param {number} propertyCount Properties in this one submission.
 * @returns {boolean} True when the claim must be notarised.
 */
export function requiresNotary(propertyCount) {
  const count = Number(propertyCount);
  if (!Number.isFinite(count)) return false;
  return count > NOTARY_CLAIM_THRESHOLD;
}

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
