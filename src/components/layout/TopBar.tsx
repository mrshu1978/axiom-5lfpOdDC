import { useCalendarStore } from '../../store/calendarStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { it } from 'date-fns/locale';

export const TopBar = () => {
  const { currentDate, viewMode, setCurrentDate, setViewMode } = useCalendarStore();
  const { isOnline } = useNetworkStatus();

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handlePrev = () => {
    let newDate;
    switch (viewMode) {
      case 'month':
        newDate = subMonths(currentDate, 1);
        break;
      case 'week':
        newDate = subWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = subDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    let newDate;
    switch (viewMode) {
      case 'month':
        newDate = addMonths(currentDate, 1);
        break;
      case 'week':
        newDate = addWeeks(currentDate, 1);
        break;
      case 'day':
        newDate = addDays(currentDate, 1);
        break;
      default:
        newDate = currentDate;
    }
    setCurrentDate(newDate);
  };

  const getPeriodLabel = () => {
    switch (viewMode) {
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: it });
      case 'week': {
        const startOfWeek = subDays(currentDate, currentDate.getDay() === 0 ? 6 : currentDate.getDay() - 1);
        const endOfWeek = addDays(startOfWeek, 6);
        return `${format(startOfWeek, 'dd MMM', { locale: it })} – ${format(endOfWeek, 'dd MMM yyyy', { locale: it })}`;
      }
      case 'day':
        return format(currentDate, 'EEEE, dd MMMM yyyy', { locale: it });
      default:
        return '';
    }
  };

  return (
    <div
      className="flex items-center px-4 gap-4"
      style={{
        height: '56px',
        backgroundColor: '#1A1A1A',
        borderBottom: '1px solid #2A2A2A',
      }}
    >
      {/* Left section */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleToday}
          className="rounded-lg px-3.5 py-1.5 text-sm font-medium"
          style={{
            backgroundColor: '#2A2A2A',
            color: '#F8F8F8',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '14px',
          }}
        >
          Oggi
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="flex items-center justify-center"
            style={{
              width: '24px',
              height: '24px',
              color: '#F8F8F8',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button
            onClick={handleNext}
            className="flex items-center justify-center"
            style={{
              width: '24px',
              height: '24px',
              color: '#F8F8F8',
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
        <div
          className="font-semibold"
          style={{
            fontSize: '18px',
            fontWeight: 600,
            color: '#F8F8F8',
          }}
        >
          {getPeriodLabel()}
        </div>
      </div>

      {/* Right section */}
      <div className="flex items-center gap-2 ml-auto">
        {!isOnline && (
          <div
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              color: '#EF4444',
              borderRadius: '12px',
              fontSize: '11px',
              padding: '2px 8px',
            }}
          >
            Offline
          </div>
        )}
        <div
          className="flex items-center rounded-lg p-0.5"
          style={{
            backgroundColor: '#2A2A2A',
            borderRadius: '8px',
            gap: '2px',
          }}
        >
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
              style={{
                backgroundColor: viewMode === mode ? '#6366F1' : 'transparent',
                color: viewMode === mode ? '#FFFFFF' : '#9CA3AF',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '13px',
              }}
            >
              {mode === 'month' && 'Mese'}
              {mode === 'week' && 'Settimana'}
              {mode === 'day' && 'Giorno'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};