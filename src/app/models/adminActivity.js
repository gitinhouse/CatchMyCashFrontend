import mongoose from 'mongoose';

/**
 * Immutable audit trail of every action an admin performs from the admin panel.
 * Nothing in here is ever edited — corrections are appended as new entries.
 */
const AdminActivitySchema = new mongoose.Schema({
  // The UserLogin document of the admin who performed the action.
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    required: true,
  },
  admin_email: { type: String, required: true },

  action: {
    type: String,
    required: true,
    enum: [
      'case_status_updated',
      'claim_status_updated',
      'claim_id_updated',
      'claim_stage_updated',
      'case_fields_updated',
      'retry_reset',
      'retry_flag_updated',
      'note_added',
      'note_deleted',
      'user_updated',
      'user_role_updated',
      'notification_sent',
      'document_reviewed',
    ],
    index: true,
  },

  // Human readable one-line summary rendered in the activity feed.
  summary: { type: String, default: '' },

  // Optional targets — an action may relate to a case, a user, or both.
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCases',
    default: null,
    index: true,
  },
  case_number: { type: String, default: null },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInformation',
    default: null,
    index: true,
  },

  // Field level before/after snapshot: { field: { from, to } }
  changes: { type: mongoose.Schema.Types.Mixed, default: {} },

  createdAt: { type: Date, default: Date.now, index: true },
});

AdminActivitySchema.index({ createdAt: -1 });

const AdminActivity =
  mongoose.models.AdminActivity ||
  mongoose.model('AdminActivity', AdminActivitySchema);

export default AdminActivity;
