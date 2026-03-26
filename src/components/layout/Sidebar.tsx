import React from 'react';
import { useCalendarStore } from '../../store/calendarStore';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { MiniCalendar } from '../calendar/MiniCalendar';

interface SidebarProps {
  mobile?: boolean;
}

export const Sidebar = ({ mobile }: SidebarProps) => {
  const { calendars, selectedCalendarIds, toggleCalendar, currentDate, setCurrentDate } = useCalendarStore();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    authService.logout().finally(() => {
      logout(); // Clear local state
    });
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
    // TODO: switch calendar view to Day (will be implemented in TASK-014)
  };

  if (mobile) {
    return (
      <div className="flex items-center justify-around">
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Calendari</span>
        </button>
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Mini-Cal</span>
        </button>
        <button className="flex flex-col items-center text-sm">
          <div className="w-6 h-6 bg-[#6366F1] rounded mb-1"></div>
          <span>Impostazioni</span>
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] overflow-y-auto p-4">
      {/* User avatar and logout */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--color-border)]">
        <div className="w-8 h-8 rounded-full bg-[var(--color-accent)] flex items-center justify-center text-white text-sm font-semibold">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
            {user?.name || 'Utente'}
          </p>
          <p className="text-xs text-[var(--color-text-muted)] truncate">
            {user?.email || ''}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)]"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>

      {/* Calendar list */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          I miei calendari
        </h3>
        <div className="space-y-2">
          {calendars.map((calendar) => {
            const isSelected = selectedCalendarIds.includes(calendar.id);
            return (
              <div
                key={calendar.id}
                className="flex items-center gap-3 p-2 rounded hover:bg-[var(--color-border)] cursor-pointer"
                onClick={() => toggleCalendar(calendar.id)}
              >
                <div
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: calendar.backgroundColor }}
                />
                <span className="text-sm text-[var(--color-text-primary)] truncate flex-1">
                  {calendar.summary}
                </span>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => {}}
                  className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  aria-label={`Toggle ${calendar.summary}`}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Mini-calendar */}
      <div>
        <h3 className="text-xs uppercase tracking-wider text-[var(--color-text-muted)] mb-3">
          Mini-calendario
        </h3>
        <MiniCalendar selectedDate={currentDate} onDateSelect={handleDateSelect} />
      </div>
    </div>
  );
};