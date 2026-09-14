import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import connectToDatabase from '../../lib/mongodb';
import UserLogin from '../../models/userLogin';

// GET: verify the token is valid before showing the "set new password" form
export async function GET(req) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!token || !email) {
      return NextResponse.json({ valid: false, message: 'Invalid reset link.' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserLogin.findOne({
      userEmail: email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() }, // must not be expired
    });

    if (!user) {
      return NextResponse.json(
        { valid: false, message: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ valid: true }, { status: 200 });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false, message: 'Server error' }, { status: 500 });
  }
}

// POST: actually set the new password
export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { token, password } = body;
    const email = body.email?.trim().toLowerCase();

    if (!token || !email || !password) {
      return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: 'Password must be at least 8 characters.' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserLogin.findOne({
      userEmail: email,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'This reset link is invalid or has expired. Please request a new one.' },
        { status: 400 },
      );
    }

    user.userPassword = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null; // invalidate token so it can't be reused
    user.resetPasswordExpires = null;
    await user.save();

    return NextResponse.json({ message: 'Your password has been reset successfully.' }, { status: 200 });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ message: 'Server error', error: error.message }, { status: 500 });
  }
}