import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import User from "../../models/UserInformation";

export async function POST(req) {
  const { first_name, last_name,address, city,zip_code,state } = await req.json();

  await connectToDatabase();

  try {
    const newUser = await User.create({  first_name, last_name, address,city,zip_code,state });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  await connectToDatabase();
  const users = await User.find({});
  return NextResponse.json(users);
}
