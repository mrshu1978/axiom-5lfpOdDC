const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const config = require('./config/env');

const app = express();

// CORS configuration
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use(cookieParser());

// Session configuration
app.use(session({
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
}));

// Initialize web-push with VAPID details
const webPush = require('web-push');
webPush.setVapidDetails(
  config.vapid.email,
  config.vapid.publicKey,
  config.vapid.privateKey
);

// Import routes and middleware
const authRoutes = require('./routes/auth');
const pushRoutes = require('./routes/push');
const requireAuth = require('./middleware/requireAuth');

// Auth routes
app.use('/auth', authRoutes);

// Push routes
app.use('/push', pushRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Basic route for root
app.get('/', (req, res) => {
  res.json({ message: 'Agenda Google PWA Server API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});