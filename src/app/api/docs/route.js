import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import userDocs from "../../models/userDocs";
import User from "../../models/UserInformation";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id,case_id, proof_id, ssn_id, adress_proof, signed_doc } = body;

    if (!user_id || !case_id || !proof_id || !ssn_id || !adress_proof || !signed_doc) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    await connectToDatabase();

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json({ error: "User not found with provided user_id" }, { status: 404 });
    }

    const newDocs = await userDocs.create({
      user_id,
      case_id,
      proof_id,
      ssn_id,
      adress_proof,
      signed_doc,
    });

    return NextResponse.json(newDocs, { status: 201 });
  } catch (error) {
    console.error("POST /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get("case_id");

    if (case_id) {
      const caseDocs = await userDocs.findById(case_id).populate("user_id", "first_name last_name email");
      if (!caseDocs) {
        return NextResponse.json({ error: "Docs not found" }, { status: 404 });
      }
      return NextResponse.json(caseDocs);
    } else {
      const allProperties = await userDocs.find({}).populate("user_id", "first_name last_name email");
      return NextResponse.json(allProperties);
    }
  } catch (error) {
    console.error("GET /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}