// Turning a row from the State's unclaimed property file into what the results
// page shows. The file uses words like UNKNOWN (and the odd "UNK NOWN") or a
// zip of 00000 when it has nothing on record; those are treated as blank so
// the page can say "Not on file" instead of printing them.

const PLACEHOLDERS = new Set([
  'UNKNOWN',
  'UNK NOWN',
  'UNKNOWN UNKNOWN',
  'N/A',
  'NA',
  'NONE',
  'NULL',
  'UNDEFINED',
  '00000',
  '0',
]);

/** A field's text, or '' when it is empty or one of the "nothing on file" words. */
export function clean(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/\s+/g, ' ').trim();
  return PLACEHOLDERS.has(text.toUpperCase()) ? '' : text;
}

/**
 * "street, city, ST zip", leaving out whatever is not on file. With neither a
 * street nor a city there is nothing to recognise ("CA" on its own), so it
 * returns '' and the page says "Not on file".
 */
export function formatAddress({ street = [], city, state, zip } = {}) {
  const streetText = street.map(clean).filter(Boolean).join(', ');
  const cityText = clean(city);
  if (!streetText && !cityText) return '';
  const stateZip = [clean(state), clean(zip)].filter(Boolean).join(' ');
  const locality = [cityText, stateZip].filter(Boolean).join(', ');
  return [streetText, locality].filter(Boolean).join(', ');
}

/**
 * One search hit as the results page and the claim step use it.
 *
 * The first block keeps the shape the claim step already reads (/api/property
 * stores id, type, amount and reportDate), so nothing downstream changes.
 * The rest is what helps someone recognise their own property.
 */
export function toResultItem(prop) {
  const ownerAddress = formatAddress({
    street: [prop.owner_street_1, prop.owner_street_2, prop.owner_street_3],
    city: prop.owner_city,
    state: prop.owner_state,
    zip: prop.owner_zip,
  });
  const shares = clean(prop.shares_reported);

  return {
    id: prop.property_id,
    type: prop.property_type,
    // Historical name: this has always carried the owner's name.
    holder: prop.owner_name,
    amount: prop.current_cash_balance || prop.cash_reported,
    // The day of the search, stored with a claim as before. Not shown.
    reportDate: new Date().toISOString().split('T')[0],
    status: 'Available',
    lastKnownAddress: ownerAddress,

    ownerName: clean(prop.owner_name),
    ownerAddress,
    coOwners: Array.isArray(prop.co_owners) ? prop.co_owners.map(clean).filter(Boolean) : [],
    ownersCount: Number.parseInt(prop.no_of_owners, 10) || null,
    holderName: clean(prop.holder_name),
    holderLocation: formatAddress({ city: prop.holder_city, state: prop.holder_state }),
    shares: Number.parseFloat(shares) > 0 ? shares : '',
    securityName: clean(prop.name_of_security_reported),
  };
}

/**
 * What a result card shows. Also reads results saved before the details were
 * added (a search kept from an earlier visit), which only had the owner's name
 * in `holder` and an address string that could read "undefined".
 */
export function describeProperty(item) {
  const legacyParts = String(item.lastKnownAddress ?? '')
    .split(',')
    .map(clean)
    .map((part) =>
      part
        .split(' ')
        .filter((word) => word && word !== 'undefined' && !PLACEHOLDERS.has(word.toUpperCase()))
        .join(' '),
    )
    .filter(Boolean);
  // A state on its own is not an address anyone can recognise.
  const legacyAddress = legacyParts.length > 1 ? legacyParts.join(', ') : '';

  const coOwners = Array.isArray(item.coOwners) ? item.coOwners : [];
  const othersOnRecord = item.ownersCount > 1 ? item.ownersCount - 1 : 0;

  return {
    owner: item.ownerName ?? clean(item.holder),
    address: item.ownerAddress ?? legacyAddress,
    coOwners,
    // When the file says there are more owners but their names were not found.
    otherOwnersCount: coOwners.length ? 0 : othersOnRecord,
    holderName: item.holderName || '',
    holderLocation: item.holderLocation || '',
    type: clean(item.type),
    securities:
      item.shares && item.securityName
        ? `${item.shares} shares of ${item.securityName}`
        : item.shares
          ? `${item.shares} shares`
          : '',
  };
}
