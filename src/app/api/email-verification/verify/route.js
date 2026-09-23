import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserLogin from '../../../models/userLogin';
import EmailVerification from '../../../models/emailVerification';
import {
  MAX_ATTEMPTS,
  VERIFIED_TOKEN_TTL_MINUTES,
  isValidEmail,
  issueVerifiedEmailToken,
  normalizeEmail,
  otpMatches,
} from '../../../lib/emailVerification';

export const dynamic = 'force-dynamic';

/**
 * Check a code and, if it is right, hand back proof of verification.
 *
 * The proof is a short-lived signed token rather than a flag in the browser,
 * because the claim that is eventually filed has to be checked against
 * something the browser cannot forge.
 */
export async function POST(req) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 },
      );
    }

    const email = normalizeEmail(body?.email);
    const otp = String(body?.otp || '').trim();

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { success: false, error: 'Enter the 6-digit code from your email.' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    // Re-checked here as well as at send time: an account could have been
    // created in between, and the guest path must never shadow a real account.
    const existing = await UserLogin.findOne({ userEmail: email })
      .select('_id')
      .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          registered: true,
          error:
            'An account already exists with this email address. Please log in to continue your claim.',
        },
        { status: 409 },
      );
    }

    const record = await EmailVerification.findOne({ email, verified_at: null })
      .sort({ createdAt: -1 })
      .exec();

    if (!record) {
      return NextResponse.json(
        {
          success: false,
          error: 'No verification code is waiting for this address. Request a new one.',
        },
        { status: 404 },
      );
    }

    if (record.expires_at.getTime() <= Date.now()) {
      await record.deleteOne();
      return NextResponse.json(
        {
          success: false,
          expired: true,
          error: 'That code has expired. Request a new one.',
        },
        { status: 410 },
      );
    }

    if (record.attempts >= MAX_ATTEMPTS) {
      await record.deleteOne();
      return NextResponse.json(
        {
          success: false,
          error: 'Too many incorrect attempts. Request a new code.',
        },
        { status: 429 },
      );
    }

    if (!otpMatches(otp, record.otp_hash)) {
      record.attempts += 1;
      await record.save();

      const left = Math.max(MAX_ATTEMPTS - record.attempts, 0);
      return NextResponse.json(
        {
          success: false,
          attempts_left: left,
          error:
            left > 0
              ? `That code is not correct. ${left} attempt${left === 1 ? '' : 's'} left.`
              : 'That code is not correct. Request a new code.',
        },
        { status: 400 },
      );
    }

    record.verified_at = new Date();
    await record.save();

    console.log('[email-verification/verify] verified', { email });

    return NextResponse.json({
      success: true,
      email,
      verification_token: issueVerifiedEmailToken(email),
      token_expires_in_minutes: VERIFIED_TOKEN_TTL_MINUTES,
    });
  } catch (error) {
    console.error('[email-verification/verify] failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not verify the code.' },
      { status: 500 },
    );
  }
}
