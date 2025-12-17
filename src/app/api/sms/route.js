export const runtime = "nodejs";

import { NextResponse } from "next/server";
import twilio from "twilio";

export async function POST(request) {
  try {
    const { to, message } = await request.json();

    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
    });

    return NextResponse.json({ success: true, sid: result.sid });
  } catch (error) {
    console.error("Twilio SMS error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
