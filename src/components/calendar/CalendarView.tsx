import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { it } from 'date-fns/locale';
import { useCalendarStore } from '../../store/calendarStore';
import { CalendarEvent as AppCalendarEvent } from '../../types/calendar';
import { useState } from 'react';
import styles from './CalendarView.module.css';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { EventModal } from '../events/EventModal';

const locales = { it };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type RBCEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    color?: string;
    calendarId: string;
    notes?: string;
    reminders: { minutes: number }[];
  };
};

export const CalendarView = () => {
  const { events, viewMode, currentDate, selectedCalendarIds, setCurrentDate, setViewMode } = useCalendarStore();
  const [selectedEvent, setSelectedEvent] = useState<AppCalendarEvent | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [modalOpen, setModalOpen] = useState(false);
  const [initialDate, setInitialDate] = useState<Date>(new Date());

  // Filter events by selected calendars
  const filteredEvents = events.filter(event => selectedCalendarIds.includes(event.calendarId));

  // Map to RBC event format
  const rbcEvents: RBCEvent[] = filteredEvents.map(event => ({
    id: event.id,
    title: event.title,
    start: event.start,
    end: event.end,
    resource: {
      color: event.color,
      calendarId: event.calendarId,
      notes: event.notes,
      reminders: event.reminders,
    },
  }));

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedEvent(null);
    setInitialDate(slotInfo.start);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleSelectEvent = (event: RBCEvent) => {
    // Find the original event
    const originalEvent = events.find(e => e.id === event.id);
    if (originalEvent) {
      setSelectedEvent(originalEvent);
      setModalMode('edit');
      setModalOpen(true);
    }
  };

  const handleNavigate = (newDate: Date) => {
    setCurrentDate(newDate);
  };

  const handleViewChange = (newView: string) => {
    if (newView === 'month' || newView === 'week' || newView === 'day') {
      setViewMode(newView);
    }
  };

  const eventStyleGetter = (event: RBCEvent) => {
    const backgroundColor = event.resource.color || '#6366F1';
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        fontSize: '12px',
        color: '#FFFFFF',
        border: 'none',
      },
    };
  };

  return (
    <div className={styles.calendarWrapper}>
      <Calendar
        localizer={localizer}
        events={rbcEvents}
        startAccessor="start"
        endAccessor="end"
        style={{ height: 'calc(100vh - 56px - 1px)' }} // subtract TopBar height and border
        date={currentDate}
        view={viewMode}
        onNavigate={handleNavigate}
        onView={handleViewChange}
        onSelectSlot={handleSelectSlot}
        onSelectEvent={handleSelectEvent}
        eventPropGetter={eventStyleGetter}
        selectable
        popup
        messages={{
          today: 'Oggi',
          previous: 'Prec',
          next: 'Succ',
          month: 'Mese',
          week: 'Settimana',
          day: 'Giorno',
          agenda: 'Agenda',
          date: 'Data',
          time: 'Ora',
          event: 'Evento',
          noEventsInRange: 'Nessun evento in questo periodo',
        }}
      />
      {modalOpen && (
        <EventModal
          isOpen={modalOpen}
          mode={modalMode}
          initialDate={modalMode === 'create' ? initialDate : undefined}
          event={selectedEvent}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  );
};