import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import User from "../../models/UserInformation";
import UserProperty from "../../models/userProperty";

export async function GET(req) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const timeFilter = searchParams.get("timeFilter") || "all-time";

    const skip = (page - 1) * limit;

    // Date filter setup
    let dateFilter = {};
    const now = new Date();

    if (timeFilter === "this-week") {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      dateFilter = { createdAt: { $gte: startOfWeek } };
    } else if (timeFilter === "this-month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: startOfMonth } };
    }

    // Aggregate query with date filter + active properties
    const usersWithProperties = await User.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "userproperties",
          localField: "_id",
          foreignField: "user_id",
          as: "properties",
          // pipeline: [
          //   { $match: { status: true } } // ✅ Only include active/true properties
          // ]
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);

    // Total users (for pagination)
    const totalUsers = await User.countDocuments(dateFilter);

    // Total recovered (from *all* matching users)
    const totalRecoveredResult = await User.aggregate([
      { $match: dateFilter },
      {
        $lookup: {
          from: "userproperties",
          localField: "_id",
          foreignField: "user_id",
          as: "properties",
          // pipeline: [
          //   { $match: { status: true } }
          // ]
        },
      },
      { $unwind: "$properties" },
      {
        $group: {
          _id: null,
          totalRecovered: { $sum: "$properties.amount" },
        },
      },
    ]);

    const totalRecovered =
      totalRecoveredResult.length > 0
        ? totalRecoveredResult[0].totalRecovered
        : 0;

    return NextResponse.json(
      {
        data: usersWithProperties,
        totalUsers,
        totalRecovered,
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching users with properties:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
