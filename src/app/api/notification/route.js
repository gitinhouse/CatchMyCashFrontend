import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserNotifications from "../../models/notifications";
import { createNotification } from "../../lib/createNotification";

export async function POST(req) {
  try {
    const { userId, title, message } = await req.json();
    const result = await createNotification(userId, title, message);

    if (!result.success) {
      return NextResponse.json({ message: result.error }, { status: 500 });
    }

    return NextResponse.json(
      {
        message: "Notification created successfully",
        notification: result.notification,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}

export async function GET(request, { params }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }
    const notifications = await UserNotifications.find({
      user_id: userId,
      status: false,
    }).sort({ createdAt: -1 });

    return Response.json({ success: true, data: notifications });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const _id = searchParams.get("id");

    const updatedNotification = await UserNotifications.findByIdAndUpdate(
      _id,
      { status: true },
      { new: true }
    );

    if (!updatedNotification) {
      return Response.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updatedNotification });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
