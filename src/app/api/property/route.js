import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProperty from "../../models/userProperty";
import User from "../../models/UserInformation";
import UserCases from "../../models/userCases";
import { deriveClaimFailure } from "../../lib/claimLifecycle";

export async function POST(req) {
  try {
    const { user_id, properties } = await req.json();

    // NB: this guard must come first — a debug log here previously read
    // properties.length before the check and turned a malformed request into
    // a 500 instead of a 400.
    if (!user_id || !Array.isArray(properties) || properties.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
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

    const propertyIds = properties.map((p) => p.id.toString());
    const existingProperties = await UserProperty.find({
      user_id,
      property_id: { $in: propertyIds },
    }).select("property_id case_id");

    // A property the claimant already holds is normally left alone. But when
    // its previous claim failed, the row is still stamped with that failed
    // case, and linkPropertiesToCase only fills in empty case_ids — so a retry
    // would silently stay attached to the old case and never appear under the
    // new one. Release those rows so the retry can claim them.
    const stampedCaseIds = existingProperties
      .map((p) => p.case_id)
      .filter(Boolean);

    if (stampedCaseIds.length > 0) {
      const relatedCases = await UserCases.find({ _id: { $in: stampedCaseIds } })
        .select(
          "_id claim_status status claim_process_task_status document_upload_task_status",
        )
        .lean();

      const failedCaseIds = relatedCases
        .filter((kase) => deriveClaimFailure(kase).failed)
        .map((kase) => String(kase._id));

      if (failedCaseIds.length > 0) {
        await UserProperty.updateMany(
          {
            user_id,
            property_id: { $in: propertyIds },
            case_id: { $in: failedCaseIds },
          },
          { $set: { case_id: null, is_claimed: false, status: false } },
        );
      }
    }

    const existingPropertyIds = existingProperties.map((p) => p.property_id);

    const newProperties = properties
      .filter((p) => !existingPropertyIds.includes(p.id.toString()))
      .map((p) => ({
        user_id,
        property_id: p.id.toString(),
        property_type: p.type,
        property_title: p.type,
        amount: parseFloat(p.amount || 0),
        reported_date: p.reportDate,
        status: false,
      }));

    // if (!newProperties.length) {
    //   return NextResponse.json(
    //     { error: "All properties Claim already exist" },
    //     { status: 400 }
    //   );
    // }

    // ✅ If all properties already exist, just return success (no error)
    if (!newProperties.length) {
      return NextResponse.json(
        {
          message: "All properties already exist",
          insertedCount: 0,
          existingCount: properties.length,
        },
        { status: 200 }
      );
    }

    await UserProperty.insertMany(newProperties);

    return NextResponse.json(
      {
        message: "New properties saved successfully",
        insertedCount: newProperties.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const property_id = searchParams.get("property_id");

    if (property_id) {
      const property = await UserProperty.findById(property_id).populate(
        "user_id",
        "first_name last_name email"
      );
      if (!property) {
        return NextResponse.json(
          { error: "Property not found" },
          { status: 404 }
        );
      }
      return NextResponse.json(property);
    } else {
      const allProperties = await UserProperty.find({}).populate(
        "user_id",
        "first_name last_name email"
      );
      return NextResponse.json(allProperties);
    }
  } catch (error) {
    console.error("GET /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
