require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function findFirstExistingPath(paths) {
  for (const candidate of paths) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

const CREDENTIALS_CANDIDATES = [
  process.env.GOOGLE_CREDENTIALS_PATH,
  "/etc/secrets/credentials.json",
  path.join(process.cwd(), "credentials.json"),
  path.join(process.cwd(), "etc/secrets/credentials.json"),
  path.join(__dirname, "../etc/secrets/credentials.json"),
];

const TOKEN_CANDIDATES = [
  process.env.GOOGLE_TOKEN_PATH,
  "/etc/secrets/token.json",
  path.join(process.cwd(), "token.json"),
  path.join(process.cwd(), "etc/secrets/token.json"),
  path.join(__dirname, "../etc/secrets/token.json"),
];

const CREDENTIALS_PATH =
  findFirstExistingPath(CREDENTIALS_CANDIDATES) ||
  (process.env.GOOGLE_CREDENTIALS_PATH || "/etc/secrets/credentials.json");
const TOKEN_PATH =
  findFirstExistingPath(TOKEN_CANDIDATES) ||
  (process.env.GOOGLE_TOKEN_PATH || path.join(process.cwd(), "token.json"));

console.log(`[GOOGLE AUTH] Credentials path: ${CREDENTIALS_PATH}`);
console.log(`[GOOGLE AUTH] Token path: ${TOKEN_PATH}`);

function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
      if (err) {
        console.error(`[GOOGLE AUTH] Failed to read credentials from: ${CREDENTIALS_PATH}`);
        console.error(`[GOOGLE AUTH] Checked these paths:`, CREDENTIALS_CANDIDATES);
        err.message = `${err.message}. Checked: ${CREDENTIALS_CANDIDATES.join(", ")}`;
        return reject(err);
      }

      let credentials;
      try {
        credentials = JSON.parse(content);
      } catch (parseErr) {
        console.error(`[GOOGLE AUTH] Failed to parse credentials JSON from: ${CREDENTIALS_PATH}`);
        console.error(`[GOOGLE AUTH] Parse error: ${parseErr.message}`);
        return reject(new Error(`Invalid JSON in credentials.json: ${parseErr.message}`));
      }

      const { client_secret, client_id, redirect_uris } =
        credentials.installed || {};

      if (!client_id || !client_secret || !redirect_uris) {
        const msg = `Invalid credentials structure. Expected 'installed' object with client_id, client_secret, redirect_uris`;
        console.error(`[GOOGLE AUTH] ${msg}`);
        return reject(new Error(msg));
      }

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      fs.readFile(TOKEN_PATH, (tokenErr, token) => {
        if (tokenErr) {
          console.warn(`[GOOGLE AUTH] Token file not found at: ${TOKEN_PATH}`);
          console.warn(`[GOOGLE AUTH] Token file is required for server operation.`);
          console.error(`[GOOGLE AUTH] Unable to enter interactive auth on server. Set token file path or check Render secret upload.`);
          return reject(new Error(`Token file not found at ${TOKEN_PATH}. Cannot proceed without valid token on server.`));
        }

        let tokenData;
        try {
          tokenData = JSON.parse(token);
        } catch (parseErr) {
          console.error(`[GOOGLE AUTH] Failed to parse token JSON from: ${TOKEN_PATH}`);
          console.error(`[GOOGLE AUTH] Parse error: ${parseErr.message}`);
          return reject(new Error(`Invalid JSON in token.json: ${parseErr.message}`));
        }

        oAuth2Client.setCredentials(tokenData);
        console.log(`[GOOGLE AUTH] Successfully loaded credentials and token`);
        resolve(oAuth2Client);
      });
    });
  });
}

module.exports = authorize;