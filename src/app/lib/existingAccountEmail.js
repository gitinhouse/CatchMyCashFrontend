import { sendEmailTwilio } from './sendgrid.js';

const LOG_PREFIX = '[existing-account]';

/**
 * How long one address has to wait before this mail can be sent to it again.
 *
 * The mail goes out to addresses nobody has proved they own — that is the
 * whole point of it, since the person asking may not be the account holder —
 * so without a limit the endpoint would be a way to post mail to a stranger
 * repeatedly. A quarter of an hour is far longer than any honest retry and far
 * shorter than a claimant would notice.
 */
const COOLDOWN_MS = 15 * 60 * 1000;

// Deliberately in memory rather than on the account record: telling somebody
// their account exists must not write to the account. Losing the timestamps on
// a restart costs one extra email at worst.
const lastSentAt = new Map();
const MAX_TRACKED = 5000;

/**
 * Tell somebody the address they are trying to claim under already has an
 * account, and how to get back into it.
 *
 * Nothing is stored. The mail carries no password and no link that acts on the
 * account, so it is safe to send to an address that has not been proved: the
 * worst it can tell a stranger is what the login page tells them anyway.
 *
 * @param {string} email
 * @returns {Promise<{sent: boolean, reason?: string}>}
 */
export async function sendExistingAccountEmail(email) {
  const to = typeof email === 'string' ? email.trim().toLowerCase() : '';

  if (!to) return { sent: false, reason: 'missing_email' };

  const previous = lastSentAt.get(to);
  if (previous && Date.now() - previous < COOLDOWN_MS) {
    console.log(`${LOG_PREFIX} skipped, sent recently`, { to });
    return { sent: false, reason: 'cooldown' };
  }

  // Claim the slot before sending, so two requests arriving together cannot
  // both get through.
  rememberSend(to);

  const loginUrl = `${appBaseUrl()}/userLogin`;

  const result = await send(to, loginUrl);

  console.log(`${LOG_PREFIX} account exists email`, {
    to,
    sent: result?.success === true,
    reason: result?.reason || null,
  });

  if (!result?.success) {
    // Nobody was told, so nothing should be held back from telling them again.
    lastSentAt.delete(to);
  }

  return { sent: result?.success === true, reason: result?.reason };
}

/**
 * The mail itself. Kept apart so that a failure of any kind — a send that is
 * rejected, a mail client that throws — leaves the caller's own answer alone:
 * this mail is a courtesy, and the request it rides along with has its own
 * result to report.
 */
async function send(to, loginUrl) {
  try {
    return await sendEmailTwilio({
      to,
      subject: 'Your CatchMyCash Account',
      text:
        `Hi there,\n\n` +
        `You already have a CatchMyCash account under ${to}.\n\n` +
        `Log in at ${loginUrl}\n\n` +
        `Your login details were emailed to you when the account was created. ` +
        `If you no longer have them, use "Forgot Password" on the login page to ` +
        `set a new password.\n\n` +
        `The CatchMyCash Team`,
      html: `
        <p>Hi there,</p>
        <p>You already have a CatchMyCash account under <strong>${to}</strong>.</p>
        <p style="margin-top:20px;">
          <a href="${loginUrl}"
             style="color:#E1261C; text-decoration:none; font-weight:bold;">
            Login to CatchMyCash
          </a>
        </p>
        <p style="margin-top:10px; color:#4A4A4A; font-size:13px;">
          Your login details were emailed to you when the account was created.
          If you no longer have them, use &ldquo;Forgot Password&rdquo; on the
          login page to set a new one.
        </p>
        <p style="margin-top:20px; color:#4A4A4A;">The CatchMyCash Team</p>
      `,
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} send threw`, error.message);
    return { success: false, reason: 'error' };
  }
}

function rememberSend(to) {
  // Bounded, because the keys are addresses anybody can invent. The oldest
  // entries go first; the worst that costs is an earlier retry for whoever is
  // dropped.
  if (lastSentAt.size >= MAX_TRACKED) {
    const oldest = lastSentAt.keys().next().value;
    if (oldest !== undefined) lastSentAt.delete(oldest);
  }
  lastSentAt.delete(to);
  lastSentAt.set(to, Date.now());
}

/** Test seam: forget every cooldown. */
export function resetExistingAccountCooldowns() {
  lastSentAt.clear();
}

function appBaseUrl() {
  const configured =
    process.env.APP_BASE_URL ||
    process.env.BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    'https://catchmycash.com';
  return configured.replace(/\/$/, '');
}
