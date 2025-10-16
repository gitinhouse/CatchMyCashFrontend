import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserReferral from "../../models/userReferral";
import User from "../../models/UserInformation";


export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, case_id, referral_code, linked_user, comission } = body;

    if (!user_id || !case_id || !referral_code || !linked_user || !comission) {
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

