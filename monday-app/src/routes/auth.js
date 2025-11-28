/**
 * Authentication Routes
 * Handles OAuth 2.0 flow with Monday.com
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { logger } = require('../utils/logger');
const mondayService = require('../services/mondayService');

/**
 * Initiate OAuth flow
 */
router.get('/authorize', (req, res) => {
  const { state, redirect_uri } = req.query;
  
  const authUrl = new URL('https://auth.monday.com/oauth2/authorize');
  authUrl.searchParams.append('client_id', process.env.MONDAY_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', redirect_uri || process.env.REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', 'me:read boards:read boards:write workspaces:read users:read webhooks:write');
  
  if (state) {
    authUrl.searchParams.append('state', state);
  }

  logger.info('Initiating OAuth flow', { authUrl: authUrl.toString() });
  res.redirect(authUrl.toString());
});

/**
 * OAuth callback handler
 */
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    logger.error('OAuth error:', error);
    return res.status(400).json({ error: 'Authorization failed', details: error });
  }

  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://auth.monday.com/oauth2/token', {
      client_id: process.env.MONDAY_CLIENT_ID,
      client_secret: process.env.MONDAY_CLIENT_SECRET,
      code,
      redirect_uri: process.env.REDIRECT_URI,
      grant_type: 'authorization_code'
    });

    const { access_token, refresh_token, scope, token_type } = tokenResponse.data;

    // Get user info
    const userInfo = await mondayService.getMe(access_token);

    // Create JWT for session management
    const sessionToken = jwt.sign(
      {
        userId: userInfo.me.id,
        accountId: userInfo.me.account.id,
        email: userInfo.me.email,
        name: userInfo.me.name
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store tokens securely (in production, use Redis or database)
    // For now, we'll send them in the response
    const authData = {
      session: sessionToken,
      monday_token: access_token,
      refresh_token,
      user: userInfo.me,
      scope
    };

    logger.info('OAuth successful', { userId: userInfo.me.id, accountId: userInfo.me.account.id });

    // Redirect to app with auth data
    res.redirect(`/app?auth=success&token=${sessionToken}`);
  } catch (error) {
    logger.error('OAuth token exchange failed:', error);
    res.status(500).json({ error: 'Failed to complete authorization' });
  }
});

/**
 * Refresh access token
 */
router.post('/refresh', async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token required' });
  }

  try {
    const response = await axios.post('https://auth.monday.com/oauth2/token', {
      client_id: process.env.MONDAY_CLIENT_ID,
      client_secret: process.env.MONDAY_CLIENT_SECRET,
      refresh_token,
      grant_type: 'refresh_token'
    });

    logger.info('Token refreshed successfully');
    res.json(response.data);
  } catch (error) {
    logger.error('Token refresh failed:', error);
    res.status(401).json({ error: 'Failed to refresh token' });
  }
});

/**
 * Validate session
 */
router.get('/validate', (req, res) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

/**
 * Logout
 */
router.post('/logout', (req, res) => {
  // In production, invalidate tokens in Redis/database
  res.json({ success: true, message: 'Logged out successfully' });
});

module.exports = router;
