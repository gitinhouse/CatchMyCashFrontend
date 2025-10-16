import mongoose from "mongoose";

const UserCasesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: { type: String, required: true },
  status: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const UserCases =
  mongoose.models.UserCases || mongoose.model("UserCases", UserCasesSchema);

export default UserCases;
