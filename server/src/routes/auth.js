const express = require('express');
const googleOAuth = require('../services/googleOAuth');

const router = express.Router();

// GET /auth/google
router.get('/google', (req, res) => {
  const authUrl = googleOAuth.generateAuthUrl();
  res.redirect(authUrl);
});

// GET /auth/callback
router.get('/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error) {
    console.error('OAuth callback error:', error);
    return res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=access_denied`);
  }

  try {
    const tokens = await googleOAuth.getTokens(code);
    googleOAuth.setCredentials(tokens);

    // Get user info from Google API
    const oauth2 = googleOAuth.getOAuth2Client();
    const people = require('googleapis').people('v1');
    const { data } = await people.people.get({
      auth: oauth2,
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,photos',
    });

    const user = {
      id: data.resourceName.replace('people/', ''),
      email: data.emailAddresses?.[0]?.value,
      name: data.names?.[0]?.displayName,
      picture: data.photos?.[0]?.url,
    };

    // Store tokens and user in session
    req.session.tokens = tokens;
    req.session.user = user;

    res.redirect(`${process.env.CLIENT_ORIGIN}/`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.CLIENT_ORIGIN}/login?error=auth_failed`);
  }
});

// GET /auth/me
router.get('/me', (req, res) => {
  if (req.session.user) {
    res.json({
      isAuthenticated: true,
      user: req.session.user,
    });
  } else {
    res.status(401).json({
      isAuthenticated: false,
    });
  }
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// GET /auth/refresh
router.get('/refresh', async (req, res) => {
  if (!req.session.tokens || !req.session.tokens.refresh_token) {
    return res.status(401).json({ error: 'No refresh token available' });
  }

  const { refresh_token } = req.session.tokens;
  const expiryDate = req.session.tokens.expiry_date;

  // Refresh if token expires within 1 minute
  if (expiryDate && expiryDate < Date.now() + 60000) {
    try {
      const newTokens = await googleOAuth.refreshAccessToken(refresh_token);
      req.session.tokens = {
        ...req.session.tokens,
        access_token: newTokens.access_token,
        expiry_date: newTokens.expiry_date,
      };
      res.json({
        access_token: newTokens.access_token,
        expiry_date: newTokens.expiry_date,
      });
    } catch (err) {
      console.error('Token refresh error:', err);
      req.session.destroy();
      res.clearCookie('connect.sid');
      return res.status(401).json({ error: 'Token refresh failed, please log in again' });
    }
  } else {
    // Token still valid, return current
    res.json({
      access_token: req.session.tokens.access_token,
      expiry_date: req.session.tokens.expiry_date,
    });
  }
});

module.exports = router;