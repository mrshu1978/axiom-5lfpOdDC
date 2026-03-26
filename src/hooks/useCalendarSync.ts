import { useEffect, useCallback } from 'react';
import { useCalendarStore } from '../store/calendarStore';
import { calendarService } from '../services/calendarService';
import { useNetworkStatus } from './useNetworkStatus';
import { CalendarEvent } from '../types/calendar';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

const mergeEvents = (existing: CalendarEvent[], incoming: CalendarEvent[]): CalendarEvent[] => {
  const merged = [...existing];
  incoming.forEach(incomingEvent => {
    const existingIndex = merged.findIndex(e => e.id === incomingEvent.id);
    if (existingIndex === -1) {
      merged.push(incomingEvent);
    } else {
      const existingEvent = merged[existingIndex];
      // Last-write-wins: compare updatedAt timestamps (assuming events have lastModified or updated field)
      const existingUpdated = existingEvent.lastModified ? new Date(existingEvent.lastModified).getTime() : 0;
      const incomingUpdated = incomingEvent.lastModified ? new Date(incomingEvent.lastModified).getTime() : 0;
      if (incomingUpdated > existingUpdated) {
        merged[existingIndex] = incomingEvent;
      }
    }
  });
  return merged;
};

export const useCalendarSync = () => {
  const {
    calendars,
    selectedCalendarIds,
    setCalendars,
    setEvents,
    addToOfflineQueue,
    removeFromOfflineQueue,
    processOfflineQueue,
    setLoading,
    setLastSyncAt,
    offlineQueue,
  } = useCalendarStore();

  const { isOnline } = useNetworkStatus();

  const syncNow = useCallback(async () => {
    if (!isOnline) {
      console.warn('Sync attempted while offline');
      return;
    }

    setLoading(true);
    try {
      // Fetch calendars
      const fetchedCalendars = await calendarService.listCalendars();
      setCalendars(fetchedCalendars);

      // Fetch events for each selected calendar (or all calendars if none selected)
      const targetCalendarIds = selectedCalendarIds.length > 0 ? selectedCalendarIds : calendars.map(c => c.id);
      const eventPromises = targetCalendarIds.map(async calendarId => {
        const now = new Date();
        const timeMin = new Date(now.getFullYear(), now.getMonth(), 1); // start of current month
        const timeMax = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59); // end of current month
        return calendarService.listEvents(calendarId, timeMin, timeMax);
      });

      const eventsArrays = await Promise.all(eventPromises);
      const allEvents = eventsArrays.flat();
      setEvents(prev => mergeEvents(prev, allEvents));

      setLastSyncAt(Date.now());
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isOnline, selectedCalendarIds, calendars, setCalendars, setEvents, setLoading, setLastSyncAt]);

  // Periodic sync
  useEffect(() => {
    if (!isOnline) return;

    const intervalId = setInterval(syncNow, SYNC_INTERVAL_MS);
    // Initial sync
    syncNow();

    return () => clearInterval(intervalId);
  }, [isOnline, syncNow]);

  // Process offline queue when coming online
  useEffect(() => {
    if (!isOnline || offlineQueue.length === 0) return;

    const processQueue = async () => {
      for (let i = 0; i < offlineQueue.length; i++) {
        const operation = offlineQueue[i];
        try {
          switch (operation.type) {
            case 'create': {
              const { calendarId, ...eventData } = operation.payload;
              if (!calendarId) throw new Error('Missing calendarId for create operation');
              await calendarService.createEvent(calendarId, eventData);
              break;
            }
            case 'update': {
              const { calendarId, id, ...updates } = operation.payload;
              if (!calendarId || !id) throw new Error('Missing calendarId or id for update operation');
              await calendarService.updateEvent(calendarId, id, updates);
              break;
            }
            case 'delete': {
              const { calendarId, id } = operation.payload;
              if (!calendarId || !id) throw new Error('Missing calendarId or id for delete operation');
              await calendarService.deleteEvent(calendarId, id);
              break;
            }
          }
          // Remove successful operation from queue
          removeFromOfflineQueue(i);
          // Adjust index because we removed the current item
          i--;
        } catch (error) {
          console.error('Failed to process offline operation:', operation, error);
          // Keep in queue for retry later
        }
      }
    };

    processQueue();
  }, [isOnline, offlineQueue, removeFromOfflineQueue]);

  // Add offline queue handling for CRUD operations when offline
  // This will be used by calendarStore actions (already implemented)
  // The hook just provides the syncNow function

  return { syncNow };
};