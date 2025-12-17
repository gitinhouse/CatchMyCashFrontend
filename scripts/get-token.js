import { google } from "googleapis";
import open from "open";
import http from "http";
import url from "url";

const PORT = 7072;// process.env.PORT;

const CLIENT_ID = "847758914700-pld8glluvgna8pd1qi3nsd3labahghpr.apps.googleusercontent.com"; //process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = "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"; //process.env.GOOGLE_CLIENT_SECRET;

// Redirect URI must match Google Console
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

async function getToken() {
  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
  );

  // Generate login URL
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", 
    scope: SCOPES,
  });

  console.log("Opening browser for Google login...");
  await open(authUrl);

  // Local server for redirect callback
  const server = http.createServer(async (req, res) => {
    if (req.url.startsWith("/oauth2callback")) {
      const qs = new url.URL(req.url, `http://localhost:${PORT}`).searchParams;
      const code = qs.get("code");

      res.end("Authentication successful! You may close this window.");
      server.close();

      // Exchange code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      console.log("\n===== FULL TOKEN RESPONSE =====");
      console.log(tokens);
    }
  });

  server.listen(PORT, () => {
    console.log(`Waiting for Google OAuth redirect on http://localhost:${PORT}...`);
  });
}

getToken();
