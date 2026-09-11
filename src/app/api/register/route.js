import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import connectToDatabase from '../../lib/mongodb';
import UserLogin from '../../models/userLogin';
import mongoose from 'mongoose';
import { sendEmail } from '../../lib/mailer';
import { sendEmailTwilio } from '../../lib/sendgrid';
import { generateRandomPassword } from '../../lib/utils';
import { createNotification } from '../../lib/createNotification.js';
import UserCases from '../../models/userCases';
import { verifyToken } from '../../lib/verifyToken';
import { Types } from 'mongoose';

// export async function POST(req) {
//   try {
//     await connectToDatabase();

//     const { userEmail, user_id, userType } = await req.json();

//     if (!userEmail) {
//       return NextResponse.json(
//         { message: 'Email is required' },
//         { status: 400 },
//       );
//     }

//     // Check if a user with the given email already exists
//     const existingUser = await UserLogin.findOne({ userEmail });

//     if (existingUser) {
//       return NextResponse.json(
//         { message: 'Email already exists. Please use a different email.' },
//         { status: 409 },
//       );
//     }

//     // Create new user
//     const userPassword = generateRandomPassword(10);
//     const hashedPassword = await bcrypt.hash(userPassword, 10);

//     const newUser = await UserLogin.create({
//       user_id,
//       userEmail,
//       userPassword: hashedPassword,
//       userType: userType || 'User',
//     });

//     // Generate JWT token
//     const token = jwt.sign(
//       {
//         id: newUser._id,
//         email: newUser.userEmail,
//         type: newUser.userType,
//         user_id: newUser.user_id,
//       },
//       process.env.JWT_SECRET,
//       { expiresIn: process.env.JWT_EXPIRES_IN || '1d' },
//     );

//     // Prepare email
//     const credentialsHTML = `
//       <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
//         <tr>
//           <td style="padding: 10px; border: 1px solid #eaeaea; background-color: #f9fafb;"><strong>Email:</strong></td>
//           <td style="padding: 10px; border: 1px solid #eaeaea;">${newUser.userEmail}</td>
//         </tr>
//         <tr>
//           <td style="padding: 10px; border: 1px solid #eaeaea; background-color: #f9fafb;"><strong>Password:</strong></td>
//           <td style="padding: 10px; border: 1px solid #eaeaea;">${userPassword}</td>
//         </tr>
//       </table>
//       <p style="margin-top: 20px; color: #444;">You can now log in to your account by clicking the link below:</p>
//       <p style="margin-top: 10px;"><a href="https://catchmycash.com/userLogin" style="color: #E1261C; text-decoration: none; font-weight: bold;">Login to CatchMyCash</a></p>
//     `;

//     await sendEmailTwilio({
//       to: newUser.userEmail,
//       subject: 'Welcome to Our Platform 🎉',
//       text: `Hi ${newUser.userEmail}, Welcome aboard! Your account has been created successfully. You can now log in to your account at https://catchmycash.com/userLogin`,
//       html: `
//     <p>Hi ${newUser.userEmail},</p>
//     <p>Welcome aboard! Your account has been created successfully.</p>
//     ${credentialsHTML}
//   `,
//     });

//     await createNotification(
//       user_id,
//       'Login details',
//       'An Email has been sent to your registered Email-Id with Login Details.',
//     );

//     return NextResponse.json(
//       {
//         message: 'User registered successfully',
//         token,
//         user: {
//           id: newUser._id,
//           email: newUser.userEmail,
//           type: newUser.userType,
//           user_id: newUser.user_id,
//           user_type: 'New',
//         },
//       },
//       { status: 201 },
//     );
//   } catch (error) {
//     console.error('Registration error:', error);
//     return NextResponse.json({ message: 'Server error' }, { status: 500 });
//   }
// }

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

    // 1. Find by user_id first
    let existingUser = await UserLogin.findOne({ user_id });

    // 2. If not found, find by email
    if (!existingUser) {
      existingUser = await UserLogin.findOne({ userEmail });
    }

    // ================= UPDATE EXISTING USER =================
    if (existingUser) {
      const newPassword = generateRandomPassword(10);
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      existingUser.user_id = user_id;
      existingUser.userEmail = userEmail;
      existingUser.userType = userType || existingUser.userType;
      existingUser.userPassword = hashedPassword;

      await existingUser.save();

      const credentialsHTML = `
        <table style="width:100%; border-collapse:collapse; margin-top:20px;">
          <tr>
            <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Email:</strong></td>
            <td style="padding:10px; border:1px solid #eaeaea;">${userEmail}</td>
          </tr>
          <tr>
            <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Password:</strong></td>
            <td style="padding:10px; border:1px solid #eaeaea;">${newPassword}</td>
          </tr>
        </table>

        <p style="margin-top:20px;">
          <a href="https://catchmycash.com/userLogin"
             style="color:#E1261C; text-decoration:none; font-weight:bold;">
            Login to CatchMyCash
          </a>
        </p>
      `;

      await sendEmailTwilio({
        to: userEmail,
        subject: "Your CatchMyCash Login Details",
        text: `Email: ${userEmail}\nPassword: ${newPassword}\nLogin: https://catchmycash.com/userLogin`,
        html: `
          <p>Hi ${userEmail},</p>
          <p>Your account already exists. We've updated your login password.</p>
          ${credentialsHTML}
        `,
      });

      await createNotification(
        existingUser.user_id,
        "Login details",
        "An email has been sent to your registered Email ID with your login details."
      );

      return NextResponse.json(
        {
          message: "User updated successfully. Login details sent.",
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
    const userPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const newUser = await UserLogin.create({
      user_id,
      userEmail,
      userPassword: hashedPassword,
      userType: userType || "User",
    });

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

    const credentialsHTML = `
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <tr>
          <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Email:</strong></td>
          <td style="padding:10px; border:1px solid #eaeaea;">${userEmail}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Password:</strong></td>
          <td style="padding:10px; border:1px solid #eaeaea;">${userPassword}</td>
        </tr>
      </table>

      <p style="margin-top:20px;">
        <a href="https://catchmycash.com/userLogin"
           style="color:#E1261C; text-decoration:none; font-weight:bold;">
          Login to CatchMyCash
        </a>
      </p>
    `;

    await sendEmailTwilio({
      to: userEmail,
      subject: "Welcome to CatchMyCash 🎉",
      text: `Email: ${userEmail}\nPassword: ${userPassword}\nLogin: https://catchmycash.com/userLogin`,
      html: `
        <p>Hi ${userEmail},</p>
        <p>Welcome aboard! Your account has been created successfully.</p>
        ${credentialsHTML}
      `,
    });

    await createNotification(
      user_id,
      "Login details",
      "An email has been sent to your registered Email ID with your login details."
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
    const caseData = await UserCases.findOne({ user_id });
    return NextResponse.json(caseData);
  } catch (error) {
    console.error('GET /api/case error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
