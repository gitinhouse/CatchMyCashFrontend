import mongoose from "mongoose";

/**
 * A one-time code proving somebody can receive mail at an address.
 *
 * Only the hash of the code is stored, so a leaked database row cannot be
 * replayed, and the row carries its own expiry and attempt counter rather than
 * relying on the caller to enforce either.
 */
const EmailVerificationSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true, index: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  verified_at: { type: Date, default: null },
  // Set once the verification has been spent on a registration, so the same
  // code cannot be reused to file under the address a second time.
  consumed_at: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

// Codes are short-lived; let the database clear them out rather than growing a
// collection of dead rows. The TTL runs from the moment the code expires.
EmailVerificationSchema.index({ expires_at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

const EmailVerification =
  mongoose.models.EmailVerification ||
  mongoose.model("EmailVerification", EmailVerificationSchema);

export default EmailVerification;
