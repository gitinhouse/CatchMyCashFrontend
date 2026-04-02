import { google } from 'googleapis';

export async function GET(req: Request) {
  const url = new URL(req.url);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  // ⚠️ In production: validate state from cookie/session
  if (!state) {
    return new Response('Invalid state', { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    'https://catchmycash.com/api/auth/callback',
  );

  const { tokens } = await oauth2Client.getToken(code);

  console.log('TOKENS:', tokens);

  return new Response('✅ Gmail connected successfully');
}
