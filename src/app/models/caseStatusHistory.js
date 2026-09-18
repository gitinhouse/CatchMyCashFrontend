import mongoose from 'mongoose';

/**
 * An append-only record of every admin status change on a case.
 *
 * Both the admin console and the claimant's tracking page read from this, so
 * each row carries enough context to be rendered on its own without needing
 * the case document: the case and claim numbers as they were at the time, who
 * changed it, and what it moved from.
 */
const CaseStatusHistorySchema = new mongoose.Schema({
  case_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserCases',
    required: true,
    index: true,
  },
  // Human-facing case number (CM-YYYY-NNNNNN), denormalised so history stays
  // readable even if the case document changes.
  case_number: { type: String, default: null },
  claim_id: { type: String, default: null },

  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserInformation',
    required: true,
    index: true,
  },

  status: { type: String, required: true },
  previous_status: { type: String, default: null },

  // Shown to the claimant on their tracking page.
  note: { type: String, default: '' },

  updated_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserLogin',
    default: null,
  },
  updated_by_email: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now, index: true },
});

CaseStatusHistorySchema.index({ case_id: 1, createdAt: -1 });

const CaseStatusHistory =
  mongoose.models.CaseStatusHistory ||
  mongoose.model('CaseStatusHistory', CaseStatusHistorySchema);

export default CaseStatusHistory;
