import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserDetails from "../../models/userDetails";
import User from "../../models/UserInformation";
import UserCases from "../../models/userCases";
import UserProperty from "../../models/userProperty";
import { generateCaseNumber } from "../../lib/generateCaseNumber";
import { sendEmailTwilio } from "../../lib/sendgrid";
import { createNotification } from "../../lib/createNotification.js";
import UserLogin from "../../models/userLogin";
import {
  normalizeEmail,
  readVerifiedEmailToken,
} from "../../lib/emailVerification";

/**
 * Confirm a submission to the claimant.
 *
 * Nothing was sent on submission before: the only mail in this flow was the
 * welcome mail from /api/register, which no longer fires once the claimant has
 * an account — so a second claim confirmed nothing at all. The Case ID is the
 * headline because that is what Track Your Claim asks for.
 */
async function sendClaimSubmittedEmail({ userCase, email, legalName, propertyCount }) {
  if (!email) {
    console.error('[legalDetails] no email on file, submission not confirmed', {
      case_id: userCase?.case_id,
    });
    return;
  }

  const caseId = userCase?.case_id || '';
  const subject = `We received your claim - ${caseId}`;
  const text =
    `Hi ${legalName || 'there'},\n\n` +
    `We have received your claim and it is being processed.\n\n` +
    `Case ID: ${caseId}\n` +
    `Properties in this claim: ${propertyCount}\n\n` +
    `Track your claim at https://catchmycash.com using your Case ID.\n\n` +
    `The CatchMyCash Team`;

  const html = `
    <p>Hi ${legalName || 'there'},</p>
    <p>We have received your claim and it is being processed. We will email you as its status changes.</p>
    <table style="width:100%; border-collapse:collapse; margin-top:16px;">
      <tr>
        <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Case ID:</strong></td>
        <td style="padding:10px; border:1px solid #eaeaea; font-family:monospace;">${caseId}</td>
      </tr>
      <tr>
        <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Properties:</strong></td>
        <td style="padding:10px; border:1px solid #eaeaea;">${propertyCount}</td>
      </tr>
    </table>
    <p style="margin-top:20px;">
      Keep your Case ID — you can track progress any time from the
      <a href="https://catchmycash.com" style="color:#E1261C; font-weight:bold;">Track Your Claim</a>
      section.
    </p>
    <p style="margin-top:20px; color:#4A4A4A;">The CatchMyCash Team</p>
  `;

  const result = await sendEmailTwilio({ to: email, subject, text, html });
  console.log('[legalDetails] claim confirmation email', {
    case_id: caseId,
    to: email,
    success: result?.success === true,
    reason: result?.reason || null,
  });
}

/**
 * Link the properties in this submission to the case that was just resolved.
 *
 * UserProperty rows are written during property selection, before a case
 * exists, so case_id was left null and the dashboard had to fall back to
 * matching on user_id alone — which attached every property a claimant had
 * ever selected to every one of their cases. Stamping the id here keeps new
 * data unambiguous.
 */
/**
 * Pull the per-property claim numbers out of a claim-submission response.
 *
 * The processor files one claim per property and returns a `results` array, but
 * only a single claim_id was ever stored on the case — so every property in a
 * case rendered with that same number. Key casing has varied between processor
 * versions, so accept the variants the webhook route already handles, and fall
 * back to the "Claim <n> filed" wording the document-upload route parses.
 *
 * @returns {Map<string, string>} property_id -> claim_id
 */
function extractPropertyClaimIds(claimSubmission) {
  const map = new Map();
  const results = Array.isArray(claimSubmission?.results)
    ? claimSubmission.results
    : [];

  for (const entry of results) {
    if (!entry || typeof entry !== 'object') continue;

    const propertyId = String(
      entry.property_id ?? entry.propertyId ?? entry.PropertyId ?? '',
    ).trim();
    if (!propertyId) continue;

    let claimId = String(
      entry.claim_id ?? entry.claimId ?? entry.ClaimId ?? '',
    ).trim();

    if (!claimId) {
      const match = String(entry.message || '').match(/Claim\s+(\d+)\s+filed/i);
      if (match) claimId = match[1];
    }

    if (claimId) map.set(propertyId, claimId);
  }

  return map;
}

async function linkPropertiesToCase(userCase, userId, claimSubmission) {
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

    // Stamp each property with its own claim number where the processor
    // reported one.
    const claimIds = extractPropertyClaimIds(claimSubmission);
    console.log(
      `[legalDetails] case ${userCase.case_id}: ${claimIds.size}/${propertyIds.length} properties have a per-property claim id`,
    );

    for (const [propertyId, claimId] of claimIds) {
      if (!propertyIds.includes(propertyId)) continue;
      await UserProperty.updateOne(
        { user_id: userId, property_id: propertyId, case_id: userCase._id },
        { $set: { claim_id: claimId } },
      );
    }
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

    // The claim confirmation, the agreement and every later update go to this
    // address, so it has to be the one the claimant proved they own — the
    // account's own address, or one just verified by emailed code. Checking it
    // here as well as at registration means the address cannot be swapped on
    // the way to filing.
    const claimEmail = normalizeEmail(email_id);
    const account = await UserLogin.findOne({ user_id })
      .select("userEmail")
      .lean();

    if (account) {
      if (normalizeEmail(account.userEmail) !== claimEmail) {
        console.warn("[legalDetails] rejected claim email", {
          user_id: String(user_id),
          account_email: account.userEmail,
        });
        return NextResponse.json(
          {
            error:
              "This claim must be filed under your verified email address.",
            email_verification_required: true,
          },
          { status: 403 }
        );
      }
    } else {
      // No account bound to this search yet, so the only thing that can vouch
      // for the address is a verification issued in this session.
      const proof = readVerifiedEmailToken(
        body?.verification_token || body?.verificationToken
      );
      if (!proof.valid || proof.email !== claimEmail) {
        return NextResponse.json(
          {
            error:
              "Please verify your email address before submitting your claim.",
            email_verification_required: true,
          },
          { status: 403 }
        );
      }
    }

    // NEW: resolve/create the case FIRST, so we can tag UserDetails with case_id
    const userCase = await upsertUserCaseWithClaimSubmission(
      user_id,
      claimSubmission,
    );

    await linkPropertiesToCase(userCase, user_id, claimSubmission);

    // Confirm the submission. Never let a mail or notification problem fail
    // the claim itself.
    if (claimSubmission) {
      try {
        await sendClaimSubmittedEmail({
          userCase,
          email: email_id,
          legalName: legal_name,
          propertyCount: (userCase?.property_ids || []).length,
        });
      } catch (mailError) {
        console.error(
          '[legalDetails] claim confirmation email threw:',
          mailError.message,
        );
      }

      try {
        await createNotification(
          user_id,
          'Claim submitted',
          `Your claim ${userCase?.case_id || ''} has been submitted and is being processed.`,
        );
      } catch (notifyError) {
        console.error(
          '[legalDetails] claim notification failed:',
          notifyError.message,
        );
      }
    }

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