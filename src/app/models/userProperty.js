import mongoose from "mongoose";

const UserPropertySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserCases",
    required: false,
  },
  property_id: { type: String, required: true },
  property_type: { type: String, required: true },
  property_title: { type: String, required: true },
  amount: { type: Number, required: true },
  reported_date: { type: String, required: true },
  status: { type: Boolean, default: false },
  is_claimed: { type: Boolean, default: false }, 
  createdAt: { type: Date, default: Date.now },
});

const UserProperty =
  mongoose.models.UserProperty ||
  mongoose.model("UserProperty", UserPropertySchema);

export default UserProperty;
