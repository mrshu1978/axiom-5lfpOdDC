import React from 'react';
import {
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  format,
  addMonths,
  subMonths,
  isToday,
  isSameDay,
} from 'date-fns';
import { it } from 'date-fns/locale';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const MiniCalendar = ({ selectedDate, onDateSelect }: MiniCalendarProps) => {
  const [currentMonth, setCurrentMonth] = React.useState(startOfMonth(selectedDate));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = getDaysInMonth(currentMonth);
  const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

  // Adjust to Monday-first week (Italian convention)
  const weekDays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

  const days = [];
  // Empty cells for days before the start of the month
  for (let i = 0; i < (startDayOfWeek === 0 ? 6 : startDayOfWeek - 1); i++) {
    days.push(<div key={`empty-${i}`} className="w-7 h-7" />);
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isTodayDate = isToday(date);
    const isSelected = isSameDay(date, selectedDate);

    let className = 'w-7 h-7 flex items-center justify-center rounded-full text-sm transition-colors';
    if (isSelected) {
      className += ' bg-[var(--color-accent)]/20 border border-[var(--color-accent)]';
    } else if (isTodayDate) {
      className += ' bg-[var(--color-accent)] text-white';
    } else {
      className += ' text-[var(--color-text-primary)] hover:bg-[var(--color-border)]';
    }

    days.push(
      <button
        key={day}
        className={className}
        onClick={() => onDateSelect(date)}
        aria-label={`Select ${format(date, 'd MMMM yyyy', { locale: it })}`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-lg p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={handlePrevMonth}
          className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] w-6 h-6 flex items-center justify-center"
          aria-label="Previous month"
        >
          ←
        </button>
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          {format(currentMonth, 'MMMM yyyy', { locale: it })}
        </h3>
        <button
          onClick={handleNextMonth}
          className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)] w-6 h-6 flex items-center justify-center"
          aria-label="Next month"
        >
          →
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="text-center text-xs text-[var(--color-text-muted)] font-medium"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days}
      </div>
    </div>
  );
};