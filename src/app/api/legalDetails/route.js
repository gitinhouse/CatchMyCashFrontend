import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserDetails from "../../models/userDetails";
import User from "../../models/UserInformation";
import UserCases from "../../models/userCases";
import { generateCaseNumber } from "../../lib/generateCaseNumber";

async function upsertUserCaseWithClaimSubmission(user_id, claimSubmission) {
  const claimFields = claimSubmission
    ? {
        claim_process_task_id:
          claimSubmission.task_id ||
          claimSubmission.taskId ||
          claimSubmission.claim_process_task_id ||
          '',
        property_ids: claimSubmission.property_ids || [],
        claim_process_task_status:
          claimSubmission.status ||
          claimSubmission.task_status ||
          claimSubmission.claim_process_task_status ||
          '',
        poll_url: claimSubmission.poll_url || '',
        submitted_at: claimSubmission.submitted_at
          ? new Date(claimSubmission.submitted_at)
          : undefined,
        claim_status: 'Pending',
      }
    : {};

  const existingCase = await UserCases.findOne({ user_id });

  if (existingCase) {
    if (claimSubmission) {
      return UserCases.findOneAndUpdate(
        { user_id },
        { $set: claimFields },
        { new: true },
      );
    }
    return existingCase;
  }

  const case_id = await generateCaseNumber();

  return UserCases.create({
    user_id,
    case_id,
    status: true,
    ...claimFields,
  });
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      user_id,
      legal_name,
      date_of_birth,
      email_id,
      contact_no,
      ssn_id,
      company_name,
      address,
      city,
      zip_code,
      state,
      formal_employer,
      previous_address,
      claimSubmission,
    } = body;

    if (
      !user_id ||
      !legal_name ||
      !date_of_birth ||
      !email_id ||
      !contact_no ||
      !ssn_id ||
      !address ||
      !city ||
      !zip_code ||
      !state
    ) {
      return NextResponse.json(
        { error: "All required fields must be provided" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json(
        { error: "User not found with provided user_id" },
        { status: 404 }
      );
    }

    const newUserDetails = await UserDetails.create({
      user_id,
      legal_name,
      date_of_birth,
      email_id,
      contact_no,
      ssn_id,
      company_name: company_name || '',
      address,
      city,
      zip_code,
      state,
      formal_employer: formal_employer || "",
      previous_address: previous_address || "",
    });

    const userCase = await upsertUserCaseWithClaimSubmission(
      user_id,
      claimSubmission,
    );

    return NextResponse.json(
      { ...newUserDetails.toObject(), userCase },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/details error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const user_id = searchParams.get("user_id");

    if (user_id) {
      const user_details = await UserDetails.findById(user_id).populate("user_id", "first_name last_name email");
      if (!user_details) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      return NextResponse.json(user_details);
    } else {
      const allProperties = await UserDetails.find({}).populate("user_id", "first_name last_name email");
      return NextResponse.json(allProperties);
    }
  } catch (error) {
    console.error("GET /api/details error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}