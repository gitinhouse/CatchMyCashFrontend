import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../lib/mongodb';
import UserLogin from '../../models/userLogin';
import mongoose from 'mongoose';
import { sendEmail } from '../../lib/mailer';
import { sendEmailTwilio } from '../../lib/sendgrid';
import {
  sendPasswordSetupLink,
  unusablePasswordHash,
} from '../../lib/passwordSetup';
import { createNotification } from '../../lib/createNotification.js';
import UserCases from '../../models/userCases';
import { verifyToken } from '../../lib/verifyToken';
import { Types } from 'mongoose';


export async function POST(req) {
  try {
    await connectToDatabase();

    const body = await req.json();

    const userEmail = body.userEmail?.trim().toLowerCase();
    const { user_id, userType } = body;

    if (!userEmail) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // A missing or malformed user_id must never reach findOne(): Mongoose drops
    // undefined values, so findOne({ user_id }) would become findOne({}) and
    // return an arbitrary account.
    const userObjectId = Types.ObjectId.isValid(user_id)
      ? new Types.ObjectId(user_id)
      : null;

    // The email being registered is the identity that decides whether this is a
    // returning user. Matching on user_id first made a brand-new email look
    // like an existing account whenever the browser still carried a user_id
    // from an earlier search, so the claimant got the "you already have an
    // account" mail instead of their welcome mail — and that older account had
    // its address silently overwritten.
    const existingUser = await UserLogin.findOne({ userEmail });

    if (existingUser) {
      // Same email, so the address needs no change. Re-point the account at the
      // current search session only when we were given a usable id.
      if (userObjectId) {
        existingUser.user_id = userObjectId;
      }
      if (userType) {
        existingUser.userType = userType;
      }

      await existingUser.save();

      await sendEmailTwilio({
        to: userEmail,
        subject: "Your CatchMyCash Account",
        text: `Hi, you already have an account with us. Please check your previous email for your login credentials, or log in at https://catchmycash.com/userLogin. If you've forgotten your password, use the "Forgot Password" option on the login page.`,
        html: `
          <p>Hi ${userEmail},</p>
          <p>We found that you already have an account with CatchMyCash.</p>
          <p>Please check your previous email for your login credentials (email and password).</p>
          <p style="margin-top:20px;">
            <a href="https://catchmycash.com/userLogin"
               style="color:#E1261C; text-decoration:none; font-weight:bold;">
              Login to CatchMyCash
            </a>
          </p>
          <p style="margin-top:10px; color:#4A4A4A; font-size:13px;">
            If you've forgotten your password, use the "Forgot Password" option on the login page.
          </p>
        `,
      });

      await createNotification(
        existingUser.user_id,
        "Account Found",
        "You already have an account. Please check your previous email for your login details."
      );

      return NextResponse.json(
        {
          message: "Existing user found. Please check your previous email for login details.",
          user: {
            id: existingUser._id,
            email: existingUser.userEmail,
            user_id: existingUser.user_id,
            type: existingUser.userType,
            user_type: "Existing",
          },
        },
        { status: 200 }
      );
    }

    // ================= CREATE NEW USER =================
    // This email has never been registered, so the claimant gets a fresh
    // account and the normal welcome mail.
    // No password is generated for the claimant: the account is created with
    // an unusable placeholder hash and they choose their own password through
    // the emailed set-password link.
    const hashedPassword = await unusablePasswordHash();

    // UserLogin.user_id is unique, so a search session that already produced a
    // login under a different address is moved to the new one instead of
    // failing on the index.
    const sessionAccount = userObjectId
      ? await UserLogin.findOne({ user_id: userObjectId })
      : null;

    let newUser;
    if (sessionAccount) {
      sessionAccount.userEmail = userEmail;
      sessionAccount.userPassword = hashedPassword;
      sessionAccount.userType = userType || sessionAccount.userType;
      newUser = await sessionAccount.save();
    } else {
      newUser = await UserLogin.create({
        user_id: userObjectId,
        userEmail,
        userPassword: hashedPassword,
        userType: userType || "User",
      });
    }

    const token = jwt.sign(
      {
        id: newUser._id,
        email: newUser.userEmail,
        type: newUser.userType,
        user_id: newUser.user_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    // The claimant sets their own password via this link; no password is
    // generated or emailed.
    await sendPasswordSetupLink(newUser, { isNewAccount: true });

    await createNotification(
      newUser.user_id,
      "Set your password",
      "We emailed you a link to choose your password and sign in."
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          email: newUser.userEmail,
          user_id: newUser.user_id,
          type: newUser.userType,
          user_type: "New",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    // 🔹 Verify JWT
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get('user_id');

    if (user_id && !Types.ObjectId.isValid(user_id)) {
      return NextResponse.json(
        { error: 'Invalid user_id format' },
        { status: 400 },
      );
    }
    const caseData = await UserCases.findOne({ user_id }).sort({
      createdAt: -1,
    });
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('GET /api/case error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
