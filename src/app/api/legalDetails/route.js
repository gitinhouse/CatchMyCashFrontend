import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserDetails from "../../models/userDetails";
import User from "../../models/UserInformation";
import UserCases from "../../models/userCases";
import UserProperty from "../../models/userProperty";
import { generateCaseNumber } from "../../lib/generateCaseNumber";

/**
 * Link the properties in this submission to the case that was just resolved.
 *
 * UserProperty rows are written during property selection, before a case
 * exists, so case_id was left null and the dashboard had to fall back to
 * matching on user_id alone — which attached every property a claimant had
 * ever selected to every one of their cases. Stamping the id here keeps new
 * data unambiguous.
 */
async function linkPropertiesToCase(userCase, userId) {
  const propertyIds = (userCase?.property_ids || []).map(String).filter(Boolean);
  if (!userCase?._id || !userId || propertyIds.length === 0) return;

  try {
    await UserProperty.updateMany(
      {
        user_id: userId,
        property_id: { $in: propertyIds },
        $or: [{ case_id: null }, { case_id: { $exists: false } }],
      },
      { $set: { case_id: userCase._id } },
    );
  } catch (error) {
    // Never fail the submission over a bookkeeping update.
    console.error('Failed to link properties to case:', error.message);
  }
}

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

  // Every claim submission gets its own case with its own case number.
  //
  // This used to reuse the claimant's existing case and $set the new
  // property_ids over the old ones, so a second submission was absorbed into
  // the first case and the dashboard showed a single case holding every
  // property the claimant had ever submitted.
  if (claimSubmission) {
    const case_id = await generateCaseNumber();

    return UserCases.create({
      user_id,
      case_id,
      status: true,
      ...claimFields,
    });
  }

  // No submission payload — this is a partial save or a resubmit of the details
  // step, so attach to the most recent case rather than opening an empty one.
  const existingCase = await UserCases.findOne({ user_id }).sort({
    createdAt: -1,
  });

  if (existingCase) {
    return existingCase;
  }

  const case_id = await generateCaseNumber();

  return UserCases.create({
    user_id,
    case_id,
    status: true,
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

    // NEW: resolve/create the case FIRST, so we can tag UserDetails with case_id
    const userCase = await upsertUserCaseWithClaimSubmission(
      user_id,
      claimSubmission,
    );

    await linkPropertiesToCase(userCase, user_id);

    const newUserDetails = await UserDetails.create({
      user_id,
      case_id: userCase?._id, // NEW
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