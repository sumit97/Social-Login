const express = require('express');
const { google } = require('googleapis');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// ---------- GOOGLE CONFIG ----------
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID';
const GOOGLE_CLIENT_SECRET = 'YOUR_CLIENT_SECRET';
const GOOGLE_REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

// ---------- FACEBOOK CONFIG ----------
const FB_APP_ID = 'YOURE_APP_ID';
const FB_APP_SECRET = 'YOUR_APP_SECRET';
const FB_REDIRECT_URI = 'http://localhost:3000/facebook/callback';

// ---------- STATIC FILES ----------
app.use(express.static(path.join(__dirname, 'public')));

// ---------- GOOGLE ROUTES ----------
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: GOOGLE_SCOPES,
    prompt: 'consent',
  });
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Missing authorization code');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const userinfo = await oauth2.userinfo.get();

    const html = renderTemplate(path.join(__dirname, 'views', 'success.html'), {
      NAME: userinfo.data.name,
      EMAIL: userinfo.data.email,
      ID: userinfo.data.id,
      PICTURE: userinfo.data.picture,
    });

    res.send(html);

  } catch (err) {
    console.error(err);
    res.send('Google authentication failed');
  }
});

// ---------- FACEBOOK ROUTES ----------
app.get('/auth/facebook', (req, res) => {
  const fbAuthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FB_APP_ID}&redirect_uri=${encodeURIComponent(FB_REDIRECT_URI)}&scope=email,public_profile`;
  res.redirect(fbAuthUrl);
});

app.get('/facebook/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send('Missing Facebook auth code');

  try {
    // Step 1: Exchange code for access token
    const tokenRes = await axios.get(`https://graph.facebook.com/v18.0/oauth/access_token`, {
      params: {
        client_id: FB_APP_ID,
        redirect_uri: FB_REDIRECT_URI,
        client_secret: FB_APP_SECRET,
        code: code,
      },
    });

    const accessToken = tokenRes.data.access_token;

    // Step 2: Get user profile
    const userInfoRes = await axios.get(`https://graph.facebook.com/me`, {
      params: {
        fields: 'id,name,email,picture',
        access_token: accessToken,
      },
    });

    console.log(userInfoRes.data.picture);


    const user = userInfoRes.data;

    console.log(user);


    const html = renderTemplate(path.join(__dirname, 'views', 'success.html'), {
      NAME: user.name,
      EMAIL: user.email || 'Not Provided',
      ID: user.id,
      PICTURE: user.picture.data.url,
    });

    res.send(html);
  } catch (err) {
    console.error(err);
    res.send('Facebook authentication failed');
  }
});

app.get('/logout', (req, res) => {
  // Optional: revoke token or clear session here
  res.redirect('/login.html');
});


// ---------- START SERVER ----------
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

function renderTemplate(templatePath, replacements) {
  let html = fs.readFileSync(templatePath, 'utf-8');
  for (const key in replacements) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, replacements[key]);
  }
  return html;
}