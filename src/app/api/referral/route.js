import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserReferral from "../../models/userReferral";
import User from "../../models/UserInformation";


export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, case_id, referral_code, linked_user, comission } = body;

    if (!user_id || !case_id || !referral_code || !linked_user || comission === undefined || comission === null) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    await connectToDatabase();

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json({ error: "User not found with provided user_id" }, { status: 404 });
    }

    const newReferral = await UserReferral.create({
      user_id,
      case_id,
      referral_code,
      linked_user,
      comission,
    });

    return NextResponse.json(newReferral, { status: 201 });
  } catch (error) {
    console.error("POST /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");
    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    await connectToDatabase();

    const referrals = await UserReferral.find({ user_id: userId }).sort({ createdAt: -1 });

    const stats = {
      totalEarnings: referrals.filter(r => r.status).reduce((s, r) => s + r.comission, 0),
      pendingEarnings: referrals.filter(r => !r.status).reduce((s, r) => s + r.comission, 0),
      totalReferrals: referrals.length,
      successfulCases: referrals.filter(r => r.status).length,
    };

    return NextResponse.json({ stats, referrals }, { status: 200 });
  } catch (error) {
    console.error("GET /api/referral error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

