require("dotenv").config();

const fs = require("fs");
const path = require("path");
const readline = require("readline");
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

function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
      if (err) {
        err.message = `${err.message}. Checked: ${CREDENTIALS_CANDIDATES.join(", ")}`;
        return reject(err);
      }

      const credentials = JSON.parse(content);

      const { client_secret, client_id, redirect_uris } =
        credentials.installed;

      const oAuth2Client = new google.auth.OAuth2(
        client_id,
        client_secret,
        redirect_uris[0]
      );

      fs.readFile(TOKEN_PATH, (tokenErr, token) => {
        if (tokenErr) {
          return getAccessToken(oAuth2Client, resolve, reject);
        }

        oAuth2Client.setCredentials(JSON.parse(token));

        resolve(oAuth2Client);
      });
    });
  });
}

function getAccessToken(oAuth2Client, resolve, reject) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\nAuthorize this app:\n");
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("\nPaste code here: ", async (code) => {
    rl.close();

    try {
      const { tokens } = await oAuth2Client.getToken(code);

      oAuth2Client.setCredentials(tokens);

      try {
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
        console.log(`\nToken stored to ${TOKEN_PATH}`);
      } catch (writeError) {
        console.warn(`\nCould not write token file at ${TOKEN_PATH}: ${writeError.message}`);
      }

      resolve(oAuth2Client);
    } catch (error) {
      console.error("Error retrieving access token", error);
      reject(error);
    }
  });
}

module.exports = authorize;