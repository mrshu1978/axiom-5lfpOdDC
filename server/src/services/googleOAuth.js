const { google } = require('googleapis');
const config = require('../config/env');

class GoogleOAuthService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      config.google.clientId,
      config.google.clientSecret,
      config.google.redirectUri
    );
    this.scopes = [
      'openid',
      'email',
      'profile',
      'https://www.googleapis.com/auth/calendar'
    ];
  }

  generateAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: this.scopes,
    });
  }

  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async refreshAccessToken(refreshToken) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  getOAuth2Client() {
    return this.oauth2Client;
  }
}

module.exports = new GoogleOAuthService();