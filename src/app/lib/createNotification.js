import connectToDatabase from "../lib/mongodb";
import UserNotifications from "../models/notifications.js";

export async function createNotification(userId, title, message) {
  try {
    await connectToDatabase();

    const notification = await UserNotifications.create({
      user_id: userId,
      title,
      message,
      status: false,
    });

    return { success: true, notification };
  } catch (error) {
    console.error("Error creating notification:", error);
    return { success: false, error: error.message };
  }
}
