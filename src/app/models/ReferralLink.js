// models/ReferralLink.js
import mongoose from "mongoose";

const ReferralLinkSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: { type: String, required: true },
  referral_code: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const ReferralLink =
  mongoose.models.ReferralLink ||
  mongoose.model("ReferralLink", ReferralLinkSchema);

export default ReferralLink;