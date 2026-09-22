// import { NextResponse } from 'next/server';
// import connectToDatabase from '../../lib/mongodb';
// import AllProperty from '../../models/allProperty';

// export const runtime = 'nodejs';

// function escapeRegex(value) {
//   return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// const ADDRESS_TOKEN_ALIASES = {
//   SAINT: ['SAINT', 'ST'],
//   ST: ['ST', 'SAINT'],
//   NORTH: ['NORTH', 'N'],
//   N: ['N', 'NORTH'],
//   SOUTH: ['SOUTH', 'S'],
//   S: ['S', 'SOUTH'],
//   EAST: ['EAST', 'E'],
//   E: ['E', 'EAST'],
//   WEST: ['WEST', 'W'],
//   W: ['W', 'WEST'],
//   MOUNT: ['MOUNT', 'MT'],
//   MT: ['MT', 'MOUNT'],
//   FORT: ['FORT', 'FT'],
//   FT: ['FT', 'FORT'],
// };

// function tokenRegexPattern(token) {
//   const normalized = token.toUpperCase();
//   const aliases = ADDRESS_TOKEN_ALIASES[normalized];

//   if (aliases) {
//     return aliases.map((alias) => escapeRegex(alias)).join('|');
//   }

//   return escapeRegex(token);
// }

// function buildNameQuery(firstName, lastName) {
//   const tokens = `${firstName} ${lastName}`
//     .trim()
//     .split(/[\s,.-]+/)
//     .map((part) => part.trim())
//     .filter((part) => part.length > 0);

//   if (tokens.length === 0) {
//     return {};
//   }

//   return {
//     $and: tokens.map((token) => ({
//       owner_name: { $regex: escapeRegex(token), $options: 'i' },
//     })),
//   };
// }

// const OPTIONAL_ADDRESS_TOKENS = new Set([
//   'ST',
//   'STREET',
//   'STR',
//   'AVE',
//   'AVENUE',
//   'AV',
//   'BLVD',
//   'BOULEVARD',
//   'RD',
//   'ROAD',
//   'DR',
//   'DRIVE',
//   'LN',
//   'LANE',
//   'CT',
//   'COURT',
//   'PL',
//   'PLACE',
//   'WAY',
//   'CIR',
//   'CIRCLE',
//   'PKWY',
//   'PARKWAY',
//   'TER',
//   'TERRACE',
//   'TRL',
//   'TRAIL',
//   'HWY',
//   'HIGHWAY',
//   'APT',
//   'APARTMENT',
//   'UNIT',
//   'STE',
//   'SUITE',
// ]);

// function buildAddressQuery(address) {
//   const tokens = address
//     .trim()
//     .split(/[\s,.#-]+/)
//     .map((part) => part.trim())
//     .filter((part) => part.length > 1 || /^\d+$/.test(part));

//   if (tokens.length === 0) {
//     return {};
//   }

//   const requiredTokens = tokens.filter(
//     (token) => !OPTIONAL_ADDRESS_TOKENS.has(token.toUpperCase()),
//   );
//   const tokensToMatch = requiredTokens.length > 0 ? requiredTokens : tokens;

//   const streetFields = ['owner_street_1', 'owner_street_2', 'owner_street_3'];

//   return {
//     $and: tokensToMatch.map((token) => ({
//       $or: streetFields.map((field) => ({
//         [field]: { $regex: tokenRegexPattern(token), $options: 'i' },
//       })),
//     })),
//   };
// }

// function getUniquePropertiesById(properties) {
//   return Array.from(
//     properties
//       .reduce((map, property) => {
//         const propertyId = String(property.property_id ?? '').trim();
//         if (!propertyId || map.has(propertyId)) {
//           return map;
//         }
//         map.set(propertyId, property);
//         return map;
//       }, new Map())
//       .values(),
//   );
// }

// function normalizePropertyIdExpression() {
//   return {
//     $trim: {
//       input: {
//         $convert: {
//           input: '$property_id',
//           to: 'string',
//           onError: '',
//           onNull: '',
//         },
//       },
//     },
//   };
// }

// const MATCHED_PROPERTY_FIELDS = {
//   property_id: 1,
//   property_type: 1,
//   owner_name: 1,
//   owner_street_1: 1,
//   owner_city: 1,
//   owner_state: 1,
//   owner_zip: 1,
//   cash_reported: 1,
//   shares_reported: 1,
//   current_cash_balance: 1,
// };

// export async function POST(req) {
//   try {
//     const captchaToken = req.headers.get('x-captcha-token');
//     if (!captchaToken) {
//       return NextResponse.json(
//         { error: 'Captcha token missing' },
//         { status: 403 },
//       );
//     }

//     const captchaRes = await fetch(
//       'https://www.google.com/recaptcha/api/siteverify',
//       {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded',
//         },
//         body: new URLSearchParams({
//           secret: process.env.RECAPTCHA_SECRET_KEY,
//           response: captchaToken,
//         }),
//       },
//     );

//     const captchaData = await captchaRes.json();

