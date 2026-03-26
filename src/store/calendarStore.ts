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
  currentDate: Date;
  viewMode: 'month' | 'week' | 'day';
}

export interface CalendarActions {
  setCalendars: (calendars: GoogleCalendar[]) => void;
  toggleCalendar: (calendarId: string) => void;
  setEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (eventId: string) => void;
  addToOfflineQueue: (operation: OfflineOperation) => void;
  removeFromOfflineQueue: (index: number) => void;
  processOfflineQueue: () => void;
  setLoading: (loading: boolean) => void;
  setLastSyncAt: (timestamp: number | null) => void;
  setCurrentDate: (date: Date) => void;
  setViewMode: (viewMode: 'month' | 'week' | 'day') => void;
}

const initialState: CalendarState = {
  calendars: [],
  selectedCalendarIds: [],
  events: [],
  isLoading: false,
  lastSyncAt: null,
  offlineQueue: [],
  currentDate: new Date(),
  viewMode: 'month',
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
        removeFromOfflineQueue: (index) =>
          set((state) => ({ offlineQueue: state.offlineQueue.filter((_, i) => i !== index) })),
        processOfflineQueue: () => {
          // TODO: implement sync logic in TASK-011 (called by hook)
          set({ offlineQueue: [] });
        },
        setLoading: (isLoading) => set({ isLoading }),
        setLastSyncAt: (lastSyncAt) => set({ lastSyncAt }),
        setCurrentDate: (currentDate) => set({ currentDate }),
        setViewMode: (viewMode) => set({ viewMode }),
      }),
      {
        name: 'calendar-state',
        partialize: (state) => ({
          calendars: state.calendars,
          selectedCalendarIds: state.selectedCalendarIds,
          events: state.events,
          lastSyncAt: state.lastSyncAt,
          offlineQueue: state.offlineQueue,
          currentDate: state.currentDate,
          viewMode: state.viewMode,
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
          if (parsed.currentDate) {
            parsed.currentDate = new Date(parsed.currentDate);
          }
          return parsed;
        },
      }
    ),
    { name: 'CalendarStore' }
  )
);