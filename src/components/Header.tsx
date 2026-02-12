import { useState, useEffect, memo } from 'react';
import { useApp } from '../context/AppContext';
import { formatDateToLocal } from '../utils/storage';

// Separate component for the clock to prevent re-rendering the entire header
const Clock = memo(function Clock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <span className="text-xl font-mono text-dark-text-primary tracking-wide">
      {formattedTime}
    </span>
  );
});

// Separate component for progress tooltip to isolate time-based calculations
const ProgressTooltip = memo(function ProgressTooltip() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60000); // Update every minute is sufficient for progress
    return () => clearInterval(timer);
  }, []);

  const dayProgress = ((now.getHours() * 60 + now.getMinutes()) / (24 * 60)) * 100;
  const dayOfWeek = now.getDay() || 7;
  const weekProgress = ((dayOfWeek - 1 + dayProgress / 100) / 7) * 100;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = ((now.getDate() - 1 + dayProgress / 100) / daysInMonth) * 100;

  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((now.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const daysInYear = (now.getFullYear() % 4 === 0 && (now.getFullYear() % 100 !== 0 || now.getFullYear() % 400 === 0)) ? 366 : 365;
  const yearProgress = ((dayOfYear - 1 + dayProgress / 100) / daysInYear) * 100;

  return (
    <div className="absolute right-0 top-full mt-2 bg-dark-secondary border border-dark-border rounded-lg p-4 shadow-xl z-50 min-w-[220px]">
      <div className="text-[12px] font-semibold text-dark-text-secondary mb-3 uppercase tracking-wide">
        Time Progress
      </div>
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-dark-text-secondary">Day</span>
            <span className="text-dark-text-primary font-mono">{dayProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent-blue rounded-full transition-all" style={{ width: `${dayProgress}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-dark-text-secondary">Week</span>
            <span className="text-dark-text-primary font-mono">{weekProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-accent-green rounded-full transition-all" style={{ width: `${weekProgress}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-dark-text-secondary">Month</span>
            <span className="text-dark-text-primary font-mono">{monthProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${monthProgress}%` }} />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[12px] mb-1">
            <span className="text-dark-text-secondary">Year</span>
            <span className="text-dark-text-primary font-mono">{yearProgress.toFixed(1)}%</span>
          </div>
          <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${yearProgress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
});

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
}

export function Header({ onMenuClick, showMenuButton }: HeaderProps) {
  const { state, setSelectedDate } = useApp();
  const { selectedDate } = state;
  const [showProgressTooltip, setShowProgressTooltip] = useState(false);

  // Get additional date context
  const date = new Date(selectedDate + 'T00:00:00');
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor(
    (date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);
  const daysInYear = (date.getFullYear() % 4 === 0 &&
    (date.getFullYear() % 100 !== 0 || date.getFullYear() % 400 === 0)) ? 366 : 365;
  const daysLeft = daysInYear - dayOfYear;

  const navigateDate = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(formatDateToLocal(newDate));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  // Format date as "Thursday, Jan 9"
  const formattedDate = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="px-4 md:px-6 lg:px-8 py-3 md:py-4">
      {/* Date navigation and info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 md:gap-4">
          {/* Mobile menu button */}
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="w-9 h-9 bg-dark-tertiary rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-dark-hover mr-1"
            >
              <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
              <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
              <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
            </button>
          )}

          {/* Current time - separate component to prevent re-renders */}
          <span className="hidden md:inline"><Clock /></span>

          <div className="w-px h-6 bg-dark-border hidden md:block" />

          <button
            onClick={() => navigateDate(-1)}
            className="w-8 h-8 bg-dark-tertiary rounded-md flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <span className="text-base md:text-xl font-semibold text-dark-text-primary">
            {formattedDate}
          </span>

          <button
            onClick={() => navigateDate(1)}
            className="w-8 h-8 bg-dark-tertiary rounded-md flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="relative hidden md:block">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-8 h-8"
            />
            <button className="w-8 h-8 bg-dark-tertiary rounded-md flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary">
              📅
            </button>
          </div>
        </div>

        {/* Days left with hover tooltip - hidden on mobile */}
        <div
          className="relative hidden md:block"
          onMouseEnter={() => setShowProgressTooltip(true)}
          onMouseLeave={() => setShowProgressTooltip(false)}
        >
          <span className="text-[13px] text-dark-text-muted cursor-help">
            Week {weekNumber} · {daysLeft} days left in year
          </span>

          {/* Progress Tooltip - separate component for performance */}
          {showProgressTooltip && <ProgressTooltip />}
        </div>
      </div>
    </div>
  );
}
