import { NextResponse } from 'next/server';
import connectToDatabase from '../../lib/mongodb';
import AllProperty from '../../models/allProperty';

export const runtime = 'nodejs';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const ADDRESS_TOKEN_ALIASES = {
  SAINT: ['SAINT', 'ST'],
  ST: ['ST', 'SAINT'],
  NORTH: ['NORTH', 'N'],
  N: ['N', 'NORTH'],
  SOUTH: ['SOUTH', 'S'],
  S: ['S', 'SOUTH'],
  EAST: ['EAST', 'E'],
  E: ['E', 'EAST'],
  WEST: ['WEST', 'W'],
  W: ['W', 'WEST'],
  MOUNT: ['MOUNT', 'MT'],
  MT: ['MT', 'MOUNT'],
  FORT: ['FORT', 'FT'],
  FT: ['FT', 'FORT'],
};

function tokenRegexPattern(token) {
  const normalized = token.toUpperCase();
  const aliases = ADDRESS_TOKEN_ALIASES[normalized];

  if (aliases) {
    return aliases.map((alias) => escapeRegex(alias)).join('|');
  }

  return escapeRegex(token);
}

function buildNameQuery(firstName, lastName) {
  const tokens = `${firstName} ${lastName}`
    .trim()
    .split(/[\s,.-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  if (tokens.length === 0) {
    return {};
  }

  return {
    $and: tokens.map((token) => ({
      owner_name: { $regex: escapeRegex(token), $options: 'i' },
    })),
  };
}

const OPTIONAL_ADDRESS_TOKENS = new Set([
  'ST',
  'STREET',
  'STR',
  'AVE',
  'AVENUE',
  'AV',
  'BLVD',
  'BOULEVARD',
  'RD',
  'ROAD',
  'DR',
  'DRIVE',
  'LN',
  'LANE',
  'CT',
  'COURT',
  'PL',
  'PLACE',
  'WAY',
  'CIR',
  'CIRCLE',
  'PKWY',
  'PARKWAY',
  'TER',
  'TERRACE',
  'TRL',
  'TRAIL',
  'HWY',
  'HIGHWAY',
  'APT',
  'APARTMENT',
  'UNIT',
  'STE',
  'SUITE',
]);

function buildAddressQuery(address) {
  const tokens = address
    .trim()
    .split(/[\s,.#-]+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 || /^\d+$/.test(part));

  if (tokens.length === 0) {
    return {};
  }

  const requiredTokens = tokens.filter(
    (token) => !OPTIONAL_ADDRESS_TOKENS.has(token.toUpperCase()),
  );
  const tokensToMatch = requiredTokens.length > 0 ? requiredTokens : tokens;

  const streetFields = ['owner_street_1', 'owner_street_2', 'owner_street_3'];

  return {
    $and: tokensToMatch.map((token) => ({
      $or: streetFields.map((field) => ({
        [field]: { $regex: tokenRegexPattern(token), $options: 'i' },
      })),
    })),
  };
}
export async function POST(req) {
  try {
    const captchaToken = req.headers.get('x-captcha-token');
    if (!captchaToken) {
      return NextResponse.json(
        { error: 'Captcha token missing' },
        { status: 403 },
      );
    }

    const captchaRes = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: captchaToken,
        }),
      },
    );

    const captchaData = await captchaRes.json();

    if (!captchaData.success) {
      return NextResponse.json(
        { error: 'Captcha verification failed' },
        { status: 403 },
      );
    }

    const body = await req.json();

    const {
      first_name,
      last_name,
      address,
      city,
      state,
      zip_code,
      page = 1,
      limit = 100,
    } = body;

    await connectToDatabase();
    const query = {
      ...buildNameQuery(first_name, last_name),
      ...buildAddressQuery(address),
      owner_city: { $regex: escapeRegex(city.trim()), $options: 'i' },
      owner_state: state.toUpperCase(),
      owner_zip: zip_code,
    };

    const totalMatched = await AllProperty.countDocuments(query);

    const matchedProperties = await AllProperty.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        'property_id property_type owner_name owner_street_1 owner_city owner_state owner_zip cash_reported shares_reported current_cash_balance',
      );

    return NextResponse.json(
      {
        totalMatched,
        currentPage: page,
        pageSize: limit,
        matchedProperties,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('GET /api/property error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
