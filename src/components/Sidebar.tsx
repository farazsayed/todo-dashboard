import { useState, useEffect } from 'react';
import type { Project, RecurringTask, Habit, ReadingItem } from '../types';
import { type WeatherData, getWeatherEmoji } from '../utils/weather';
import { useApp } from '../context/AppContext';
import { PomodoroTimer } from './PomodoroTimer';
import { TimezoneTool } from './TimezoneTool';
import { ThemeToggle } from './ThemeToggle';
import { GroceryList } from './GroceryList';
import { getWeeklyStats, compareWeeks } from '../utils/stats';
import { resetToSampleData, clearAllData, generateId } from '../utils/storage';

// Quick Link interface
interface QuickLink {
  id: string;
  name: string;
  url: string;
}

// Storage key for quick links
const QUICK_LINKS_KEY = 'quickLinks';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectProject: (project: Project | null) => void;
  onSelectRecurringTask: (task: RecurringTask | null) => void;
  onSelectHabit: (habit: Habit | null) => void;
  onQuickAddTask: () => void;
  onExpandProjects: () => void;
  onScheduleTask: () => void;
  weather: WeatherData | null;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onSelectProject,
  onSelectRecurringTask,
  onSelectHabit,
  onQuickAddTask,
  onExpandProjects,
  onScheduleTask,
  weather,
}: SidebarProps) {
  const { state, dispatch, addReadingItem, deleteReadingItem, updateReadingStatus } = useApp();
  const { projects, selectedDate, readingList = [] } = state;

  // Quick Links state
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [newLinkName, setNewLinkName] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');

  // Grocery list state
  const [groceryListOpen, setGroceryListOpen] = useState(false);

  // Reading list state
  const [readingListExpanded, setReadingListExpanded] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [newBookTitle, setNewBookTitle] = useState('');
  const [newBookAuthor, setNewBookAuthor] = useState('');
  const [newBookLink, setNewBookLink] = useState('');

  // Collapsible section state - persist to localStorage
  const COLLAPSED_SECTIONS_KEY = 'sidebarCollapsedSections';
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(() => {
    const saved = localStorage.getItem(COLLAPSED_SECTIONS_KEY);
    if (saved) {
      try {
        return new Set(JSON.parse(saved));
      } catch {
        return new Set();
      }
    }
    return new Set();
  });

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify([...newSet]));
      return newSet;
    });
  };

  const isSectionCollapsed = (section: string) => collapsedSections.has(section);

  // Load quick links from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(QUICK_LINKS_KEY);
    if (saved) {
      try {
        setQuickLinks(JSON.parse(saved));
      } catch {
        setQuickLinks([]);
      }
    }
  }, []);

  // Save quick links to localStorage
  const saveQuickLinks = (links: QuickLink[]) => {
    localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(links));
    setQuickLinks(links);
  };

  const handleAddQuickLink = () => {
    if (newLinkName.trim() && newLinkUrl.trim()) {
      const newLink: QuickLink = {
        id: generateId(),
        name: newLinkName.trim(),
        url: newLinkUrl.trim().startsWith('http') ? newLinkUrl.trim() : `https://${newLinkUrl.trim()}`,
      };
      saveQuickLinks([...quickLinks, newLink]);
      setNewLinkName('');
      setNewLinkUrl('');
      setIsAddingLink(false);
    }
  };

  const handleDeleteQuickLink = (id: string) => {
    saveQuickLinks(quickLinks.filter(link => link.id !== id));
  };

  // Get favicon URL for a link
  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // Reading list handlers
  const handleAddBook = () => {
    if (newBookTitle.trim()) {
      addReadingItem(
        newBookTitle.trim(),
        newBookAuthor.trim() || undefined,
        newBookLink.trim() || undefined
      );
      setNewBookTitle('');
      setNewBookAuthor('');
      setNewBookLink('');
      setIsAddingBook(false);
    }
  };

  const getStatusIcon = (status: ReadingItem['status']) => {
    switch (status) {
      case 'want-to-read': return '📚';
      case 'reading': return '📖';
      case 'completed': return '✅';
    }
  };

  const getNextStatus = (status: ReadingItem['status']): ReadingItem['status'] => {
    switch (status) {
      case 'want-to-read': return 'reading';
      case 'reading': return 'completed';
      case 'completed': return 'want-to-read';
    }
  };

  // Group reading list by status
  const readingByStatus = {
    reading: readingList.filter(b => b.status === 'reading'),
    'want-to-read': readingList.filter(b => b.status === 'want-to-read'),
    completed: readingList.filter(b => b.status === 'completed'),
  };

  const weeklyStats = getWeeklyStats(projects, selectedDate);
  const comparison = compareWeeks(projects, selectedDate);

  const handleResetToSampleData = () => {
    if (confirm('Reset all data to sample data? This cannot be undone.')) {
      const sampleData = resetToSampleData();
      dispatch({ type: 'SET_STATE', payload: sampleData });
    }
  };

  const handleClearAllData = () => {
    if (confirm('Clear ALL data and start fresh? This cannot be undone.')) {
      const emptyState = clearAllData();
      dispatch({ type: 'SET_STATE', payload: emptyState });
    }
  };

  // Collapsed view
  if (collapsed) {
    return (
      <div className="flex flex-col items-center py-4 h-full">
        {/* Hamburger */}
        <button
          onClick={onToggleCollapse}
          className="w-10 h-10 bg-dark-tertiary rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-dark-hover mb-4"
        >
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
        </button>

        {/* Quick icons */}
        <div className="flex flex-col items-center gap-3 mt-2">
          <button
            onClick={onQuickAddTask}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-accent-green hover:bg-dark-hover"
            title="Quick Add"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            onClick={onExpandProjects}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="Projects"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </button>
          <button
            onClick={() => onSelectRecurringTask(null)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="New Recurring"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => onSelectHabit(null)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="New Habit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>
          <button
            onClick={onScheduleTask}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="Schedule Project Task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => setGroceryListOpen(true)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="Grocery List"
          >
            <span className="text-base">🛒</span>
          </button>
          <button
            onClick={() => setReadingListExpanded(true)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="Reading List"
          >
            <span className="text-base">📚</span>
          </button>
        </div>

        {/* Weather icon */}
        {weather && (
          <div className="mt-auto mb-4 text-center">
            <div className="text-lg">{getWeatherEmoji(weather.condition)}</div>
            <div className="text-[11px] text-dark-text-secondary font-mono">{weather.temperature}°</div>
          </div>
        )}

        {/* Grocery List Modal - also needed in collapsed view */}
        <GroceryList
          isOpen={groceryListOpen}
          onClose={() => setGroceryListOpen(false)}
        />
      </div>
    );
  }

  // Section header component
  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted hover:text-dark-text-secondary"
    >
      <span>{title}</span>
      <svg
        className={`w-3.5 h-3.5 transition-transform ${isSectionCollapsed(id) ? '-rotate-90' : ''}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  );

  // Expanded view - New order: Daily Info, View, Weekly Snapshot, Quick Add, Projects, Habits, Time Zones
  return (
    <>
      {/* Sidebar Header */}
      <div className="p-5 border-b border-dark-border flex items-center gap-3">
        <button
          onClick={onToggleCollapse}
          className="w-9 h-9 bg-dark-tertiary rounded-lg flex flex-col items-center justify-center gap-1 hover:bg-dark-hover"
        >
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
          <span className="w-4 h-0.5 bg-dark-text-secondary rounded-sm"></span>
        </button>
        <span className="text-lg font-semibold text-dark-text-primary">Daily Flow</span>
      </div>

      {/* 1. Weather */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="weather" title="Weather" />
        {!isSectionCollapsed('weather') && (
          <div className="mt-3">
            {weather ? (
              <div className="bg-dark-tertiary rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getWeatherEmoji(weather.condition)}</span>
                    <div>
                      <div className="text-lg font-semibold text-dark-text-primary">{weather.temperature}°F</div>
                      <div className="text-[11px] text-dark-text-muted">{weather.condition}</div>
                    </div>
                  </div>
                  <div className="text-right text-[12px]">
                    <div className="text-dark-text-secondary">
                      <span className="text-dark-text-muted">H:</span> {weather.highTemp}° <span className="text-dark-text-muted">L:</span> {weather.lowTemp}°
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px] text-dark-text-muted pt-2 border-t border-dark-border">
                  <span>🌅 {weather.sunrise}</span>
                  <span>🌇 {weather.sunset}</span>
                  <span>💨 {weather.windSpeed} mph</span>
                </div>
              </div>
            ) : (
              <div className="text-[13px] text-dark-text-muted">Loading weather...</div>
            )}
          </div>
        )}
      </div>

      {/* 2. Pomodoro Timer */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="timer" title="Focus Timer" />
        {!isSectionCollapsed('timer') && (
          <div className="mt-3">
            <PomodoroTimer />
          </div>
        )}
      </div>

      {/* 3. View Modes (with Projects at bottom) */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="view" title="View" />
        {!isSectionCollapsed('view') && (
        <div className="space-y-1 mt-3">
          {[
            { label: 'Day', value: 'day' as const },
            { label: 'Week', value: 'week' as const },
            { label: 'Month', value: 'month' as const },
            { label: 'Stats', value: 'stats' as const },
          ].map(({ label, value }) => {
            const isActive = state.viewMode === value;
            return (
              <button
                key={value}
                onClick={() => dispatch({ type: 'SET_VIEW_MODE', payload: value })}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-left ${
                  isActive
                    ? 'bg-dark-tertiary text-dark-text-primary'
                    : 'text-dark-text-secondary hover:bg-dark-tertiary hover:text-dark-text-primary'
                }`}
              >
                <div className={`w-3.5 h-3.5 border-2 rounded-full relative ${
                  isActive ? 'border-accent-blue' : 'border-dark-text-muted'
                }`}>
                  {isActive && (
                    <div className="absolute inset-1 bg-accent-blue rounded-full" />
                  )}
                </div>
                {label}
              </button>
            );
          })}
          {/* Projects link at bottom of View section */}
          <button
            onClick={onExpandProjects}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-left text-dark-text-secondary hover:bg-dark-tertiary hover:text-dark-text-primary"
          >
            <div className="w-3.5 h-3.5 flex items-center justify-center">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            Projects
          </button>
        </div>
        )}
      </div>

      {/* 3. Weekly Snapshot */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="snapshot" title="Weekly Snapshot" />
        {!isSectionCollapsed('snapshot') && (
          <div className="space-y-1.5 mt-3">
            <div className="flex justify-between text-[13px]">
              <span className="text-dark-text-secondary">Avg completion</span>
              <span className="text-dark-text-primary font-medium">{weeklyStats.avgCompletion}%</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-dark-text-secondary">vs last week</span>
              <span className={`font-medium ${
                comparison.direction === 'up' ? 'text-accent-green' :
                comparison.direction === 'down' ? 'text-red-500' :
                'text-dark-text-primary'
              }`}>
                {comparison.direction === 'up' && '↑ '}
                {comparison.direction === 'down' && '↓ '}
                {comparison.difference}%
              </span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span className="text-dark-text-secondary">Best day</span>
              <span className="text-dark-text-primary font-medium">{weeklyStats.bestDay}</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Quick Add */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="quickadd" title="Quick Add" />
        {!isSectionCollapsed('quickadd') && (
          <div className="flex flex-col gap-1.5 mt-3">
            <button
              onClick={onQuickAddTask}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
            >
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Task
            </button>
            <button
              onClick={() => onSelectRecurringTask(null)}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
            >
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Recurring
            </button>
            <button
              onClick={() => onSelectHabit(null)}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
            >
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Habit
            </button>
            <button
              onClick={() => onSelectProject(null)}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
            >
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
            <button
              onClick={onScheduleTask}
              className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
            >
              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Project Task
            </button>
          </div>
        )}
      </div>

      {/* 5. Quick Links */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="quicklinks" title="Quick Links" />
        {!isSectionCollapsed('quicklinks') && (
        <div className="mt-3">
        {quickLinks.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {quickLinks.map(link => (
              <div key={link.id} className="flex items-center gap-2 group">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center gap-2.5 px-2.5 py-2 bg-dark-tertiary rounded-lg text-[13px] text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
                >
                  {getFaviconUrl(link.url) ? (
                    <img
                      src={getFaviconUrl(link.url)!}
                      alt=""
                      className="w-4 h-4 rounded-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  )}
                  <span className="truncate">{link.name}</span>
                </a>
                <button
                  onClick={() => handleDeleteQuickLink(link.id)}
                  className="p-1.5 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        {isAddingLink ? (
          <div className="space-y-2">
            <input
              type="text"
              value={newLinkName}
              onChange={(e) => setNewLinkName(e.target.value)}
              placeholder="Link name..."
              autoFocus
              className="w-full px-2.5 py-2 text-[13px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
            />
            <input
              type="text"
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="URL (e.g., google.com)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddQuickLink();
                if (e.key === 'Escape') {
                  setIsAddingLink(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }
              }}
              className="w-full px-2.5 py-2 text-[13px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddQuickLink}
                className="flex-1 px-3 py-1.5 text-[12px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setIsAddingLink(false);
                  setNewLinkName('');
                  setNewLinkUrl('');
                }}
                className="px-3 py-1.5 text-[12px] bg-dark-tertiary text-dark-text-secondary rounded-lg hover:bg-dark-hover"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingLink(true)}
            className="flex items-center gap-2 px-2.5 py-2 text-[12px] text-dark-text-muted hover:text-dark-text-secondary"
          >
            <svg className="w-3.5 h-3.5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add quick link
          </button>
        )}
        </div>
        )}
      </div>

      {/* 6. Lists (Grocery & Reading) */}
      <div className="p-4 border-b border-dark-border">
        <SectionHeader id="lists" title="Lists" />
        {!isSectionCollapsed('lists') && (
          <div className="mt-3 space-y-2">
            <button
              onClick={() => setGroceryListOpen(true)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-dark-tertiary rounded-lg text-[13px] text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
            >
              <span className="text-base">🛒</span>
              <span>Grocery List</span>
            </button>

            {/* Reading List */}
            <div className="bg-dark-tertiary rounded-lg overflow-hidden">
              <button
                onClick={() => setReadingListExpanded(!readingListExpanded)}
                className="w-full flex items-center justify-between gap-2.5 px-3 py-2.5 text-[13px] text-dark-text-secondary hover:bg-dark-hover hover:text-dark-text-primary"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base">📚</span>
                  <span>Reading List</span>
                  {readingList.length > 0 && (
                    <span className="text-[10px] text-dark-text-muted bg-dark-secondary px-1.5 py-0.5 rounded">
                      {readingList.length}
                    </span>
                  )}
                </div>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${readingListExpanded ? '' : '-rotate-90'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {readingListExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  {/* Currently Reading */}
                  {readingByStatus.reading.length > 0 && (
                    <div>
                      <div className="text-[10px] text-dark-text-muted uppercase tracking-wide mb-1.5">Reading</div>
                      <div className="space-y-1">
                        {readingByStatus.reading.map(book => (
                          <div key={book.id} className="flex items-center gap-2 group">
                            <button
                              onClick={() => updateReadingStatus(book.id, getNextStatus(book.status))}
                              className="text-sm"
                              title="Mark as completed"
                            >
                              {getStatusIcon(book.status)}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-dark-text-primary truncate">{book.title}</div>
                              {book.author && (
                                <div className="text-[10px] text-dark-text-muted truncate">{book.author}</div>
                              )}
                            </div>
                            {book.link && (
                              <a
                                href={book.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-accent-blue hover:text-accent-blue/80"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => deleteReadingItem(book.id)}
                              className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Want to Read */}
                  {readingByStatus['want-to-read'].length > 0 && (
                    <div>
                      <div className="text-[10px] text-dark-text-muted uppercase tracking-wide mb-1.5">Want to Read</div>
                      <div className="space-y-1">
                        {readingByStatus['want-to-read'].map(book => (
                          <div key={book.id} className="flex items-center gap-2 group">
                            <button
                              onClick={() => updateReadingStatus(book.id, getNextStatus(book.status))}
                              className="text-sm"
                              title="Start reading"
                            >
                              {getStatusIcon(book.status)}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] text-dark-text-primary truncate">{book.title}</div>
                              {book.author && (
                                <div className="text-[10px] text-dark-text-muted truncate">{book.author}</div>
                              )}
                            </div>
                            {book.link && (
                              <a
                                href={book.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-accent-blue hover:text-accent-blue/80"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => deleteReadingItem(book.id)}
                              className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Completed (collapsed by default, just show count) */}
                  {readingByStatus.completed.length > 0 && (
                    <div className="text-[10px] text-dark-text-muted">
                      {readingByStatus.completed.length} book{readingByStatus.completed.length > 1 ? 's' : ''} completed
                    </div>
                  )}

                  {/* Add book form */}
                  {isAddingBook ? (
                    <div className="space-y-2 pt-2 border-t border-dark-border">
                      <input
                        type="text"
                        value={newBookTitle}
                        onChange={(e) => setNewBookTitle(e.target.value)}
                        placeholder="Book title..."
                        autoFocus
                        className="w-full px-2 py-1.5 text-[12px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                      />
                      <input
                        type="text"
                        value={newBookAuthor}
                        onChange={(e) => setNewBookAuthor(e.target.value)}
                        placeholder="Author (optional)..."
                        className="w-full px-2 py-1.5 text-[12px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                      />
                      <input
                        type="text"
                        value={newBookLink}
                        onChange={(e) => setNewBookLink(e.target.value)}
                        placeholder="Link (optional)..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddBook();
                          if (e.key === 'Escape') {
                            setIsAddingBook(false);
                            setNewBookTitle('');
                            setNewBookAuthor('');
                            setNewBookLink('');
                          }
                        }}
                        className="w-full px-2 py-1.5 text-[12px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddBook}
                          className="flex-1 px-2 py-1 text-[11px] bg-accent-green text-dark-primary rounded hover:bg-accent-green/90"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => {
                            setIsAddingBook(false);
                            setNewBookTitle('');
                            setNewBookAuthor('');
                            setNewBookLink('');
                          }}
                          className="px-2 py-1 text-[11px] text-dark-text-muted hover:text-dark-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setIsAddingBook(true)}
                      className="flex items-center gap-1.5 text-[11px] text-dark-text-muted hover:text-dark-text-secondary pt-2 border-t border-dark-border w-full"
                    >
                      <svg className="w-3 h-3 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Add book
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 7. Timezone Tool */}
      <TimezoneTool />

      {/* Grocery List Modal */}
      <GroceryList
        isOpen={groceryListOpen}
        onClose={() => setGroceryListOpen(false)}
      />

      {/* 8. Settings */}
      <div className="p-4 border-t border-dark-border">
        <SectionHeader id="settings" title="Settings" />
        {!isSectionCollapsed('settings') && (
          <div className="space-y-2 mt-3">
            <ThemeToggle />
            <div className="text-[10px] text-dark-text-muted mt-3 mb-2">
              Keyboard shortcuts: N (new task), G (projects), T/W/M/S (views), D (theme)
            </div>
          </div>
        )}
      </div>

      {/* Data Management */}
      <div className="p-4 space-y-2">
        <button
          onClick={handleClearAllData}
          className="w-full px-3 py-2 text-[12px] bg-dark-tertiary text-dark-text-muted rounded-lg hover:bg-red-500/20 hover:text-red-400 border border-dark-border hover:border-red-500/30 btn-scale"
        >
          Clear All Data
        </button>
        <button
          onClick={handleResetToSampleData}
          className="w-full px-3 py-2 text-[12px] bg-dark-tertiary text-dark-text-muted rounded-lg hover:bg-dark-hover border border-dark-border btn-scale"
        >
          Reset to Sample Data
        </button>
      </div>
    </>
  );
}

