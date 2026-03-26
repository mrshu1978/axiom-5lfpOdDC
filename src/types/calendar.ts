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
}

export type OfflineOperationType = 'create' | 'update' | 'delete';

export interface OfflineOperation {
  type: OfflineOperationType;
  payload: Partial<CalendarEvent>;
  timestamp: number;
}