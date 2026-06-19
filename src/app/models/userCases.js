import mongoose from "mongoose";

const UserCasesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: { type: String, required: true },
  status: { type: Boolean, default: true },
  automation_id: { type: String },
  claim_id: { type: String },
  claim_status: {
    type: String,
    enum: ['Success', 'Pending', 'Failed'],
  },
  claim_message: { type: String, default: '' },
  task_id: { type: String },
  property_ids: [{ type: String }],
  task_status: { type: String },
  poll_url: { type: String },
  submitted_at: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const UserCases =
  mongoose.models.UserCases || mongoose.model("UserCases", UserCasesSchema);

export default UserCases;
