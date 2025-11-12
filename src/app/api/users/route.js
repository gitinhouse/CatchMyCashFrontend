import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import User from "../../models/UserInformation";
import UserDetails from "../../models/userDetails";
import { Types } from "mongoose";
import { verifyToken } from "../../lib/verifyToken";

export async function POST(req) {
  const { first_name, last_name, address, city, zip_code, state } =
    await req.json();

  await connectToDatabase();

  try {
    const newUser = await User.create({
      first_name,
      last_name,
      address,
      city,
      zip_code,
      state,
    });
    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const user_id = searchParams.get("user_id");

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skipParam = parseInt(searchParams.get("skip"));
    const skip = !isNaN(skipParam) ? skipParam : (page - 1) * limit;

    // 🔹 Build aggregation pipeline
    const pipeline = [];

    // Optional filter by user_id
    if (user_id && Types.ObjectId.isValid(user_id)) {
      pipeline.push({
        $match: { _id: new Types.ObjectId(user_id) },
      });
    }

    // Join user details
    pipeline.push({
      $lookup: {
        from: "userdetails",
        localField: "_id",
        foreignField: "user_id",
        as: "details",
      },
    });
    pipeline.push({ $unwind: { path: "$details", preserveNullAndEmptyArrays: true } });

    // Join user cases
    pipeline.push({
      $lookup: {
        from: "usercases",
        localField: "_id",
        foreignField: "user_id",
        as: "cases",
      },
    });

    // 🔹 Search filter (case-insensitive)
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { first_name: { $regex: search, $options: "i" } },
            { last_name: { $regex: search, $options: "i" } },
            { city: { $regex: search, $options: "i" } },
            { state: { $regex: search, $options: "i" } },
            { "details.email_id": { $regex: search, $options: "i" } },
            { "details.contact_no": { $regex: search, $options: "i" } },
            { "cases.case_id": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // 🔹 Projection (fields you want in response)
    pipeline.push({
      $project: {
        _id: 1,
        first_name: 1,
        last_name: 1,
        address: 1,
        city: 1,
        zip_code: 1,
        state: 1,
        createdAt: 1,
        email_id: "$details.email_id",
        contact_no: "$details.contact_no",
        cases: {
          _id: 1,
          case_id: 1,
          status: 1,
          createdAt: 1,
        },
      },
    });

    // 🔹 Apply pagination (skip + limit)
    pipeline.push({ $skip: skip }, { $limit: limit });

    // 🔹 Get total count for pagination
    const totalRecords = await User.countDocuments(
      search
        ? {
            $or: [
              { first_name: { $regex: search, $options: "i" } },
              { last_name: { $regex: search, $options: "i" } },
              { city: { $regex: search, $options: "i" } },
              { state: { $regex: search, $options: "i" } },
            ],
          }
        : {}
    );

    const results = await User.aggregate(pipeline);

    // 🔹 Build response
    const responseData = {
      total: totalRecords,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      count: results.length,
      data: results,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/case error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
