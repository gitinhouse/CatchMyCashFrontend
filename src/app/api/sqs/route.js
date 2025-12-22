import { NextResponse } from "next/server";
import { sendClaimToSQS } from "../../lib/sqsService";

export async function POST(req) {
  try {
    const payload = await req.json();

    // ✅ Correct validation
    if (
      !payload?.userId ||
      !Array.isArray(payload?.propertyId) ||
      payload.propertyId.length === 0 ||
      !payload?.formData?.email
    ) {
      return NextResponse.json(
        { error: "Invalid SQS payload" },
        { status: 400 }
      );
    }

    await sendClaimToSQS(payload);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("SQS send failed:", error);
    return NextResponse.json(
      { error: "Failed to queue claim" },
      { status: 500 }
    );
  }
}
