import mongoose from 'mongoose';

/**
 * Internal notes admins leave on a case. Never shown to the claimant.
 */
const CaseNoteSchema = new mongoose.Schema({
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCases',
    required: true,
    index: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInformation',
    default: null,
  },
  admin_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    required: true,
  },
  admin_email: { type: String, required: true },
  body: { type: String, required: true, trim: true },

  // Lets admins flag a note so it surfaces in the action queue.
  pinned: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

CaseNoteSchema.index({ case_id: 1, createdAt: -1 });

const CaseNote =
  mongoose.models.CaseNote || mongoose.model('CaseNote', CaseNoteSchema);

export default CaseNote;
