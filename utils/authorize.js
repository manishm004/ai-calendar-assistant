require("dotenv").config();

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { google } = require("googleapis");

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

const TOKEN_PATH =
  process.env.GOOGLE_TOKEN_PATH ||
  path.join(__dirname, "../etc/secrets/token.json");
const CREDENTIALS_PATH =
  process.env.GOOGLE_CREDENTIALS_PATH ||
  path.join(__dirname, "../etc/secrets/credentials.json");

function authorize() {
  return new Promise((resolve, reject) => {
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
      if (err) return reject(err);

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

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

      console.log(`\nToken stored to ${TOKEN_PATH}`);

      resolve(oAuth2Client);
    } catch (error) {
      console.error("Error retrieving access token", error);
      reject(error);
    }
  });
}

module.exports = authorize;