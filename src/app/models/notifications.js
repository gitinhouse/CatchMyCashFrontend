import mongoose from "mongoose";

const userNotificationsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
   status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const UserNotifications =
  mongoose.models.UserNotifications ||
  mongoose.model("UserNotifications", userNotificationsSchema);

export default UserNotifications;
