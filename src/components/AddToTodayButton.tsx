import { useApp } from '../context/AppContext';
import { getTodayISO } from '../utils/storage';

interface AddToTodayButtonProps {
  goalId: string;
  taskId: string;
  scheduledDates: string[];
  size?: 'sm' | 'md';
}

export function AddToTodayButton({
  goalId,
  taskId,
  scheduledDates,
  size = 'md',
}: AddToTodayButtonProps) {
  const { toggleTaskScheduleToday } = useApp();
  const today = getTodayISO();
  const isScheduledToday = scheduledDates.includes(today);

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  const buttonSize = size === 'sm' ? 'p-1' : 'p-1.5';

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        toggleTaskScheduleToday(goalId, taskId);
      }}
      className={`${buttonSize} rounded transition-colors flex-shrink-0 ${
        isScheduledToday
          ? 'text-accent-green bg-accent-green/10 hover:bg-accent-green/20'
          : 'text-dark-text-muted hover:text-accent-blue hover:bg-dark-tertiary'
      }`}
      title={isScheduledToday ? 'Scheduled for today - click to remove' : 'Add to today'}
    >
      {isScheduledToday ? (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
        </svg>
      ) : (
        <svg className={iconSize} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4m-2-2h4" />
        </svg>
      )}
    </button>
  );
}
