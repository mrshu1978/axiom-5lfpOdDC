const express = require('express');
const webPush = require('web-push');
const subscriptionStore = require('../services/subscriptionStore');
const requireAuth = require('../middleware/requireAuth');
const config = require('../config/env');

const router = express.Router();

// GET /push/vapid-public-key
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: config.vapid.publicKey });
});

// POST /push/subscribe - requires authentication
router.post('/subscribe', requireAuth, (req, res) => {
  const { subscription } = req.body;
  const userId = req.session.user.id;

  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  subscriptionStore.save(userId, subscription);
  res.json({ success: true });
});

// DELETE /push/subscribe - requires authentication
router.delete('/subscribe', requireAuth, (req, res) => {
  const userId = req.session.user.id;
  subscriptionStore.remove(userId);
  res.json({ success: true });
});

// POST /push/send - internal endpoint (no auth guard)
router.post('/send', async (req, res) => {
  const { userId, title, body, data } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ error: 'Missing required fields: userId, title, body' });
  }

  const subscription = subscriptionStore.get(userId);
  if (!subscription) {
    return res.status(404).json({ error: 'No subscription found for user' });
  }

  const payload = JSON.stringify({ title, body, data });

  try {
    await webPush.sendNotification(subscription, payload);
    res.json({ sent: true });
  } catch (err) {
    console.error('Push notification error:', err);

    // If subscription is invalid (410 Gone), remove it
    if (err.statusCode === 410) {
      subscriptionStore.remove(userId);
      return res.status(410).json({ error: 'Subscription expired and removed' });
    }

    res.status(500).json({ error: 'Failed to send notification' });
  }
});

module.exports = router;