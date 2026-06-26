import mongoose from 'mongoose';

const UserCasesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInformation',
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
  claim_process_task_id: { type: String, index: true },
  claim_process_task_status: { type: String },
  claim_process_message: { type: String, default: '' },
  document_upload_task_id: { type: String, index: true },
  document_upload_task_status: { type: String },
  document_upload_message: { type: String, default: '' },
  claim_process_stage: { type: Number },
  property_ids: [{ type: String }],
  task_status: { type: String },
  poll_url: { type: String },
  submitted_at: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const UserCases =
  mongoose.models.UserCases || mongoose.model('UserCases', UserCasesSchema);

export default UserCases;
