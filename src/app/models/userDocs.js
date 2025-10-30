import mongoose from "mongoose";

const UserDocsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserInformation",
    required: true,
  },
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "UserCases",
    required: true,
  },
  proof_id: { type: String, required: false },
  ssn_id: { type: String, required: false },
  adress_proof: { type: String, required: false },
  brith_proof: { type: String, required: false },
  employee_proof: { type: String, required: false },
  signed_doc: { type: String, required: true },
  claim_doc: { type: String, required: false },
  createdAt: { type: Date, default: Date.now },
});

const UserDocs =
  mongoose.models.UserDocs || mongoose.model("UserDocs", UserDocsSchema);

export default UserDocs;
