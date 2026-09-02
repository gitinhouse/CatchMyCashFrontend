// app/api/referral-link/route.js
import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import ReferralLink from "../../models/ReferralLink";
import User from "../../models/UserInformation";
import crypto from "crypto";

function generateCode(firstName) {
  const initials = (firstName || "CM").slice(0, 2).toUpperCase();
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `CM-${initials}-${year}-${random}`;
}

// Create (or reuse) a shareable referral code for this user's case
export async function POST(req) {
  try {
    const { user_id, case_id } = await req.json();
    if (!user_id || !case_id) {
      return NextResponse.json({ error: "user_id and case_id are required" }, { status: 400 });
    }

    await connectToDatabase();

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json({ error: "User not found with provided user_id" }, { status: 404 });
    }

    // Reuse an existing link for this user+case instead of minting a new one every click
    const existing = await ReferralLink.findOne({ user_id, case_id });
    if (existing) {
      return NextResponse.json(existing, { status: 200 });
    }

    let referral_code;
    let attempts = 0;
    let taken = true;
    while (taken && attempts < 5) {
      referral_code = generateCode(userExists.first_name);
      taken = await ReferralLink.findOne({ referral_code });
      attempts += 1;
    }

    const link = await ReferralLink.create({ user_id, case_id, referral_code });
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("POST /api/referral-link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Resolve a code -> referrer info, used by the /ref/[code] landing page
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }

    await connectToDatabase();

    const link = await ReferralLink.findOne({ referral_code: code });
    if (!link) {
      return NextResponse.json({ error: "Referral link not found" }, { status: 404 });
    }

    const referrer = await User.findById(link.user_id);

    return NextResponse.json({
      referral_code: link.referral_code,
      user_id: String(link.user_id),
      case_id: link.case_id,
      referrer_name: referrer ? `${referrer.first_name} ${referrer.last_name}` : "A CatchMyCash user",
    });
  } catch (error) {
    console.error("GET /api/referral-link error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}