//     if (!captchaData.success) {
//       return NextResponse.json(
//         { error: 'Captcha verification failed' },
//         { status: 403 },
//       );
//     }

//     const body = await req.json();

//     const {
//       first_name,
//       last_name,
//       address,
//       city,
//       state,
//       zip_code,
//       page = 1,
//       limit = 100,
//     } = body;

//     await connectToDatabase();
//     const query = {
//       ...buildNameQuery(first_name, last_name),
//       // ...buildAddressQuery(address), // Commented out for testing
//       // owner_city: { $regex: escapeRegex(city.trim()), $options: 'i' }, // Commented out for testing
//       // owner_state: state.toUpperCase(), // Commented out for testing
//       // owner_zip: zip_code, // Commented out for testing
//     };

//     const normalizedPropertyId = normalizePropertyIdExpression();

//     const totalMatchedResult = await AllProperty.aggregate([
//       { $match: query },
//       { $group: { _id: normalizedPropertyId } },
//       { $match: { _id: { $ne: '' } } },
//       { $count: 'total' },
//     ]);
//     const totalMatched = totalMatchedResult[0]?.total ?? 0;

//     const matchedProperties = await AllProperty.aggregate([
//       { $match: query },
//       { $sort: { _id: 1 } },
//       {
//         $group: {
//           _id: normalizedPropertyId,
//           property_id: { $first: '$property_id' },
//           property_type: { $first: '$property_type' },
//           owner_name: { $first: '$owner_name' },
//           owner_street_1: { $first: '$owner_street_1' },
//           owner_city: { $first: '$owner_city' },
//           owner_state: { $first: '$owner_state' },
//           owner_zip: { $first: '$owner_zip' },
//           cash_reported: { $first: '$cash_reported' },
//           shares_reported: { $first: '$shares_reported' },
//           current_cash_balance: { $first: '$current_cash_balance' },
//         },
//       },
//       { $match: { _id: { $ne: '' } } },
//       { $sort: { _id: 1 } },
//       { $skip: (page - 1) * limit },
//       { $limit: limit },
//       { $project: { _id: 0, ...MATCHED_PROPERTY_FIELDS } },
//     ]);

//     const uniqueMatchedProperties = getUniquePropertiesById(matchedProperties);

//     return NextResponse.json(
//       {
//         totalMatched,
//         currentPage: page,
//         pageSize: limit,
//         matchedProperties: uniqueMatchedProperties,
//       },
//       { status: 200 },
//     );
//   } catch (error) {
//     console.error('GET /api/property error:', error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }













import { NextResponse } from 'next/server';
import connectToPropertyDatabase from '../../lib/mongodb-property';
import { getPropertyModel } from '../../models/AllPropertyProperty';
import connectToDatabase from '../../lib/mongodb';
import UserProperty from '../../models/userProperty';
import UserCases from '../../models/userCases';
import { deriveClaimFailure } from '../../lib/claimLifecycle';
import { readVerifiedEmailToken } from '../../lib/emailVerification';

export const runtime = 'nodejs';

/**
 * Cross-reference search hits against claims in the main database.
 *
 * The searchable property catalogue lives in its own database and knows
 * nothing about claims, so a property someone has already claimed kept showing
 * up as available.
 *
 * A property is withheld while a claim on it is settled or still running. A
 * claim that failed releases the property, so the claimant can find it and try
 * again.
 *
 * @param {Array} properties Rows from the property catalogue.
 * @returns {Promise<{ visible: Array, hiddenCount: number }>}
 */
