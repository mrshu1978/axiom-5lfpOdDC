import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { GoogleCalendar, CalendarEvent, OfflineOperation } from '../types/calendar';

export interface CalendarState {
  calendars: GoogleCalendar[];
  selectedCalendarIds: string[];
  events: CalendarEvent[];
  isLoading: boolean;
  lastSyncAt: number | null;
  offlineQueue: OfflineOperation[];
}

export interface CalendarActions {
  setCalendars: (calendars: GoogleCalendar[]) => void;
  toggleCalendar: (calendarId: string) => void;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  addToOfflineQueue: (operation: OfflineOperation) => void;
  processOfflineQueue: () => void;
  setLoading: (loading: boolean) => void;
  setLastSyncAt: (timestamp: number | null) => void;
}

const initialState: CalendarState = {
  calendars: [],
  selectedCalendarIds: [],
  events: [],
  isLoading: false,
  lastSyncAt: null,
  offlineQueue: [],
};

export const useCalendarStore = create<CalendarState & CalendarActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setCalendars: (calendars) => set({ calendars }),
        toggleCalendar: (calendarId) =>
          set((state) => ({
            selectedCalendarIds: state.selectedCalendarIds.includes(calendarId)
              ? state.selectedCalendarIds.filter(id => id !== calendarId)
              : [...state.selectedCalendarIds, calendarId],
          })),
        setEvents: (events) => set({ events }),
        addEvent: (event) => set((state) => ({ events: [...state.events, event] })),
        updateEvent: (eventId, updates) =>
          set((state) => ({
            events: state.events.map(event =>
              event.id === eventId ? { ...event, ...updates } : event
            ),
          })),
        deleteEvent: (eventId) =>
          set((state) => ({ events: state.events.filter(event => event.id !== eventId) })),
        addToOfflineQueue: (operation) =>
          set((state) => ({ offlineQueue: [...state.offlineQueue, operation] })),
        processOfflineQueue: () => {
          // TODO: implement sync logic in TASK-011
          set({ offlineQueue: [] });
        },
        setLoading: (isLoading) => set({ isLoading }),
        setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
      }),
      {
        name: 'calendar-state',
        partialize: (state) => ({
          calendars: state.calendars,
          selectedCalendarIds: state.selectedCalendarIds,
          events: state.events,
          lastSyncAt: state.lastSyncAt,
          offlineQueue: state.offlineQueue,
        }),
        // Reviver to convert ISO strings to Date objects
        deserialize: (str) => {
          const parsed = JSON.parse(str);
          if (parsed.events && Array.isArray(parsed.events)) {
            parsed.events = parsed.events.map((event: any) => ({
              ...event,
              start: new Date(event.start),
              end: new Date(event.end),
            }));
          }
          return parsed;
        },
      }
    ),
    { name: 'CalendarStore' }
  )
);