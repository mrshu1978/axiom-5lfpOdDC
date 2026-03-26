import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { calendarService } from '../../services/calendarService';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { CalendarEvent, Reminder } from '../../types/calendar';
import { ColorPicker } from './ColorPicker';
import { ReminderRow } from './ReminderRow';

interface EventModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  initialDate?: Date;
  event?: CalendarEvent;
  onClose: () => void;
}

interface FormData {
  title: string;
  start: Date;
  end: Date;
  timezone: string;
  calendarId: string;
  color: string;
  notes: string;
  reminders: Reminder[];
}

const TIMEZONES = Intl.supportedValuesOf?.('timeZone') || [
  'UTC', 'Europe/Rome', 'America/New_York', 'Asia/Tokyo',
];

export const EventModal = ({ isOpen, mode, initialDate, event, onClose }: EventModalProps) => {
  const { calendars, addEvent, updateEvent, deleteEvent, addToOfflineQueue } = useCalendarStore();
  const { isOnline } = useNetworkStatus();
  const [formData, setFormData] = useState<FormData>({
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000), // +1 hour
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    calendarId: calendars[0]?.id || '',
    color: '#6366F1',
    notes: '',
    reminders: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form when props change
  useEffect(() => {
    if (mode === 'create') {
      const start = initialDate || new Date();
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      setFormData({
        title: '',
        start,
        end,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        calendarId: calendars[0]?.id || '',
        color: '#6366F1',
        notes: '',
        reminders: [],
      });
    } else if (mode === 'edit' && event) {
      setFormData({
        title: event.title,
        start: event.start,
        end: event.end,
        timezone: event.timezone,
        calendarId: event.calendarId,
        color: event.color || '#6366F1',
        notes: event.notes || '',
        reminders: event.reminders || [],
      });
    }
  }, [mode, event, initialDate, calendars]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo è obbligatorio';
    }
    if (formData.end <= formData.start) {
      newErrors.end = 'La data di fine deve essere successiva all\'inizio';
    }
    if (!formData.calendarId) {
      newErrors.calendarId = 'Seleziona un calendario';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleDatetimeChange = (field: 'start' | 'end', e: ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    handleChange(field, newDate);
  };

  const handleAddReminder = () => {
    if (formData.reminders.length >= 5) return;
    handleChange('reminders', [...formData.reminders, { minutes: 5 }]);
  };

  const handleReminderChange = (index: number, minutes: number) => {
    const updated = [...formData.reminders];
    updated[index] = { minutes };
    handleChange('reminders', updated);
  };

  const handleReminderRemove = (index: number) => {
    const updated = formData.reminders.filter((_, i) => i !== index);
    handleChange('reminders', updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const eventData: Partial<CalendarEvent> = {
        title: formData.title,
        start: formData.start,
        end: formData.end,
        color: formData.color,
        notes: formData.notes,
        reminders: formData.reminders,
        timezone: formData.timezone,
      };

      if (isOnline) {
        if (mode === 'create') {
          const created = await calendarService.createEvent(formData.calendarId, eventData);
          addEvent(created);
        } else if (mode === 'edit' && event) {
          const updated = await calendarService.updateEvent(event.calendarId, event.id, eventData);
          updateEvent(event.id, updated);
        }
      } else {
        // Offline: store operation in queue
        const offlineOp = {
          type: mode === 'create' ? 'create' as const : 'update' as const,
          payload: { ...eventData, calendarId: formData.calendarId },
          timestamp: Date.now(),
        };
        addToOfflineQueue(offlineOp);
        // Also update local store immediately for optimistic UI
        if (mode === 'create') {
          const tempEvent: CalendarEvent = {
            id: `offline-${Date.now()}`,
            calendarId: formData.calendarId,
            title: formData.title,
            start: formData.start,
            end: formData.end,
            color: formData.color,
            notes: formData.notes,
            reminders: formData.reminders,
            timezone: formData.timezone,
            googleEventId: undefined,
            lastModified: new Date().toISOString(),
          };
          addEvent(tempEvent);
        } else if (mode === 'edit' && event) {
          updateEvent(event.id, eventData);
        }
      }

      onClose();
    } catch (err) {
      console.error('Failed to save event:', err);
      alert('Errore durante il salvataggio. Controlla la connessione e riprova.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!event) return;
    if (!window.confirm('Eliminare l\'evento?')) return;

    if (isOnline) {
      calendarService.deleteEvent(event.calendarId, event.id)
        .then(() => {
          deleteEvent(event.id);
          onClose();
        })
        .catch(err => {
          console.error('Failed to delete event:', err);
          alert('Errore durante l\'eliminazione.');
        });
    } else {
      const offlineOp = {
        type: 'delete' as const,
        payload: { id: event.id, calendarId: event.calendarId },
        timestamp: Date.now(),
      };
      addToOfflineQueue(offlineOp);
      deleteEvent(event.id);
      onClose();
    }
  };

  // Format datetime-local input string
  const toLocalDatetimeString = (date: Date) => {
    const offset = date.getTimezoneOffset() * 60000;
    const local = new Date(date.getTime() - offset);
    return local.toISOString().slice(0, 16);
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 z-50"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 w-full max-w-lg"
        style={{
          backgroundColor: '#1A1A1A',
          border: '1px solid #2A2A2A',
          borderRadius: '12px',
          width: '480px',
          maxWidth: '90vw',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-[#F8F8F8]">
            {mode === 'create' ? 'Nuovo evento' : 'Modifica evento'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#9CA3AF] hover:text-[#F8F8F8] transition-colors"
            aria-label="Chiudi"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">
              Titolo evento <span className="text-[#EF4444]">*</span>
            </label>
            <input
              type="text"
              placeholder="Titolo evento"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              style={{ borderRadius: '8px', padding: '10px 14px' }}
              required
            />
            {errors.title && <p className="mt-1 text-sm text-[#EF4444]">{errors.title}</p>}
          </div>

          {/* Start / End datetime */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Inizio</label>
              <input
                type="datetime-local"
                value={toLocalDatetimeString(formData.start)}
                onChange={(e) => handleDatetimeChange('start', e)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Fine</label>
              <input
                type="datetime-local"
                value={toLocalDatetimeString(formData.end)}
                onChange={(e) => handleDatetimeChange('end', e)}
                className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              />
              {errors.end && <p className="mt-1 text-sm text-[#EF4444]">{errors.end}</p>}
            </div>
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Fuso orario</label>
            <select
              value={formData.timezone}
              onChange={(e) => handleChange('timezone', e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>

          {/* Calendar select */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Calendario</label>
            <select
              value={formData.calendarId}
              onChange={(e) => handleChange('calendarId', e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
            >
              {calendars.map((cal) => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
            {errors.calendarId && <p className="mt-1 text-sm text-[#EF4444]">{errors.calendarId}</p>}
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Colore</label>
            <ColorPicker
              selectedColor={formData.color}
              onChange={(color) => handleChange('color', color)}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Note</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-[#0A0A0A] border border-[#2A2A2A] rounded-lg px-3.5 py-2.5 text-[#F8F8F8] placeholder-[#6B7280] focus:outline-none focus:ring-1 focus:ring-[#6366F1]"
              placeholder="Note opzionali"
            />
          </div>

          {/* Reminders */}
          <div>
            <label className="block text-sm font-medium text-[#D1D5DB] mb-2">Promemoria</label>
            <div className="space-y-2 mb-3">
              {formData.reminders.map((reminder, index) => (
                <ReminderRow
                  key={index}
                  value={reminder.minutes}
                  onChange={(minutes) => handleReminderChange(index, minutes)}
                  onRemove={() => handleReminderRemove(index)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={handleAddReminder}
              disabled={formData.reminders.length >= 5}
              className="text-sm text-[#6366F1] hover:text-[#4F46E5] disabled:text-[#6B7280] disabled:cursor-not-allowed"
            >
              + Aggiungi promemoria
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
            <div>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: '#EF4444',
                    color: '#FFFFFF',
                  }}
                >
                  Elimina
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#2A2A2A',
                  color: '#F8F8F8',
                }}
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{
                  backgroundColor: '#6366F1',
                  color: '#FFFFFF',
                }}
              >
                {isSubmitting ? 'Salvataggio...' : (mode === 'create' ? 'Crea evento' : 'Salva modifiche')}
              </button>
            </div>
          </div>
        </form>

        {!isOnline && (
          <div className="mt-4 text-xs text-[#9CA3AF] text-center">
            Modalità offline: le modifiche saranno sincronizzate quando tornerai online.
          </div>
        )}
      </div>
    </div>
  );
};