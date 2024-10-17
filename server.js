const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const cors = require('cors');  // Import CORS middleware

const app = express();
app.use(bodyParser.json());

// CORS configuration - Allow your website's domain
const corsOptions = {
  origin: 'https://sdglines.com',  // Replace with your actual website domain
  optionsSuccessStatus: 200
};

// Apply CORS middleware before routes
app.use(cors(corsOptions));

// LinkedIn API credentials (use your actual Client ID, Client Secret, and Redirect URI)
const CLIENT_ID = '86721rnve8r8sj';  // Replace with your Client ID
const CLIENT_SECRET = 'WPL_AP1.uhrvKkfbXItXmodx.xyv+Yg==';  // Replace with your Client Secret
const REDIRECT_URI = 'https://linkedin-feed-app.onrender.com/linkedin-callback';  // Your actual callback URL

// Global variable to store the access token
let accessToken = null;  // Initialize as null

// Step 1: Redirect to LinkedIn for OAuth with r_organization_social scope
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_organization_admin rw_organization_admin r_organization_social';  // Request both read and write permissions for organization
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

      // Step 4: Store the access token and inform the user
      accessToken = token;  // Store the access token in the global variable
      res.send("Access token acquired. You can now fetch organization posts using /fetch-organization-posts.");
    }
  );
});

// Step 5: Create an API route to fetch the 5 most recent LinkedIn organization posts
app.get('/fetch-organization-posts', (req, res) => {
  if (!accessToken) {
    return res.status(403).send("No access token available. Please authenticate first.");
  }

  // Numeric organization ID
  const organizationId = '2280995';  // Your LinkedIn organization ID

  // Make the API request to fetch the 5 most recent organization posts
  request.get(
    {
      url: `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=urn:li:organization:${organizationId}&count=5&sortBy=LAST_MODIFIED`,  // Fetch 5 most recent posts
      headers: {
        Authorization: `Bearer ${accessToken}`,  // Use the access token
      },
    },
    (error, response, body) => {
      if (error) {
        return res.status(500).send("Error occurred during LinkedIn API request: " + error);
      }

      const posts = JSON.parse(body);  // Parse the posts
      res.json(posts);  // Send the posts back as the response
    }
  );
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
