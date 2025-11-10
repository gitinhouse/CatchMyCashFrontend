import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../../lib/mongodb";
import UserLogin from "../../models/userLogin";
import mongoose from "mongoose";
import { sendEmail } from "../../lib/mailer";
import { generateRandomPassword } from "../../lib/utils";
import { createNotification } from "../../lib/createNotification.js";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { userEmail, user_id, userType } = await req.json();

    if (!userEmail) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const mongooseUserId = new mongoose.Types.ObjectId(user_id);

    const existingUser = await UserLogin.findOne({
      $or: [{ userEmail }, { user_id: mongooseUserId }],
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email already exists. Please use a different email." },
        { status: 409 }
      );
    }

    // Create new user
    const userPassword = generateRandomPassword(10);
    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const newUser = await UserLogin.create({
      user_id,
      userEmail,
      userPassword: hashedPassword,
      userType: userType || "User",
    });

    // Generate JWT token
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

    // Prepare email
    const credentialsHTML = `
      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <tr>
          <td style="padding: 10px; border: 1px solid #eaeaea; background-color: #f9fafb;"><strong>Email:</strong></td>
          <td style="padding: 10px; border: 1px solid #eaeaea;">${newUser.userEmail}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #eaeaea; background-color: #f9fafb;"><strong>Password:</strong></td>
          <td style="padding: 10px; border: 1px solid #eaeaea;">${userPassword}</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #444;">You can now log in to your account.</p>
    `;

    await sendEmail(
      newUser.userEmail,
      "Welcome to Our Platform 🎉",
      `Hi ${newUser.userEmail},<br>Welcome aboard! Your account has been created successfully. Here are your login details:`,
      credentialsHTML
    );

    await createNotification(
      user_id,
      "Login details",
      "An Email has been sent to your registered Email-Id with Login Details."
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        token,
        user: {
          id: newUser._id,
          email: newUser.userEmail,
          type: newUser.userType,
          user_id: newUser.user_id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
