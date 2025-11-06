import mongoose from "mongoose";

const UserReferralSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: { type: String, required: true },
  referral_code: { type: String, required: true },
  linked_user: { type: String, required: true },
  comission: { type: Number, required: true },
  status: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const UserReferral =
  mongoose.models.UserReferral ||
  mongoose.model("UserReferral", UserReferralSchema);

export default UserReferral;
