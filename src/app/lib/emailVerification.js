import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/**
 * Guest email verification.
 *
 * A claim must be filed against an address its owner can actually read: either
 * the signed-in account's own address, or one a signed-out visitor has proved
 * they receive mail at. This module holds the rules both the send and verify
 * routes — and the registration route that trusts the result — share.
 */

/** How long a code stays usable. */
export const OTP_TTL_MINUTES = 10;

/** Wrong guesses allowed before a code is burned. */
export const MAX_ATTEMPTS = 5;

/** Shortest gap between two codes for the same address. */
export const RESEND_COOLDOWN_SECONDS = 30;

/** How long the proof of verification is accepted for afterwards. */
export const VERIFIED_TOKEN_TTL_MINUTES = 120;

const TOKEN_PURPOSE = 'email_verified';

/** Six digits, uniformly drawn — never Math.random for anything security-ish. */
export function generateOtp() {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

export function hashOtp(otp) {
  return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

/**
 * Compare a supplied code against a stored hash without leaking, through
 * timing, how much of it was right.
 */
export function otpMatches(otp, storedHash) {
  const supplied = Buffer.from(hashOtp(otp), 'hex');
  const stored = Buffer.from(String(storedHash || ''), 'hex');
  if (supplied.length !== stored.length) return false;
  return crypto.timingSafeEqual(supplied, stored);
}

export function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Deliberately conservative: this address is going to receive mail and will be
 * attached to a legal claim, so an obviously malformed one is rejected here
 * rather than bouncing later.
 */
export function isValidEmail(value) {
  const email = normalizeEmail(value);
  if (!email || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email);
}

/**
 * A short-lived signed statement that this address was verified.
 *
 * The client keeps it and hands it back when the claim is filed, which is what
 * lets the server insist the claim's email is one somebody proved they own —
 * rather than trusting a field the browser could simply have been edited.
 */
export function issueVerifiedEmailToken(email) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is missing');

  return jwt.sign(
    { email: normalizeEmail(email), purpose: TOKEN_PURPOSE },
    secret,
    { expiresIn: `${VERIFIED_TOKEN_TTL_MINUTES}m` },
  );
}

/**
 * @returns {{valid: boolean, email: string|null, reason?: string}}
 */
export function readVerifiedEmailToken(token) {
  const secret = process.env.JWT_SECRET;
  if (!secret) return { valid: false, email: null, reason: 'server_misconfigured' };
  if (!token) return { valid: false, email: null, reason: 'missing_token' };

  try {
    const payload = jwt.verify(String(token), secret);
    if (payload?.purpose !== TOKEN_PURPOSE) {
      return { valid: false, email: null, reason: 'wrong_purpose' };
    }
    return { valid: true, email: normalizeEmail(payload.email) };
  } catch (error) {
    return {
      valid: false,
      email: null,
      reason: error?.name === 'TokenExpiredError' ? 'expired' : 'invalid',
    };
  }
}

/** The mail a visitor receives with their code. */
export function otpEmailContent(otp) {
  return {
    subject: `${otp} is your CatchMyCash verification code`,
    text:
      `Your CatchMyCash verification code is ${otp}.\n\n` +
      `It expires in ${OTP_TTL_MINUTES} minutes. If you did not request it, ignore this email.`,
    html: `
      <p>Your CatchMyCash verification code is:</p>
      <p style="font-size:28px; font-weight:bold; letter-spacing:6px; color:#E1261C; margin:16px 0;">
        ${otp}
      </p>
      <p style="color:#4A4A4A; font-size:13px;">
        This code expires in ${OTP_TTL_MINUTES} minutes. If you did not request
        it, you can safely ignore this email.
      </p>
    `,
  };
}
