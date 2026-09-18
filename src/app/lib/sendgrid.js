import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is missing');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send a transactional email.
 *
 * Failures are returned rather than thrown, so a bad send never aborts a claim
 * submission. That also means callers routinely ignore the result — so a
 * rejection has to be loud in the logs, with SendGrid's own reason, or a
 * missing email looks like nothing happened at all.
 *
 * @returns {Promise<{success: boolean, error?: unknown, reason?: string}>}
 */
export async function sendEmailTwilio({ to, subject, text, html, replyTo }) {
  const from = process.env.SENDGRID_FROM_EMAIL;

  // These two are the usual cause of "the email never arrived": SendGrid
  // rejects any send whose From is missing or not a verified sender.
  if (!from) {
    console.error(
      '[sendgrid] NOT SENT — SENDGRID_FROM_EMAIL is not configured',
      { to, subject },
    );
    return { success: false, reason: 'missing_from_address' };
  }

  if (!to) {
    console.error('[sendgrid] NOT SENT — no recipient address', { subject });
    return { success: false, reason: 'missing_recipient' };
  }

  const msg = { to, from, subject, text, html };
  if (replyTo) {
    msg.replyTo = replyTo;
  }

  try {
    const [response] = await sgMail.send(msg);
    console.log('[sendgrid] sent', {
      to,
      from,
      subject,
      status: response?.statusCode ?? null,
      messageId: response?.headers?.['x-message-id'] ?? null,
    });
    return { success: true };
  } catch (error) {
    // SendGrid puts the actionable reason in response.body.errors, not in
    // error.message — log it or the cause is invisible.
    console.error('[sendgrid] SEND FAILED', {
      to,
      from,
      subject,
      status: error?.code ?? error?.response?.statusCode ?? null,
      errors: error?.response?.body?.errors ?? null,
      message: error?.message,
    });
    return { success: false, error, reason: 'sendgrid_rejected' };
  }
}
