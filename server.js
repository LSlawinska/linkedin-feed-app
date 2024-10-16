const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// LinkedIn API credentials (use your actual Client ID, Client Secret, and Redirect URI)
const CLIENT_ID = '86721rnve8r8sj';  // Your Client ID
const CLIENT_SECRET = 'WPL_AP1.uhrvKkfbXItXmodx.xyv+Yg==';  // Your Client Secret
const REDIRECT_URI = 'https://linkedin-feed-app.onrender.com/linkedin-callback';  // Your actual callback URL

// Step 1: Redirect to LinkedIn for OAuth with r_organization_social scope
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_organization_social';  // Use the r_organization_social scope
  const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
  
  res.redirect(redirectUrl);  // Redirect to LinkedIn for authorization
});

// Step 2: Handle LinkedIn's OAuth callback and capture the authorization code
app.get('/linkedin-callback', (req, res) => {
  const code = req.query.code;  // Capture the authorization code from the query parameters

  if (!code) {
    return res.send("Authorization code is missing in the request.");
  }

  console.log('Authorization Code:', code);  // Log the authorization code

  // Step 3: Exchange the authorization code for an access token
  request.post(
    {
      url: 'https://www.linkedin.com/oauth/v2/accessToken',
      form: {
        grant_type: 'authorization_code',
        code: code,  // Use the captured code
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
        return res.send("Failed to retrieve access token. Response: " + body);
      }

      console.log('Access Token:', token);  // Log the access token

      // Step 4: Store the access token and inform user
      global.accessToken = token;
      res.send("Access token acquired. You can now fetch organization posts using /fetch-organization-posts.");
    }
  );
});

// Step 5: Create an API route to fetch LinkedIn organization posts
app.get('/fetch-organization-posts', (req, res) => {
  // Ensure the access token is available
  const token = global.accessToken;
  if (!token) {
    return res.status(403).send("No access token available. Please authenticate first.");
  }

  // Make the API request to fetch organization posts
  request.get(
    {
      url: 'https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:2280995)',  // Replace with your organization ID
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    (error, response, body) => {
      if (error) {
        return res.status(500).send("Error occurred during LinkedIn API request: " + error);
      }

      const posts = JSON.parse(body);
      res.json(posts);  // Send the posts back as the response
    }
  );
});

// Step 6: Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
