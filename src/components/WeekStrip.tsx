import { useApp } from '../context/AppContext';
import { getTodayISO, formatDateToLocal } from '../utils/storage';
import { getAllTasksCompletionForDate } from '../utils/stats';

export function WeekStrip() {
  const { state, setSelectedDate } = useApp();
  const { selectedDate, projects, recurringTasks, oneOffTasks, habits } = state;
  const today = getTodayISO();

  // Get the week containing the selected date (Monday to Sunday)
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = selectedDateObj.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDateObj);
    date.setDate(selectedDateObj.getDate() + mondayOffset + i);
    return formatDateToLocal(date);
  });

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex items-center justify-center gap-2 py-5 px-4">
      {weekDays.map((dateStr, index) => {
        const isToday = dateStr === today;
        const isSelected = dateStr === selectedDate;
        const isFuture = dateStr > today;

        const { total, percentage } = getAllTasksCompletionForDate(projects, recurringTasks, oneOffTasks, habits, dateStr);
        const hasTasks = total > 0;
        const dayNum = new Date(dateStr + 'T00:00:00').getDate();

        return (
          <button
            key={dateStr}
            onClick={() => setSelectedDate(dateStr)}
            className={`relative flex flex-col items-center gap-1 px-4 py-3 rounded-xl min-w-[64px] transition-all ${
              isSelected
                ? 'bg-accent-blue shadow-lg shadow-accent-blue/30 scale-105'
                : isToday
                ? 'bg-dark-tertiary border-2 border-accent-blue/50'
                : 'bg-dark-tertiary hover:bg-dark-hover'
            }`}
          >
            {/* Day label */}
            <span className={`text-[11px] font-semibold uppercase ${
              isSelected
                ? 'text-dark-primary'
                : isToday
                ? 'text-accent-blue'
                : 'text-dark-text-muted'
            }`}>
              {dayLabels[index]}
            </span>

            {/* Day number */}
            <span className={`text-[18px] font-bold ${
              isSelected
                ? 'text-dark-primary'
                : isToday
                ? 'text-dark-text-primary'
                : 'text-dark-text-secondary'
            }`}>
              {dayNum}
            </span>

            {/* Completion percentage */}
            <span className={`text-[11px] font-mono ${
              isSelected
                ? 'text-dark-primary/80'
                : !hasTasks || isFuture
                ? 'text-dark-text-muted'
                : percentage === 100
                ? 'text-accent-green'
                : 'text-dark-text-secondary'
            }`}>
              {isFuture || !hasTasks ? '—' : `${percentage}%`}
            </span>

            {/* Today indicator dot */}
            {isToday && !isSelected && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-accent-blue rounded-full" />
            )}

            {/* Selection indicator */}
            {isSelected && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-dark-primary rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}
