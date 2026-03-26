const cron = require('node-cron');
const { google } = require('googleapis');
const tokenRegistry = require('./tokenRegistry');
const subscriptionStore = require('./subscriptionStore');
const webPush = require('web-push');

class ReminderScheduler {
  constructor() {
    this.sentReminders = new Set(); // key: `${userId}|${eventId}|${reminderMinutes}`
    this.calendar = google.calendar('v3');
  }

  start() {
    // Run every minute at second 0
    cron.schedule('* * * * *', () => {
      this.tick().catch(err => {
        console.error('Reminder scheduler tick error:', err);
      });
    });
    console.log('Reminder scheduler started (runs every minute)');
  }

  async tick() {
    const now = new Date();
    const windowStart = now;
    const windowEnd = new Date(now.getTime() + 60 * 1000); // next 60 seconds

    // Get all subscribed users
    const subscriptions = subscriptionStore.getAll();
    if (subscriptions.length === 0) {
      return;
    }

    for (const [userId] of subscriptions) {
      try {
        await this.processUser(userId, windowStart, windowEnd);
      } catch (err) {
        console.error(`Error processing reminders for user ${userId}:`, err);
      }
    }

    // Cleanup old sent reminders (older than 24h) to prevent memory leak
    // Not required for Set but could be implemented with a Map with timestamps
  }

  async processUser(userId, windowStart, windowEnd) {
    let oauth2Client;
    try {
      oauth2Client = await tokenRegistry.getAuthenticatedClient(userId);
    } catch (err) {
      // Token may be missing or invalid, skip user
      console.warn(`Skipping user ${userId}: cannot get authenticated client`, err.message);
      return;
    }

    const timeMin = new Date().toISOString();
    const timeMax = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // next 24h

    let events;
    try {
      const res = await this.calendar.events.list({
        auth: oauth2Client,
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: 'startTime',
      });
      events = res.data.items || [];
    } catch (err) {
      console.error(`Failed to fetch events for user ${userId}:`, err);
      return;
    }

    for (const event of events) {
      await this.checkEventReminders(userId, event, windowStart, windowEnd);
    }
  }

  async checkEventReminders(userId, event, windowStart, windowEnd) {
    const reminders = event.reminders;
    if (!reminders || !reminders.overrides) {
      return;
    }

    const eventStart = new Date(event.start.dateTime || event.start.date);
    if (isNaN(eventStart.getTime())) {
      return;
    }

    for (const override of reminders.overrides) {
      if (override.method !== 'popup' && override.method !== 'notification') {
        continue; // only popup/notification reminders
      }
      const minutes = override.minutes || 0;
      const triggerTime = new Date(eventStart.getTime() - minutes * 60000);

      if (triggerTime >= windowStart && triggerTime < windowEnd) {
        // Reminder due within this minute
        const key = `${userId}|${event.id}|${minutes}`;
        if (this.sentReminders.has(key)) {
          continue; // already sent
        }

        await this.sendReminderNotification(userId, event, minutes);
        this.sentReminders.add(key);
      }
    }
  }

  async sendReminderNotification(userId, event, minutes) {
    const subscription = subscriptionStore.get(userId);
    if (!subscription) {
      return; // user not subscribed to push
    }

    const title = event.summary || 'Event Reminder';
    const body = `Starts in ${minutes} minutes`;
    const payload = JSON.stringify({
      title,
      body,
      data: { eventId: event.id },
    });

    try {
      await webPush.sendNotification(subscription, payload);
      console.log(`Reminder sent to user ${userId} for event ${event.id} (${minutes} min)`);
    } catch (err) {
      console.error(`Failed to send reminder notification to user ${userId}:`, err);
      if (err.statusCode === 410) {
        // Subscription expired, remove it
        subscriptionStore.remove(userId);
      }
    }
  }
}

module.exports = new ReminderScheduler();