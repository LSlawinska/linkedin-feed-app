const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// LinkedIn API credentials
const CLIENT_ID = '86721rnve8r8sj';
const CLIENT_SECRET = 'WPL_AP1.uhrvKkfbXItXmodx.xyv+Yg==';
const REDIRECT_URI = 'https://your-heroku-app.herokuapp.com/linkedin-callback'; // Heroku app URL

// Step 1: Redirect to LinkedIn for OAuth
app.get('/auth/linkedin', (req, res) => {
  const scope = 'r_liteprofile r_organization_social';
  res.redirect(
    `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&scope=${scope}`
  );
});

// Step 2: Handle LinkedIn's OAuth callback
app.get('/linkedin-callback', (req, res) => {
  const code = req.query.code;

  // Exchange the authorization code for an access token
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
      const token = JSON.parse(body).access_token;

      // Store the access token and make API requests with it
      request.get(
        {
          url: `https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn:li:organization:{your-organization-id})`,
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        (error, response, body) => {
          const posts = JSON.parse(body);
          res.send(posts); // Display the posts (you can customize this later)
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

