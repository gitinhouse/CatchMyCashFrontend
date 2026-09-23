import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendEmailTwilio } from './sendgrid';

const TOKEN_TTL_MINUTES = 60;

// Deliberately excludes the characters people mistype when copying a password
// out of an email — no O/0, l/1/I — because this one is read by eye.
const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * A password for an account created on the claimant's behalf.
 *
 * Drawn with crypto.randomInt rather than Math.random: this is the only thing
 * standing between a stranger and somebody's claim until they change it.
 *
 * @param {number} [length]
 */
export function generatePassword(length = 12) {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += PASSWORD_ALPHABET[crypto.randomInt(0, PASSWORD_ALPHABET.length)];
  }
  return out;
}

/**
 * Send a claimant the login they did not choose.
 *
 * The account is created for them as part of filing a claim, so they never
 * picked a password — they get one here, with the address it belongs to, and
 * the standing advice to change it.
 *
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendCredentialsEmail(account, password) {
  if (!account?.userEmail) {
    return { sent: false, reason: 'missing_email' };
  }

  const loginUrl = `${appBaseUrl()}/userLogin`;

  const credentialsTable = `
      <table style="width:100%; border-collapse:collapse; margin-top:20px;">
        <tr>
          <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Email:</strong></td>
          <td style="padding:10px; border:1px solid #eaeaea;">${account.userEmail}</td>
        </tr>
        <tr>
          <td style="padding:10px; border:1px solid #eaeaea; background:#f9fafb;"><strong>Password:</strong></td>
          <td style="padding:10px; border:1px solid #eaeaea; font-family:monospace;">${password}</td>
        </tr>
      </table>`;

  const result = await sendEmailTwilio({
    to: account.userEmail,
    subject: 'Welcome to CatchMyCash — Your Login Details',
    text:
      `Welcome to CatchMyCash.\n\n` +
      `Your account has been created so you can track your claim.\n\n` +
      `Email: ${account.userEmail}\n` +
      `Password: ${password}\n\n` +
      `Log in at ${loginUrl}\n\n` +
      `For your security, change this password after you sign in.\n\n` +
      `The CatchMyCash Team`,
    html: `
      <p>Hi ${account.userEmail},</p>
      <p>Welcome aboard! Your account has been created so you can track your claim.</p>
      ${credentialsTable}
      <p style="margin-top:20px;">
        <a href="${loginUrl}"
           style="color:#E1261C; text-decoration:none; font-weight:bold;">
          Login to CatchMyCash
        </a>
      </p>
      <p style="margin-top:10px; color:#4A4A4A; font-size:13px;">
        For your security, please change this password once you have signed in.
        If you ever forget it, use &ldquo;Forgot Password&rdquo; on the login page.
      </p>
      <p style="margin-top:20px; color:#4A4A4A;">The CatchMyCash Team</p>
    `,
  });

  // The password itself is never logged — only whether the mail carrying it
  // got out, which is what anyone debugging this needs to know.
  console.log('[passwordSetup] credentials email', {
    to: account.userEmail,
    sent: result?.success === true,
    reason: result?.reason || null,
  });

  return { sent: result?.success === true, reason: result?.reason };
}

function appBaseUrl() {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://catchmycash.com';
  return configured.replace(/\/$/, '');
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
