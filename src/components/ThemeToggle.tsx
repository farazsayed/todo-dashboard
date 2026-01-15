import { useApp } from '../context/AppContext';

export function ThemeToggle() {
  const { state, toggleTheme } = useApp();
  const isDark = state.theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 w-full rounded-lg text-[13px] text-dark-text-secondary hover:bg-dark-tertiary hover:text-dark-text-primary transition-all btn-scale"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-10 h-5 bg-dark-tertiary rounded-full transition-colors">
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${
            isDark
              ? 'left-0.5 bg-dark-text-muted'
              : 'left-5 bg-accent-yellow'
          }`}
        />
      </div>
      <span>{isDark ? 'Dark' : 'Light'} Mode</span>
      <span className="ml-auto text-[11px] text-dark-text-muted">
        {isDark ? '🌙' : '☀️'}
      </span>
    </button>
  );
}
