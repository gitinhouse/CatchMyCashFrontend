export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

export async function POST(request) {
  try {
    const { to, message } = await request.json();

    // ✅ Use Node require (NOT import)
    const twilio = require("twilio");

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
