import mongoose from "mongoose";

const UserLoginSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
    unique: true,
  },
  userEmail: { type: String, required: true },
  userPassword: { type: String, required: true },
  userType: {
    type: String,
    enum: ["Admin", "User"],
    default: "User",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const UserLogin =
  mongoose.models.UserLogin || mongoose.model("UserLogin", UserLoginSchema);

export default UserLogin;
