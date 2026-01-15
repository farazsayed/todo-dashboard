import { useApp } from '../context/AppContext';
import { getTasksForDate, getRecurringTasksForDate, getTodayISO, getDaysInMonth, getStartDayOfMonth, formatDateToLocal } from '../utils/storage';
import { getCompletionForDate } from '../utils/stats';

export function MonthView() {
  const { state, setSelectedDate } = useApp();
  const { selectedDate, projects, recurringTasks, oneOffTasks, habits } = state;
  const today = getTodayISO();

  // Get month from selected date
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const year = selectedDateObj.getFullYear();
  const month = selectedDateObj.getMonth();

  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfMonth(year, month);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday start

  const monthName = selectedDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const navigateMonth = (direction: number) => {
    const newDate = new Date(year, month + direction, 1);
    setSelectedDate(formatDateToLocal(newDate));
  };

  // Generate calendar days
  const calendarDays: (string | null)[] = [];

  // Add empty cells for days before the month starts
  for (let i = 0; i < adjustedStartDay; i++) {
    calendarDays.push(null);
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push(dateStr);
  }

  return (
    <div className="space-y-4">
      {/* Month Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg bg-dark-secondary hover:bg-dark-tertiary text-dark-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-[18px] font-semibold text-dark-text-primary">{monthName}</h2>
        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg bg-dark-secondary hover:bg-dark-tertiary text-dark-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Labels */}
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map(day => (
          <div key={day} className="text-center text-[11px] font-semibold text-dark-text-muted uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((dateStr, index) => {
          if (!dateStr) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const isFuture = dateStr > today;
          const dayNum = new Date(dateStr + 'T00:00:00').getDate();

          const tasksForDay = getTasksForDate(projects, dateStr);
          const recurringForDay = getRecurringTasksForDate(recurringTasks, dateStr);
          const oneOffForDay = oneOffTasks.filter(t => t.dueDate === dateStr);
          const totalTasks = tasksForDay.length + recurringForDay.length + oneOffForDay.length + habits.length;

          const completion = getCompletionForDate(projects, dateStr);
          const hasAnyTasks = totalTasks > 0;

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`aspect-square flex flex-col items-center justify-center gap-1 rounded-lg transition-all relative ${
                isSelected
                  ? 'bg-accent-blue shadow-lg'
                  : isToday
                  ? 'bg-dark-tertiary border-2 border-accent-blue/50'
                  : 'bg-dark-secondary hover:bg-dark-tertiary'
              }`}
            >
              <span className={`text-[14px] font-semibold ${
                isSelected ? 'text-dark-primary' : isToday ? 'text-accent-blue' : 'text-dark-text-primary'
              }`}>
                {dayNum}
              </span>

              {hasAnyTasks && !isFuture && (
                <div className={`text-[10px] font-mono ${
                  isSelected ? 'text-dark-primary/80' : completion === 100 ? 'text-accent-green' : 'text-dark-text-muted'
                }`}>
                  {completion}%
                </div>
              )}

              {/* Task indicators */}
              {hasAnyTasks && (
                <div className="flex gap-0.5 absolute bottom-1">
                  {tasksForDay.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-accent-blue" />
                  )}
                  {recurringForDay.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-accent-orange" />
                  )}
                  {oneOffForDay.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-accent-purple" />
                  )}
                  {habits.length > 0 && (
                    <div className="w-1 h-1 rounded-full bg-accent-green" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-dark-text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-blue" />
          <span>Project Tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-orange" />
          <span>Recurring</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-purple" />
          <span>One-off</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-accent-green" />
          <span>Habits</span>
        </div>
      </div>
    </div>
  );
}
