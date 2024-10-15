const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// LinkedIn API credentials
const CLIENT_ID = '86721rnve8r8sj';  // Your LinkedIn App Client ID
const CLIENT_SECRET = 'WPL_AP1.uhrvKkfbXItXmodx.xyv+Yg==';  // Your LinkedIn App Client Secret
const REDIRECT_URI = 'https://linkedin-feed-app.onrender.com/linkedin-callback';  // Your actual callback URL

// Force HTTPS redirection to avoid issues with SSL or mixed content
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.hostname + req.url);
  }
  next();
});

// Step 1: Redirect to LinkedIn for OAuth authorization
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_organization_social';  // Request organization-level scope
  const redirectUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scope}`;
  
  console.log('Redirecting to LinkedIn with URL:', redirectUrl);  // Log the redirect URL
  
  res.redirect(redirectUrl);
});

// Step 2: Handle LinkedIn's OAuth callback
app.get('/linkedin-callback', (req, res) => {
  console.log('Full request details:', req.query);  // Log the entire query object for debugging
  
  const code = req.query.code;  // Extract the authorization code from query parameters

  if (!code) {
    return res.send("Authorization code is missing in the request. Full URL: " + req.url);  // Log the full URL for debugging
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

      // Step 4: Use the access token to make a request to LinkedIn's API to fetch organization posts
      request.get(
        {
          url: 'https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:2280995)',  // Replace with your organization ID
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (error, response, body) => {
          if (error) {
            return res.send("Error occurred during LinkedIn API request: " + error);
          }

          const posts = JSON.parse(body);
          res.send(posts);  // Send the posts back as the response
        }
      );
    }
  );
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
