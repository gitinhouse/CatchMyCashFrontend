import { NextResponse } from "next/server";
import connectToDatabase from "../../lib/mongodb";
import UserNotifications from "../../models/notifications";
import { createNotification } from "../../lib/createNotification";

// The bell shows this window, plus anything still unread beyond it.
const RECENT_WINDOW_DAYS = 60;

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
    // Validate before connecting, so a malformed request answers 400 instead
    // of surfacing a database error.
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // `status: false` means unread.
    //
    // Three shapes:
    //   scope=recent (default) — the bell: anything from the last 60 days,
    //     plus older items that are still unread, so nothing unread is ever
    //     hidden by age.
    //   scope=all — the full history page.
    //   neither, legacy `all=true` — kept for older callers.
    const scope = searchParams.get("scope");
    const legacyAll = searchParams.get("all") === "true";

    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit"), 10) || 50, 1),
      200
    );

    const cutoff = new Date(Date.now() - RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    let query;
    if (scope === "all") {
      query = { user_id: userId };
    } else if (scope === "recent") {
      query = {
        user_id: userId,
        $or: [{ createdAt: { $gte: cutoff } }, { status: false }],
      };
    } else {
      query = legacyAll
        ? { user_id: userId }
        : { user_id: userId, status: false };
    }

    const [notifications, unreadCount, totalCount] = await Promise.all([
      UserNotifications.find(query).sort({ createdAt: -1 }).limit(limit).lean(),
      UserNotifications.countDocuments({ user_id: userId, status: false }),
      UserNotifications.countDocuments({ user_id: userId }),
    ]);

    return Response.json({
      success: true,
      data: notifications,
      unreadCount,
      totalCount,
      recentWindowDays: RECENT_WINDOW_DAYS,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { searchParams } = new URL(request.url);
    const _id = searchParams.get("id");
    const markAll = searchParams.get("all") === "true";
    const allUserId = searchParams.get("userId");

    // Validate before connecting, so a malformed request answers 400 instead
    // of surfacing a database error.
    if (markAll && !allUserId) {
      return Response.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!markAll && !_id) {
      return Response.json(
        { success: false, error: "Missing notification id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Mark every notification for a user as read in one call, for the bell's
    // "mark all as read" action.
    if (markAll) {
      const userId = allUserId;

      const result = await UserNotifications.updateMany(
        { user_id: userId, status: false },
        { $set: { status: true } }
      );

      return Response.json({
        success: true,
        modified: result?.modifiedCount ?? 0,
      });
    }

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

/**
 * Delete notifications.
 *
 *   ?all=true&userId=   removes every notification for that user
 *   ?id=                removes one
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deleteAll = searchParams.get("all") === "true";
    const userId = searchParams.get("userId");
    const _id = searchParams.get("id");

    // Validate before connecting, so a malformed request answers 400 instead
    // of surfacing a database error.
    if (deleteAll && !userId) {
      return Response.json(
        { success: false, error: "Missing userId" },
        { status: 400 }
      );
    }
    if (!deleteAll && !_id) {
      return Response.json(
        { success: false, error: "Missing notification id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    if (deleteAll) {
      const result = await UserNotifications.deleteMany({ user_id: userId });
      return Response.json({
        success: true,
        deleted: result?.deletedCount ?? 0,
      });
    }

    const removed = await UserNotifications.findByIdAndDelete(_id);
    if (!removed) {
      return Response.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, deleted: 1 });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
