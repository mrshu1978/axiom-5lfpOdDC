import { useAuthStore } from '../store/authStore';
import { GoogleCalendar, CalendarEvent, Reminder } from '../types/calendar';

const BASE_URL = 'https://www.googleapis.com/calendar/v3';

const getAuthHeader = () => {
  const token = useAuthStore.getState().accessToken;
  if (!token) throw new Error('No access token available');
  return { Authorization: `Bearer ${token}` };
};

const mapGoogleCalendar = (item: any): GoogleCalendar => ({
  id: item.id,
  summary: item.summary,
  backgroundColor: item.backgroundColor || '#7986CB',
  selected: true, // default selected
});

const mapGoogleEvent = (item: any, calendarId: string): CalendarEvent => {
  const start = item.start.dateTime ? new Date(item.start.dateTime) : new Date(item.start.date);
  const end = item.end.dateTime ? new Date(item.end.dateTime) : new Date(item.end.date);
  const reminders: Reminder[] = item.reminders?.overrides?.map((override: any) => ({
    minutes: override.minutes,
  })) || [];

  return {
    id: item.id,
    calendarId,
    title: item.summary || '',
    start,
    end,
    color: item.colorId ? `#${item.colorId}` : undefined,
    notes: item.description || '',
    reminders,
    timezone: item.start.timeZone || 'UTC',
    googleEventId: item.id,
  };
};

export const calendarService = {
  listCalendars: async (): Promise<GoogleCalendar[]> => {
    const response = await fetch(`${BASE_URL}/users/me/calendarList`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to list calendars: ${response.statusText}`);
    const data = await response.json();
    return data.items.map(mapGoogleCalendar);
  },

  listEvents: async (
    calendarId: string,
    timeMin: Date,
    timeMax: Date
  ): Promise<CalendarEvent[]> => {
    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
    });
    const response = await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to list events: ${response.statusText}`);
    const data = await response.json();
    return data.items.map((item: any) => mapGoogleEvent(item, calendarId));
  },

  createEvent: async (calendarId: string, event: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const googleEvent = {
      summary: event.title,
      start: {
        dateTime: event.start?.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      end: {
        dateTime: event.end?.toISOString(),
        timeZone: event.timezone || 'UTC',
      },
      description: event.notes,
      colorId: event.color ? parseInt(event.color.replace('#', ''), 16) : undefined,
      reminders: {
        useDefault: false,
        overrides: event.reminders?.map(r => ({ method: 'popup', minutes: r.minutes })) || [],
      },
    };

    const response = await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });
    if (!response.ok) throw new Error(`Failed to create event: ${response.statusText}`);
    const data = await response.json();
    return mapGoogleEvent(data, calendarId);
  },

  updateEvent: async (
    calendarId: string,
    eventId: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent> => {
    const googleEvent = {
      summary: updates.title,
      start: updates.start ? {
        dateTime: updates.start.toISOString(),
        timeZone: updates.timezone || 'UTC',
      } : undefined,
      end: updates.end ? {
        dateTime: updates.end.toISOString(),
        timeZone: updates.timezone || 'UTC',
      } : undefined,
      description: updates.notes,
      colorId: updates.color ? parseInt(updates.color.replace('#', ''), 16) : undefined,
      reminders: updates.reminders ? {
        useDefault: false,
        overrides: updates.reminders.map(r => ({ method: 'popup', minutes: r.minutes })),
      } : undefined,
    };

    // Remove undefined fields
    Object.keys(googleEvent).forEach(key => (googleEvent as any)[key] === undefined && delete (googleEvent as any)[key]);

    const response = await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'PUT',
      headers: {
        ...getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    });
    if (!response.ok) throw new Error(`Failed to update event: ${response.statusText}`);
    const data = await response.json();
    return mapGoogleEvent(data, calendarId);
  },

  deleteEvent: async (calendarId: string, eventId: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`, {
      method: 'DELETE',
      headers: getAuthHeader(),
    });
    if (!response.ok) throw new Error(`Failed to delete event: ${response.statusText}`);
  },
};