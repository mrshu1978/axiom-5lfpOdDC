export interface GoogleCalendar {
  id: string;
  summary: string;
  backgroundColor: string;
  selected: boolean;
}

export interface Reminder {
  minutes: number;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  title: string;
  start: Date;
  end: Date;
  color?: string;
  notes?: string;
  reminders: Reminder[];
  timezone: string;
  googleEventId?: string;
  lastModified?: string; // ISO string from Google API (event.updated)
}

export type OfflineOperationType = 'create' | 'update' | 'delete';

export interface OfflineOperation {
  type: OfflineOperationType;
  payload: Partial<CalendarEvent>;
  timestamp: number;
}