async function applyClaimState(properties) {
  const ids = properties
    .map((p) => String(p.property_id ?? '').trim())
    .filter(Boolean);

  if (ids.length === 0) {
    return { visible: properties, hiddenCount: 0 };
  }

  // A property is blocked when any claim on it is settled or still in flight.
  // Failures are tracked separately so a property whose only claims failed is
  // offered again.
  const blocked = new Set();

  try {
    await connectToDatabase();

    const [claimedRows, relatedCases] = await Promise.all([
      UserProperty.find({ property_id: { $in: ids }, is_claimed: true })
        .select('property_id')
        .lean(),
      UserCases.find({ property_ids: { $in: ids } })
        .select(
          'property_ids claim_status status claim_process_task_status document_upload_task_status',
        )
        .lean(),
    ]);

    // Claimed at the state by anyone: never offer it again.
    for (const row of claimedRows) {
      blocked.add(String(row.property_id));
    }

    const wanted = new Set(ids);
    for (const kase of relatedCases) {
      const { failed } = deriveClaimFailure(kase);

      // A failed case does not block; any other case does, whether it is
      // settled (`status === false` marks an approved case) or still running.
      if (failed) continue;

      for (const rawId of kase.property_ids || []) {
        const propertyId = String(rawId);
        if (wanted.has(propertyId)) {
          blocked.add(propertyId);
        }
      }
    }
  } catch (error) {
    // A claims-lookup failure must not blank out search results; fall back to
    // showing everything rather than hiding properties the claimant may own.
    console.error('[filterProperty] claim lookup failed:', error.message);
    return { visible: properties, hiddenCount: 0 };
  }

  const visible = [];
  let hiddenCount = 0;

  for (const property of properties) {
    if (blocked.has(String(property.property_id ?? '').trim())) {
      hiddenCount += 1;
      continue;
    }
    visible.push(property);
  }

  return { visible, hiddenCount };
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Build query using $in for better performance
function buildNameQuery(firstName, lastName) {
  const first = (firstName || '').trim().toUpperCase();
  const last = (lastName || '').trim().toUpperCase();

  if (!first && !last) {
    return {};
  }

  const patterns = [];
  if (first && last) {
    patterns.push(`^${escapeRegex(first)} ${escapeRegex(last)}`);
    patterns.push(`^${escapeRegex(last)} ${escapeRegex(first)}`);
  } else {
    patterns.push(`^${escapeRegex(first || last)}`);
  }

  // Anchored, no 'i' flag — owner_name is stored uppercase, so this
  // lets Mongo use owner_name_1 index bounds instead of a full scan.
  return {
    $or: patterns.map((pattern) => ({
      owner_name: { $regex: pattern },
    })),
  };
}

function getUniquePropertiesById(properties) {
  return Array.from(
    properties
      .reduce((map, property) => {
        const propertyId = String(property.property_id ?? '').trim();
        if (!propertyId || map.has(propertyId)) return map;
        map.set(propertyId, property);
        return map;
      }, new Map())
      .values(),
  );
}

// Cache for frequent searches
const searchCache = new Map();
const CACHE_TTL = 60000; // 1 minute

export async function POST(req) {
  const startTime = Date.now();

  try {
    // Two ways to prove this is a person: a fresh captcha, or the token issued
    // when an emailed code was verified. The second exists because a reCAPTCHA
    // token dies after about two minutes — far less than it takes to receive
    // an email and type the code — so a signed-out claimant who verifies their
    // address would otherwise come back to a captcha that no longer works and
    // never reach their results.
    const captchaToken = req.headers.get('x-captcha-token');
    const emailVerificationToken = req.headers.get('x-email-verification-token');

    if (!captchaToken && !emailVerificationToken) {
      return NextResponse.json({ error: 'Captcha token missing' }, { status: 403 });
    }

    if (captchaToken) {
      const captchaRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      });

      const captchaData = await captchaRes.json();
      if (!captchaData.success) {
        return NextResponse.json({ error: 'Captcha verification failed' }, { status: 403 });
      }
    } else {
      const proof = readVerifiedEmailToken(emailVerificationToken);
      if (!proof.valid) {
        return NextResponse.json(
          { error: 'Email verification expired. Please verify your email again.' },
          { status: 403 },
        );
      }
    }

    const body = await req.json();
    const { first_name, last_name, page = 1, limit = 20 } = body;

    // Check cache
    const cacheKey = `${first_name}_${last_name}_${page}_${limit}`;
    const cachedResult = searchCache.get(cacheKey);
    if (cachedResult && Date.now() - cachedResult.timestamp < CACHE_TTL) {
      console.log('✅ Returning cached result');

      const { visible, hiddenCount } = await applyClaimState(
        cachedResult.data.matchedProperties,
      );

      return NextResponse.json({
        totalMatched: Math.max(
          cachedResult.data.totalMatched - hiddenCount,
          visible.length,
        ),
        currentPage: page,
        pageSize: limit,
        matchedProperties: visible,
        alreadyClaimedCount: hiddenCount,
        searchTime: '0ms (cached)',
      });
    }

    console.log(`🔍 Searching for: ${first_name} ${last_name}`);

    const connection = await connectToPropertyDatabase();
    const Property = getPropertyModel(connection);

    const query = buildNameQuery(first_name, last_name);
    console.log('🔎 Query:', JSON.stringify(query));



    const [totalMatched, matchedProperties] = await Promise.all([
      Property.countDocuments(query).maxTimeMS(10000),
      Property.find(query)
        .sort({ property_id: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .maxTimeMS(10000)
        .lean()
        .select('property_id property_type owner_name owner_street_1 owner_city owner_state owner_zip cash_reported shares_reported current_cash_balance'),
    ]);

    console.log(`✅ Found ${totalMatched} results in ${Date.now() - startTime}ms`);

    const uniqueMatchedProperties = getUniquePropertiesById(matchedProperties);

    const { visible, hiddenCount } = await applyClaimState(
      uniqueMatchedProperties,
    );

    const responseData = {
      totalMatched: Math.max(totalMatched - hiddenCount, visible.length),
      currentPage: page,
      pageSize: limit,
      matchedProperties: visible,
      alreadyClaimedCount: hiddenCount,
      searchTime: `${Date.now() - startTime}ms`,
    };

    // Only the catalogue lookup is cached. Claim state is re-applied on every
    // request so a property claimed a moment ago stops appearing at once.
    searchCache.set(cacheKey, {
      data: { totalMatched, matchedProperties: uniqueMatchedProperties },
      timestamp: Date.now(),
    });

    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('❌ POST /api/filterProperty error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 },
    );
  }
}