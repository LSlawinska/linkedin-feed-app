const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// LinkedIn API credentials (use your actual Client ID, Client Secret, and Redirect URI)
const CLIENT_ID = '86721rnve8r8sj';  // Your Client ID
const CLIENT_SECRET = 'WPL_AP1.uhrvKkfbXItXmodx.xyv+Yg==';  // Your Client Secret
const REDIRECT_URI = 'https://linkedin-feed-app.onrender.com/linkedin-callback';  // Your actual callback URL

// Route to initiate LinkedIn OAuth (Step 1)
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_liteprofile';  // Request the liteprofile scope to fetch basic profile
  const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
  
  res.redirect(redirectUrl);  // Redirect to LinkedIn for authorization
});

// Handle LinkedIn OAuth callback and fetch access token (Step 2)
app.get('/linkedin-callback', (req, res) => {
  const code = req.query.code;  // Get authorization code from the query parameters

  if (!code) {
    return res.send("Authorization code is missing.");
  }

  // Exchange authorization code for an access token
  request.post(
    {
      url: 'https://www.linkedin.com/oauth/v2/accessToken',
      form: {
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      },
    },
    (error, response, body) => {
      if (error) {
        return res.send("Error occurred during token exchange: " + error);
      }

      const token = JSON.parse(body).access_token;
      if (!token) {
        return res.send("Failed to retrieve access token.");
      }

      // Store the access token (for simplicity, using a global variable)
      global.accessToken = token;
      res.send("Access token acquired. You can now fetch profile using /fetch-profile.");
    }
  );
});

// Step 3: Create an API route to fetch LinkedIn profile data
app.get('/fetch-profile', (req, res) => {
  // Ensure the access token is available
  const token = global.accessToken;
  if (!token) {
    return res.status(403).send("No access token available. Please authenticate first.");
  }

  // Make the API request to fetch LinkedIn profile data
  request.get(
    {
      url: 'https://api.linkedin.com/v2/me',  // Fetch your own LinkedIn profile data
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    (error, response, body) => {
      if (error) {
        return res.status(500).send("Error occurred during LinkedIn API request: " + error);
      }

      const profile = JSON.parse(body);
      res.json(profile);  // Send the profile data to the front-end as JSON
    }
  );
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
