import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import connectToDatabase from "../../lib/mongodb";
import UserLogin from "../../models/userLogin";
import mongoose from "mongoose";

export async function POST(req) {
  try {
    await connectToDatabase();

    const { userEmail, userPassword, user_id, userType } = await req.json();

    if (!userEmail || !userPassword) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }
   const mongooseUserId = new mongoose.Types.ObjectId(user_id);

    const existingUser = await UserLogin.findOne({
      $or: [{ userEmail }, { user_id: mongooseUserId }],
    });

    if (existingUser) {
      let message = "User already exists";
      if (existingUser.userEmail === userEmail) {
        message = "Email already registered";
      } else if (existingUser.user_id.toString() === user_id) {
        message = "User ID already linked";
      }

      return NextResponse.json({ message }, { status: 409 });
    }
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

    return NextResponse.json(
      {
        message: "User registered ok successfully",
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
