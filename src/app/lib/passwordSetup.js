import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmailTwilio } from './sendgrid';

const TOKEN_TTL_MINUTES = 60;

/**
 * A password nobody can use.
 *
 * UserLogin.userPassword is required, but an account created on the claimant's
 * behalf has no password yet — they set one through the emailed link. This
 * fills the field with a hash of high-entropy random bytes that is never
 * transmitted, stored in plain text, or shown to anyone, so the only way into
 * the account is the set-password link or a password reset.
 */
export async function unusablePasswordHash() {
  return bcrypt.hash(crypto.randomBytes(48).toString('hex'), 10);
}

/**
 * Issue a single-use set-password token and email the link.
 *
 * Uses the same token mechanism as the forgot-password flow: only the SHA-256
 * hash is stored, so a leaked database row cannot be replayed.
 *
 * @param {object} account  A UserLogin document (will be saved).
 * @param {object} [options]
 * @param {boolean} [options.isNewAccount] Changes the wording only.
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendPasswordSetupLink(account, options = {}) {
  const { isNewAccount = false } = options;

  if (!account?.userEmail) {
    return { sent: false, reason: 'missing_email' };
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  account.resetPasswordToken = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');
  account.resetPasswordExpires = new Date(
    Date.now() + TOKEN_TTL_MINUTES * 60 * 1000,
  );
  await account.save();

  const link = `https://catchmycash.com/resetPassword?token=${rawToken}&email=${encodeURIComponent(
    account.userEmail,
  )}`;

  const heading = isNewAccount
    ? 'Your CatchMyCash account is ready'
    : 'Set a new CatchMyCash password';
  const intro = isNewAccount
    ? 'Your account has been created. Choose a password to sign in.'
    : 'Use the link below to choose a new password for your account.';

  const result = await sendEmailTwilio({
    to: account.userEmail,
    subject: heading,
    text: `${intro}\n\nSet your password: ${link}\n\nThis link expires in ${TOKEN_TTL_MINUTES} minutes.`,
    html: `
      <p>Hi ${account.userEmail},</p>
      <p>${intro}</p>
      <p style="margin-top:20px;">
        <a href="${link}"
           style="color:#E1261C; text-decoration:none; font-weight:bold;">
          Set Your Password
        </a>
      </p>
      <p style="margin-top:10px; color:#4A4A4A; font-size:13px;">
        This link expires in ${TOKEN_TTL_MINUTES} minutes. If you did not expect
        this email you can safely ignore it.
      </p>
    `,
  });

  console.log('[passwordSetup] set-password link', {
    to: account.userEmail,
    new_account: isNewAccount,
    sent: result?.success === true,
    reason: result?.reason || null,
  });

  return { sent: result?.success === true, reason: result?.reason };
}
