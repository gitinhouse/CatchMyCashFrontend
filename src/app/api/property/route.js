import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserProperty from "../../models/userProperty";
import User from "../../models/UserInformation";

export async function POST(req) {
  try {
   
    const { user_id, properties } = await req.json();

    if (!user_id || !properties || !properties.length) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    await connectToDatabase();

    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json({ error: "User not found with provided user_id" }, { status: 404 });
    }

    const userProperties = properties.map((p) => ({
      user_id,
      property_id: p.id.toString(),
      property_type: p.type,
      property_title: p.type, 
      amount: parseFloat(p.amount || 0),
      reported_date: p.reportDate,
      status: false,
    }));

    await UserProperty.insertMany(userProperties);

    return NextResponse.json({ message: "User properties saved successfully" }, { status: 201 });

    return NextResponse.json(newProperty, { status: 201 });
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
      const property = await UserProperty.findById(property_id).populate("user_id", "first_name last_name email");
      if (!property) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
      return NextResponse.json(property);
    } else {
      const allProperties = await UserProperty.find({}).populate("user_id", "first_name last_name email");
      return NextResponse.json(allProperties);
    }
  } catch (error) {
    console.error("GET /api/property error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
