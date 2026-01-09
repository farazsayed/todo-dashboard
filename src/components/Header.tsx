import { useApp } from '../context/AppContext';

export function Header() {
  const { state, setSelectedDate } = useApp();
  const { selectedDate } = state;

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
    setSelectedDate(newDate.toISOString().split('T')[0]);
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
    <div className="px-6 md:px-8 py-5 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigateDate(-1)}
          className="w-8 h-8 bg-dark-tertiary rounded-md flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-xl font-semibold text-dark-text-primary">
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

        <div className="relative">
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

      <span className="text-[13px] text-dark-text-muted">
        Week {weekNumber} · {daysLeft} days left in year
      </span>
    </div>
  );
}
