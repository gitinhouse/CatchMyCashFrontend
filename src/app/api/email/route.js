import { NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import connectToDatabase from "../../lib/mongodb";
import UserDetails from "../../models/userDetails";
import { sendEmailTwilio } from "../../lib/sendgrid";


export async function POST(req) {
  try {
    await connectToDatabase();

    const { userId, message } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { message: "userId is required" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { message: "Invalid userId format" },
        { status: 400 }
      );
    }

    const userDetails = await UserDetails.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!userDetails) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
 const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; background-color: #f8f9fa; padding: 30px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); overflow: hidden;">
          <div style="background-color: #4f46e5; color: #ffffff; text-align: center; padding: 20px 10px;">
            <h1 style="margin: 0; font-size: 24px;">Claim Details from Catch My cash Team</h1>
          </div>
          <div style="padding: 30px;">
            <p style="font-size: 16px; color: #333;">Hi ${userDetails.legal_name},</p>
            <p style="font-size: 16px; color: #333;">${message}</p>
          
            <p style="margin-top: 30px; font-size: 14px; color: #555;">
              Best Regards,<br><strong>Catch My Cash Team</strong>
            </p>
          </div>
          <div style="background-color: #f1f3f5; text-align: center; padding: 12px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Catch My Cash. All rights reserved.
          </div>
        </div>
      </div>
    `;
    await sendEmailTwilio({
     to: userDetails.email_id,
     subject: "Case Details",
     text: `Hi ${userDetails.legal_name},`,
     html: `
       <p>Hi ${userDetails.legal_name},</p>${htmlTemplate}
       `,
   });

    return NextResponse.json(
      {
        success: true,
        user: {
          userId,
          email: userDetails.email_id,
          name: userDetails.legal_name,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/email error:", error);
    return NextResponse.json(
      { message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}
