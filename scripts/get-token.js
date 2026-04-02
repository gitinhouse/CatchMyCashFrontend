import { google } from 'googleapis';
import open from 'open';
import http from 'http';
import url from 'url';
import crypto from 'crypto';

const PORT = 7072;

const CLIENT_ID =
  '847758914700-pld8glluvgna8pd1qi3nsd3labahghpr.apps.googleusercontent.com'; //process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = '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'; //process.env.GOOGLE_CLIENT_SECRET;

// Redirect URI must match Google Console
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

async function getToken() {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI,
  );

  // ✅ Generate secure state
  const state = crypto.randomBytes(32).toString('hex');

  // ⚠️ For demo: in-memory storage
  // In production → use session or DB
  let savedState = state;

  // ✅ Generate auth URL WITH state
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
    state: state,
  });

  console.log('Opening browser for Google login...');
  await open(authUrl);

  // ✅ Create local server for OAuth callback
  const server = http.createServer(async (req, res) => {
    if (req.url && req.url.startsWith('/oauth2callback')) {
      try {
        const qs = new url.URL(req.url, `http://localhost:${PORT}`)
          .searchParams;

        const code = qs.get('code');
        const returnedState = qs.get('state');

        // ✅ Validate state
        if (!returnedState || returnedState !== savedState) {
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('❌ Invalid state parameter. Possible CSRF attack.');
          server.close();
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('✅ Authentication successful! You can close this tab.');

        // Exchange code for tokens
        if (!code) {
          throw new Error('Authorization code not found');
        }

        const { tokens } = await oauth2Client.getToken(code);

        console.log('\n===== TOKENS =====');
        console.log(tokens);

        if (tokens.refresh_token) {
          console.log('\n✅ SAVE THIS REFRESH TOKEN SAFELY:\n');
          console.log(tokens.refresh_token);
        } else {
          console.log(
            '\n⚠️ No refresh token received. Try removing old consent.',
          );
        }

        server.close();
      } catch (error) {
        console.error('Error during OAuth callback:', error);
        res.end('Error occurred during authentication.');
        server.close();
      }
    }
  });

  server.listen(PORT, () => {
    console.log(`Waiting for OAuth callback on http://localhost:${PORT}...`);
  });
}

getToken();

// import { google } from 'googleapis';
// import open from 'open';
// import http from 'http';
// import url from 'url';

// const PORT = 7072; // process.env.PORT;

// const CLIENT_ID =
//   '847758914700-pld8glluvgna8pd1qi3nsd3labahghpr.apps.googleusercontent.com'; //process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = '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'; //process.env.GOOGLE_CLIENT_SECRET;

// // const CLIENT_ID =
// //   '385498599272-5kb1892jeg2b55tvf6on9ggqbl60avin.apps.googleusercontent.com'; //process.env.
// // const CLIENT_SECRET = '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'; //process.env.GOOGLE_CLIENT_SECRET;

// // Redirect URI must match Google Console
// const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// async function getToken() {
//   const oauth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_URI,
//   );

//   // Generate login URL
//   const authUrl = oauth2Client.generateAuthUrl({
//     access_type: 'offline',
//     prompt: 'consent',
//     scope: SCOPES,
//   });

//   console.log('Opening browser for Google login...');
//   await open(authUrl);

//   // Local server for redirect callback
//   const server = http.createServer(async (req, res) => {
//     if (req.url.startsWith('/oauth2callback')) {
//       const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
//       const code = qs.get('code');

//       res.end('Authentication successful! You may close this window.');
//       server.close();

//       // Exchange code for tokens
//       const { tokens } = await oauth2Client.getToken(code);

//       console.log('\n===== FULL TOKEN RESPONSE =====');
//       console.log(tokens);
//     }
//   });

//   server.listen(PORT, () => {
//     console.log(
//       `Waiting for Google OAuth redirect on http://localhost:${PORT}...`,
//     );
//   });
// }

// getToken();

// const CLIENT_ID =
//   '847758914700-pld8glluvgna8pd1qi3nsd3labahghpr.apps.googleusercontent.com'; //process.env.GOOGLE_CLIENT_ID;
// const CLIENT_SECRET = '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'; //process.env.GOOGLE_CLIENT_SECRET;
// import { google } from 'googleapis';
// import open from 'open';
// import http from 'http';
// import url from 'url';

// const PORT = 7072;

// const CLIENT_ID =
//   '385498599272-bfnj8vaek7ve889uobe04vtii5anbevg.apps.googleusercontent.com';
// const CLIENT_SECRET = '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';

// const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

// const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

// async function getToken() {
//   const oauth2Client = new google.auth.OAuth2(
//     CLIENT_ID,
//     CLIENT_SECRET,
//     REDIRECT_URI,
//   );

//   // Create server FIRST
//   const server = http.createServer(async (req, res) => {
//     if (req.url.startsWith('/oauth2callback')) {
//       const qs = new url.URL(req.url, REDIRECT_URI).searchParams;
//       const code = qs.get('code');

//       res.writeHead(200, { 'Content-Type': 'text/plain' });
//       res.end('Authentication successful! You may close this window.');

//       server.close();

//       const { tokens } = await oauth2Client.getToken(code);

//       console.log('\n===== FULL TOKEN RESPONSE =====');
//       console.log(tokens);
//     }
//   });

//   server.listen(PORT, async () => {
//     console.log(`Listening for OAuth callback on http://localhost:${PORT}`);

//     // Generate login URL AFTER server is ready
//     const authUrl = oauth2Client.generateAuthUrl({
//       access_type: 'offline',
//       prompt: 'consent',
//       scope: SCOPES,
//     });

//     console.log('Opening browser for Google login...');
//     await open(authUrl);
//   });
// }

// getToken();
