import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import AllProperty from "../../models/allProperty";

export async function POST(req) {
  try {
    const {
      first_name,
      last_name,
      address,
      city,
      state,
      zip_code,
      page = 1,
      limit = 100,
    } = await req.json();
    const fullName = first_name + " " + last_name;
    await connectToDatabase();
    const query = {
      owner_name: fullName.toUpperCase(),
      owner_street_1: { $regex: address, $options: "i" },
      owner_city: { $regex: city, $options: "i" },
      owner_state: state.toUpperCase(),
      owner_zip: zip_code,
    };

    const totalMatched = await AllProperty.countDocuments(query);

    const matchedProperties = await AllProperty.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(
        "property_id property_type owner_name owner_street_1 owner_city owner_state owner_zip cash_reported shares_reported current_cash_balance"
      );

    return NextResponse.json(
      {
        totalMatched,
        currentPage: page,
        pageSize: limit,
        matchedProperties,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
