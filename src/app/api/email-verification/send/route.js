import { NextResponse } from 'next/server';
import connectToDatabase from '../../../lib/mongodb';
import UserLogin from '../../../models/userLogin';
import EmailVerification from '../../../models/emailVerification';
import { sendEmailTwilio } from '../../../lib/sendgrid';
import {
  MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  RESEND_COOLDOWN_SECONDS,
  generateOtp,
  hashOtp,
  isValidEmail,
  normalizeEmail,
  otpEmailContent,
} from '../../../lib/emailVerification';

export const dynamic = 'force-dynamic';

/**
 * Start verifying a signed-out visitor's email address.
 *
 * An address that already has an account is refused rather than verified: the
 * claim belongs on that account, so the visitor is sent to sign in instead of
 * being allowed to file a second, parallel identity as a guest.
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

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 },
      );
    }

    await connectToDatabase();

    const existing = await UserLogin.findOne({ userEmail: email })
      .select('_id')
      .lean();

    if (existing) {
      // Not an error the visitor caused, so it reads as guidance rather than a
      // failure: the account is theirs, they just need to be in it.
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

    // Throttle per address so the endpoint cannot be used to mail-bomb someone.
    const latest = await EmailVerification.findOne({ email })
      .sort({ createdAt: -1 })
      .lean();

    if (latest?.createdAt) {
      const elapsed = (Date.now() - new Date(latest.createdAt).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        return NextResponse.json(
          {
            success: false,
            error: `Please wait ${Math.ceil(
              RESEND_COOLDOWN_SECONDS - elapsed,
            )} seconds before requesting another code.`,
            retry_after_seconds: Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed),
          },
          { status: 429 },
        );
      }
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

    // Any earlier code for this address stops working the moment a new one is
    // issued, so only the newest code in the visitor's inbox is live.
    await EmailVerification.deleteMany({ email, verified_at: null });

    await EmailVerification.create({
      email,
      otp_hash: hashOtp(otp),
      expires_at: expiresAt,
      attempts: 0,
    });

    const content = otpEmailContent(otp);
    const result = await sendEmailTwilio({ to: email, ...content });

    console.log('[email-verification/send]', {
      email,
      sent: result?.success === true,
      reason: result?.reason || null,
      expires_at: expiresAt.toISOString(),
    });

    if (!result?.success) {
      // A code nobody can receive is worse than none: drop it so the visitor
      // can try again immediately instead of waiting out a cooldown.
      await EmailVerification.deleteMany({ email, verified_at: null });
      return NextResponse.json(
        {
          success: false,
          error:
            'We could not send the verification code. Please check the address and try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      email,
      expires_in_minutes: OTP_TTL_MINUTES,
      max_attempts: MAX_ATTEMPTS,
    });
  } catch (error) {
    console.error('[email-verification/send] failed', error);
    return NextResponse.json(
      { success: false, error: 'Could not start email verification.' },
      { status: 500 },
    );
  }
}
