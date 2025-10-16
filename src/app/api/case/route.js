import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserCases from "../../models/userCases";
import User from "../../models/UserInformation";

async function generateCaseNumber() {
  const year = new Date().getFullYear();
  let unique = false;
  let caseNumber;

  while (!unique) {
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    caseNumber = `CM-${year}-${randomNum}`;
    const exists = await UserCases.findOne({ case_id: caseNumber });
    if (!exists) unique = true;
  }

  return caseNumber;
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    await connectToDatabase();
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json({ error: "User not found with provided user_id" }, { status: 404 });
    }

    const case_id = await generateCaseNumber();

    const newCase = await UserCases.create({
      user_id,
      case_id,
      status: true, 
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("POST /api/userCases error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get("case_id");

    if (case_id) {
      const caseRecord = await UserCases.findById(case_id).populate("user_id", "first_name last_name email");
      if (!caseRecord) {
        return NextResponse.json({ error: "Case not found" }, { status: 404 });
      }
      return NextResponse.json(caseRecord);
    } else {
      const allProperties = await UserCases.find({}).populate("user_id", "first_name last_name email");
      return NextResponse.json(allProperties);
    }
  } catch (error) {
    console.error("GET /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
