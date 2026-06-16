import sgMail from '@sendgrid/mail';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY is missing');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendEmailTwilio({ to, subject, text, html, replyTo }) {
  const msg = {
    to,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    text,
    html,
  };

  if (replyTo) {
    msg.replyTo = replyTo;
  }

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid Error:', error?.response?.body || error);
    return { success: false, error };
  }
}
