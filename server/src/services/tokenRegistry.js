const { google } = require('googleapis');
const config = require('../config/env');

class TokenRegistry {
  constructor() {
    this.tokens = new Map(); // userId -> { access_token, refresh_token, expiry_date }
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
  }

  set(userId, tokens) {
    this.tokens.set(userId, {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date || Date.now() + 3600 * 1000,
    });
  }

  get(userId) {
    return this.tokens.get(userId);
  }

  delete(userId) {
    this.tokens.delete(userId);
  }

  // Refresh token if expired, returns fresh access_token or throws
  async ensureValidToken(userId) {
    const entry = this.get(userId);
    if (!entry) {
      throw new Error(`No token entry for userId: ${userId}`);
    }

    const { access_token, refresh_token, expiry_date } = entry;

    // If token expires within 1 minute, refresh
    if (expiry_date < Date.now() + 60000) {
      try {
        this.oauth2Client.setCredentials({ refresh_token });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        const updated = {
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token || refresh_token,
          expiry_date: credentials.expiry_date,
        };
        this.set(userId, updated);
        return updated.access_token;
      } catch (err) {
        this.delete(userId);
        throw err;
      }
    }

    return access_token;
  }

  // Get OAuth2 client instance configured with valid tokens for userId
  async getAuthenticatedClient(userId) {
    const accessToken = await this.ensureValidToken(userId);
    this.oauth2Client.setCredentials({ access_token: accessToken });
    return this.oauth2Client;
  }

  getAllUserIds() {
    return Array.from(this.tokens.keys());
  }
}

module.exports = new TokenRegistry();