import { useState } from 'react';
import type { Goal, RecurringTask, Habit } from '../types';
import type { WeatherData } from '../utils/weather';
import { useApp } from '../context/AppContext';
import { PomodoroTimer } from './PomodoroTimer';
import { TimezoneTool } from './TimezoneTool';
import { getWeeklyStats, compareWeeks } from '../utils/stats';
import { resetToSampleData } from '../utils/storage';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSelectGoal: (goal: Goal | null) => void;
  onSelectTask: (goalId: string, taskId: string) => void;
  onSelectRecurringTask: (task: RecurringTask | null) => void;
  onSelectHabit: (habit: Habit | null) => void;
  onQuickAddTask: () => void;
  onExpandGoals: () => void;
  onScheduleTask: () => void;
  weather: WeatherData | null;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  onSelectGoal,
  onSelectTask,
  onSelectRecurringTask,
  onSelectHabit,
  onQuickAddTask,
  onExpandGoals,
  onScheduleTask,
  weather,
}: SidebarProps) {
  const { state, toggleTaskCompletion, addTask, dispatch } = useApp();
  const { goals, habits, selectedDate } = state;
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());
  const [addingTaskToGoal, setAddingTaskToGoal] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const weeklyStats = getWeeklyStats(goals, selectedDate);
  const comparison = compareWeeks(goals, selectedDate);

  const toggleGoalExpand = (goalId: string) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) {
        next.delete(goalId);
      } else {
        next.add(goalId);
      }
      return next;
    });
  };

  const handleAddTask = (goalId: string) => {
    if (newTaskTitle.trim()) {
      addTask(goalId, newTaskTitle.trim());
      setNewTaskTitle('');
      setAddingTaskToGoal(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, goalId: string) => {
    if (e.key === 'Enter') {
      handleAddTask(goalId);
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setAddingTaskToGoal(null);
    }
  };

  const toggleHabit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(selectedDate);
    dispatch({
      type: 'UPDATE_HABIT',
      payload: {
        ...habit,
        completedDates: isCompleted
          ? habit.completedDates.filter(d => d !== selectedDate)
          : [...habit.completedDates, selectedDate]
      }
    });
  };

  const handleResetToSampleData = () => {
    if (confirm('Reset all data to sample data? This cannot be undone.')) {
      const sampleData = resetToSampleData();
      dispatch({ type: 'SET_STATE', payload: sampleData });
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
            <span className="text-lg font-bold">+</span>
          </button>
          <button
            onClick={onScheduleTask}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-accent-blue hover:bg-dark-hover"
            title="Schedule Goal Task"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onSelectGoal(null)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="New Goal"
          >
            🎯
          </button>
          <button
            onClick={() => onSelectRecurringTask(null)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="New Recurring"
          >
            🔄
          </button>
          <button
            onClick={() => onSelectHabit(null)}
            className="w-10 h-10 bg-dark-tertiary rounded-lg flex items-center justify-center text-dark-text-secondary hover:bg-dark-hover"
            title="New Habit"
          >
            ✓
          </button>
        </div>

        {/* Weather icon */}
        {weather && (
          <div className="mt-auto mb-4 text-center">
            <div className="text-lg">{getWeatherEmoji(weather.condition)}</div>
            <div className="text-[11px] text-dark-text-secondary font-mono">{weather.temperature}°</div>
          </div>
        )}
      </div>
    );
  }

  // Expanded view
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

      {/* Daily Info */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
          Daily Info
        </div>
        <div className="flex flex-col gap-2">
          {weather ? (
            <>
              <div className="flex items-center gap-2 text-[13px] text-dark-text-secondary">
                <span>{getWeatherEmoji(weather.condition)}</span>
                <span>{weather.temperature}°F — {weather.condition}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-dark-text-secondary">
                <span className="text-dark-text-muted">H:</span>
                <span>{weather.highTemp}°</span>
                <span className="text-dark-text-muted">L:</span>
                <span>{weather.lowTemp}°</span>
                <span className="text-dark-text-muted mx-1">·</span>
                <span>💨</span>
                <span>{weather.windSpeed} mph {weather.windDirection}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-dark-text-secondary">
                <span>🌅</span>
                <span>{weather.sunrise}</span>
                <span className="text-dark-text-muted mx-1">·</span>
                <span>🌇</span>
                <span>{weather.sunset}</span>
              </div>
            </>
          ) : (
            <div className="text-[13px] text-dark-text-muted">Loading weather...</div>
          )}
          <PomodoroTimer />
        </div>
      </div>

      {/* Goals */}
      <div className="p-4 border-b border-dark-border">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted">
            🎯 Goals
          </div>
          <button
            onClick={onExpandGoals}
            className="text-dark-text-muted hover:text-dark-text-primary p-1"
            title="Expand goals view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="text-[13px] text-dark-text-muted">No goals yet</p>
        ) : (
          <div className="space-y-2">
            {goals.map(goal => {
              const isExpanded = expandedGoals.has(goal.id);
              const completedTasks = goal.tasks.filter(t => t.completed).length;
              const totalTasks = goal.tasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div key={goal.id} className="bg-dark-tertiary rounded-lg overflow-hidden">
                  <div
                    className="flex items-center gap-2 cursor-pointer p-2.5 group hover:bg-dark-hover"
                    onClick={() => toggleGoalExpand(goal.id)}
                  >
                    <span className={`text-dark-text-muted text-[10px] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                    <div
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: goal.color }}
                    />
                    <span className="text-[13px] font-medium text-dark-text-primary flex-1 truncate">
                      {goal.title}
                    </span>
                    <span className="text-[11px] text-dark-text-muted font-mono">{progress}%</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectGoal(goal);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-dark-text-muted hover:text-dark-text-secondary p-1"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="px-2.5 pb-2.5">
                      {goal.tasks.length > 0 && (
                        <div className="space-y-1 mb-2">
                          {goal.tasks.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 text-[12px] text-dark-text-secondary py-1.5 px-2 rounded hover:bg-dark-secondary cursor-pointer group"
                              onClick={() => onSelectTask(goal.id, task.id)}
                            >
                              <input
                                type="checkbox"
                                checked={task.completedDates.includes(selectedDate)}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompletion(goal.id, task.id, selectedDate);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-3.5 h-3.5"
                              />
                              <span className={`flex-1 ${task.completedDates.includes(selectedDate) ? 'line-through text-dark-text-muted' : ''}`}>
                                {task.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {/* Add task input or button */}
                      {addingTaskToGoal === goal.id ? (
                        <div className="flex items-center gap-2 pl-2">
                          <input
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, goal.id)}
                            onBlur={() => {
                              if (!newTaskTitle.trim()) {
                                setAddingTaskToGoal(null);
                              }
                            }}
                            placeholder="Task name..."
                            autoFocus
                            className="flex-1 bg-dark-secondary border border-dark-border rounded px-2 py-1.5 text-[12px] text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                          />
                          <button
                            onClick={() => handleAddTask(goal.id)}
                            className="text-accent-green hover:text-accent-green/80 p-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddingTaskToGoal(goal.id);
                          }}
                          className="flex items-center gap-1.5 text-[11px] text-dark-text-muted hover:text-dark-text-secondary pl-2 py-1"
                        >
                          <span className="text-accent-green">+</span> Add subtask
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Habits */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
          ✓ Habits
        </div>
        {habits.length === 0 ? (
          <p className="text-[13px] text-dark-text-muted">No habits yet</p>
        ) : (
          <div className="space-y-2">
            {habits.map(habit => (
              <div key={habit.id} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={habit.completedDates.includes(selectedDate)}
                    onChange={() => toggleHabit(habit.id)}
                    className="w-4.5 h-4.5"
                  />
                  <span className="text-[13px] text-dark-text-secondary">{habit.title}</span>
                </div>
                {habit.currentStreak > 0 && (
                  <span className="flex items-center gap-1 text-[12px] text-streak-fire font-mono">
                    🔥 {habit.currentStreak}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Weekly Snapshot */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
          Weekly Snapshot
        </div>
        <div className="space-y-1.5">
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
      </div>

      {/* View Modes */}
      <div className="p-4 border-b border-dark-border">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
          View
        </div>
        <div className="space-y-1">
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
        </div>
      </div>

      {/* Quick Add */}
      <div className="p-4 border-b border-dark-border mt-auto">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
          Quick Add
        </div>
        <div className="flex flex-col gap-1.5">
          <button
            onClick={onQuickAddTask}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
          >
            <span className="text-accent-green font-semibold">+</span> New Task
          </button>
          <button
            onClick={onScheduleTask}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-accent-blue/50 rounded-lg text-dark-text-secondary text-[13px] hover:border-accent-blue hover:text-dark-text-primary hover:bg-accent-blue/10 text-left"
          >
            <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Goal Task
          </button>
          <button
            onClick={() => onSelectRecurringTask(null)}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
          >
            <span className="text-accent-green font-semibold">+</span> New Recurring
          </button>
          <button
            onClick={() => onSelectHabit(null)}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
          >
            <span className="text-accent-green font-semibold">+</span> New Habit
          </button>
          <button
            onClick={() => onSelectGoal(null)}
            className="flex items-center gap-2.5 px-3 py-2.5 bg-transparent border border-dashed border-dark-border rounded-lg text-dark-text-secondary text-[13px] hover:border-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary text-left"
          >
            <span className="text-accent-green font-semibold">+</span> New Goal
          </button>
        </div>
      </div>

      {/* Timezone Tool */}
      <TimezoneTool />

      {/* Reset Data */}
      <div className="p-4">
        <button
          onClick={handleResetToSampleData}
          className="w-full px-3 py-2 text-[12px] bg-dark-tertiary text-dark-text-muted rounded-lg hover:bg-red-500/20 hover:text-red-400 border border-dark-border hover:border-red-500/30"
        >
          Reset to Sample Data
        </button>
      </div>
    </>
  );
}

function getWeatherEmoji(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes('clear') || lower.includes('sunny')) return '☀️';
  if (lower.includes('cloud')) return '☁️';
  if (lower.includes('rain')) return '🌧️';
  if (lower.includes('snow')) return '❄️';
  if (lower.includes('storm') || lower.includes('thunder')) return '⛈️';
  if (lower.includes('fog') || lower.includes('mist')) return '🌫️';
  return '🌤️';
}
