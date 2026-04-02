import { google } from 'googleapis';
import crypto from 'crypto';

export async function GET() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const state = crypto.randomBytes(32).toString('hex');

  // ⚠️ For now: store in cookie (Next.js way)
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: ['https://www.googleapis.com/auth/gmail.modify'],
    state: state,
  });

  return Response.redirect(authUrl);
}
