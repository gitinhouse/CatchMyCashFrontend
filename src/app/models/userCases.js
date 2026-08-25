import mongoose from "mongoose";

const UserCasesSchema = new mongoose.Schema(
  {
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
      enum: ["Success", "Pending", "Failed"],
    },

    claim_message: { type: String, default: "" },

    claim_process_task_id: { type: String, index: true },
    claim_process_task_status: { type: String },
    claim_process_message: { type: String, default: "" },

    document_upload_task_id: { type: String, index: true },
    document_upload_task_status: { type: String },
    document_upload_message: { type: String, default: "" },

    claim_process_stage: { type: Number },

    property_ids: [{ type: String }],
    poll_url: { type: String },
    submitted_at: { type: Date },
    createdAt: { type: Date, default: Date.now },

    // Claim retry fields
    claim_retry_count: {
      type: Number,
      default: 0,
    },

    claim_max_retries: {
      type: Number,
      default: 3,
    },

    claim_retryable: {
      type: Boolean,
      default: false,
    },

    claim_retry_exhausted: {
      type: Boolean,
      default: false,
    },

    claim_next_retry_at: {
      type: Date,
      default: null,
    },

    claim_last_attempt_at: {
      type: Date,
      default: null,
    },

    claim_error_type: {
      type: String,
      enum: [
        "technical_failure",
        "missing_value",
        "already_claimed",
        "property_not_found",
        "invalid_request",
        "submission_uncertain",
      ],
      default: null,
    },

    claim_error_code: {
      type: String,
      default: null,
    },

    claim_failed_stage: {
      type: String,
      default: null,
    },

    // Document upload retry fields
    document_upload_retry_count: {
      type: Number,
      default: 0,
    },

    document_upload_max_retries: {
      type: Number,
      default: 3,
    },

    document_upload_retryable: {
      type: Boolean,
      default: false,
    },

    document_upload_retry_exhausted: {
      type: Boolean,
      default: false,
    },

    document_upload_next_retry_at: {
      type: Date,
      default: null,
    },

    document_upload_last_attempt_at: {
      type: Date,
      default: null,
    },

    document_upload_error_type: {
      type: String,
      default: null,
    },

    document_upload_error_code: {
      type: String,
      default: null,
    },

    document_upload_failed_stage: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent OverwriteModelError in Next.js hot reload
const UserCases =
  mongoose.models.UserCases ||
  mongoose.model("UserCases", UserCasesSchema);

export default UserCases;