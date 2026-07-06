import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserCases from "../../models/userCases";
import User from "../../models/UserInformation";
import { Types } from "mongoose";
import { verifyToken } from "../../lib/verifyToken";
import { generateCaseNumber } from "../../lib/generateCaseNumber";

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, property_ids } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const normalizedPropertyIds = Array.isArray(property_ids)
      ? property_ids.map(String).filter(Boolean)
      : [];

    await connectToDatabase();
    const userExists = await User.findById(user_id);
    if (!userExists) {
      return NextResponse.json(
        { error: "User not found with provided user_id" },
        { status: 404 }
      );
    }

    const existingCase = await UserCases.findOne({ user_id });
    if (existingCase) {
      if (normalizedPropertyIds.length > 0) {
        const updatedCase = await UserCases.findOneAndUpdate(
          { user_id },
          { $set: { property_ids: normalizedPropertyIds } },
          { new: true }
        );
        return NextResponse.json(updatedCase, { status: 200 });
      }

      return NextResponse.json(existingCase, { status: 200 });
    }

    const case_id = await generateCaseNumber();

    const newCase = await UserCases.create({
      user_id,
      case_id,
      status: true,
      ...(normalizedPropertyIds.length > 0 && {
        property_ids: normalizedPropertyIds,
      }),
    });

    return NextResponse.json(newCase, { status: 201 });
  } catch (error) {
    console.error("POST /api/userCases error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    // 🔹 Verify JWT
    let user;
    try {
      user = verifyToken(req);
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const case_id = searchParams.get("case_id");
    const search = searchParams.get("search");

    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const skipParam = parseInt(searchParams.get("skip"));
    const skip = !isNaN(skipParam) ? skipParam : (page - 1) * limit;

    if (case_id && !Types.ObjectId.isValid(case_id)) {
      return NextResponse.json(
        { error: "Invalid case_id format" },
        { status: 400 }
      );
    }

    const pipeline = [];

    // 🔹 Filter by specific case ID
    if (case_id) {
      pipeline.push({
        $match: { _id: new Types.ObjectId(case_id) },
      });
    }

    if (search && !case_id) {
      pipeline.push(
        {
          $lookup: {
            from: "userinformations",
            localField: "user_id",
            foreignField: "_id",
            as: "user_info",
          },
        },
        { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "userdetails",
            localField: "user_id",
            foreignField: "user_id",
            as: "user_details",
          },
        },
        {
          $match: {
            $or: [
              { case_id: { $regex: search, $options: "i" } },
              { "user_info.email": { $regex: search, $options: "i" } },
              { "user_details.email_id": { $regex: search, $options: "i" } },
              { "user_info.first_name": { $regex: search, $options: "i" } },
              { "user_info.last_name": { $regex: search, $options: "i" } },
              {
                $expr: {
                  $regexMatch: {
                    input: { $concat: ["$user_info.first_name", " ", "$user_info.last_name"] },
                    regex: search,
                    options: "i",
                  },
                },
              },
            ],
          },
        }
      );
    }

    // 🔹 Join related collections
    pipeline.push(
      {
        $lookup: {
          from: "userinformations",
          localField: "user_id",
          foreignField: "_id",
          as: "user_info",
        },
      },
      { $unwind: { path: "$user_info", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "userdetails",
          localField: "user_id",
          foreignField: "user_id",
          as: "user_details",
        },
      },
      {
        $lookup: {
          from: "userdocs",
          localField: "user_id",
          foreignField: "user_id",
          as: "user_docs",
        },
      },
      {
        $lookup: {
          from: "userproperties",
          localField: "user_id",
          foreignField: "user_id",
          as: "user_properties",
        },
      },
      {
        $project: {
          _id: 1,
          case_id: 1,
          status: 1,
          createdAt: 1,
          "user_info._id": 1,
          "user_info.first_name": 1,
          "user_info.last_name": 1,
          "user_info.email": 1,
          user_details: 1,
          user_docs: 1,
          user_properties: 1,
        },
      }
    );

    // 🔹 Pagination only for list (not for search/case_id)
    if (!case_id && !search) {
      pipeline.push({ $skip: skip }, { $limit: limit });
    }

    let totalRecords = 0;
    if (!case_id && !search) {
      totalRecords = await UserCases.countDocuments({});
    }

    const results = await UserCases.aggregate(pipeline);

    if ((case_id || search) && results.length === 0) {
      return NextResponse.json(
        { error: "No matching case found" },
        { status: 404 }
      );
    }

    const responseData =
      !case_id && !search
        ? {
            total: totalRecords,
            page,
            limit,
            totalPages: Math.ceil(totalRecords / limit),
            count: results.length,
            data: results,
          }
        : {
            data: results,
          };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("GET /api/case error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
