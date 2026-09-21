/**
 * Claim numbers for a case, as the state assigned them.
 *
 * Each property on a case is filed as its own claim and gets its own number,
 * so a case covering several properties has several. The case-level
 * `claim_id` is only meaningful when the case covers a single property —
 * borrowing it for every property is what made separate claims look like they
 * shared one number.
 *
 * @param {object} caseItem A case as /api/case returns it.
 * @returns {string[]} Distinct claim numbers, in property order.
 */
export function caseClaimIds(caseItem) {
  const properties = caseItem?.user_properties || [];

  const fromProperties = properties
    .map((p) => (typeof p?.claim_id === 'string' ? p.claim_id.trim() : ''))
    .filter(Boolean);

  if (fromProperties.length > 0) {
    return [...new Set(fromProperties)];
  }

  // No per-property numbers stored. The case's own number describes the whole
  // case, so it is safe to show only when there is nothing to confuse it with.
  const caseLevel =
    typeof caseItem?.claim_id === 'string' ? caseItem.claim_id.trim() : '';
  if (caseLevel && properties.length <= 1) return [caseLevel];

  return [];
}

/**
 * One claim number for a property, or null when the state has not issued one.
 *
 * @param {object} property   A row from `user_properties`.
 * @param {object} caseItem   The case it belongs to.
 * @returns {string|null}
 */
export function propertyClaimId(property, caseItem) {
  const own =
    typeof property?.claim_id === 'string' ? property.claim_id.trim() : '';
  if (own) return own;

  const properties = caseItem?.user_properties || [];
  const caseLevel =
    typeof caseItem?.claim_id === 'string' ? caseItem.claim_id.trim() : '';

  return properties.length <= 1 && caseLevel ? caseLevel : null;
}

/**
 * How the claim numbers of a case should read in a summary line.
 *
 * @param {object} caseItem
 * @returns {string|null} e.g. "CA-123" or "CA-123, CA-124", null when none.
 */
export function claimIdSummary(caseItem) {
  const ids = caseClaimIds(caseItem);
  return ids.length > 0 ? ids.join(', ') : null;
}
