import { NextResponse } from 'next/server';
import crypto from 'crypto';
import connectToDatabase from '../../lib/mongodb';
import UserLogin from '../../models/userLogin';
import { sendEmailTwilio } from '../../lib/sendgrid';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const userEmail = body.userEmail?.trim().toLowerCase();

    if (!userEmail) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const existingUser = await UserLogin.findOne({ userEmail });

    // Clear message when email isn't registered
    if (!existingUser) {
      return NextResponse.json(
        { message: 'No account is registered with this email address.' },
        { status: 404 },
      );
    }

    // Generate a random token; store only its hash (never the raw token)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + 30 * 60 * 1000); // valid for 30 minutes

    existingUser.resetPasswordToken = hashedToken;
    existingUser.resetPasswordExpires = expiry;
    await existingUser.save();

    const resetLink = `https://catchmycash.com/resetPassword?token=${rawToken}&email=${encodeURIComponent(userEmail)}`;

    await sendEmailTwilio({
      to: userEmail,
      subject: 'Reset Your CatchMyCash Password',
      text: `We received a request to reset your password. Reset it here: ${resetLink} (expires in 30 minutes). If you didn't request this, ignore this email.`,
      html: `
        <p>Hi ${userEmail},</p>
        <p>We received a request to reset your password.</p>
        <p style="margin-top:20px;">
          <a href="${resetLink}"
             style="color:#E1261C; text-decoration:none; font-weight:bold;">
            Reset Your Password
          </a>
        </p>
        <p style="margin-top:10px; color:#4A4A4A; font-size:13px;">
          This link will expire in 30 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      `,
    });

    return NextResponse.json(
      { message: 'A password reset link has been sent to your email address.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}