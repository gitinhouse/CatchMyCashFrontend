import mongoose from 'mongoose';

const UserDocsSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInformation',
    required: true,
  },
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCases',
    required: true,
  },
  proof_id: { type: String, required: false },
  ssn_id: { type: String, required: false },
  adress_proof: { type: String, required: false },
  brith_proof: { type: String, required: false },
  employee_proof: { type: String, required: false },
  signed_doc: { type: String, required: true },
  claim_doc: { type: String, required: false },
  agreement_doc: { type: String, required: false },
  filled_agreement_doc: { type: String, required: false },
  // When the claimant was told their agreement is ready. The agreement itself
  // is written by the automation server, so this app notices it afterwards;
  // stamping the moment the notice goes out is what stops every later check
  // from sending the same email again.
  agreement_ready_notified_at: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const UserDocs =
  mongoose.models.UserDocs || mongoose.model('UserDocs', UserDocsSchema);

export default UserDocs;
