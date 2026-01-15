import { useState, useEffect } from 'react';
import type { RecurringTask } from '../types';
import { COLORS } from '../types';
import { useApp } from '../context/AppContext';
import { generateId, getTodayISO } from '../utils/storage';

type ScheduleType = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'interval' | 'monthly';

interface RecurringTaskEditorProps {
  task: RecurringTask | null;
  onClose: () => void;
}

export function RecurringTaskEditor({ task, onClose }: RecurringTaskEditorProps) {
  const { dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [quickLink, setQuickLink] = useState('');
  const [scheduleType, setScheduleType] = useState<ScheduleType>('daily');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [interval, setInterval] = useState(1);
  const [monthDay, setMonthDay] = useState(1);
  const [hasCounter, setHasCounter] = useState(false);
  const [targetCount, setTargetCount] = useState(5);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setColor(task.color);
      setQuickLink(task.quickLink || '');
      setScheduleType(task.schedule.type);
      setSelectedDays(task.schedule.days || []);
      setInterval(task.schedule.interval || 1);
      setMonthDay(task.schedule.monthDay || 1);
      setHasCounter(task.targetCount !== undefined);
      setTargetCount(task.targetCount || 5);
    } else {
      setTitle('');
      setColor(COLORS[0]);
      setQuickLink('');
      setScheduleType('daily');
      setSelectedDays([]);
      setInterval(1);
      setMonthDay(1);
      setHasCounter(false);
      setTargetCount(5);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: RecurringTask = {
        id: task?.id || generateId(),
        title: title.trim(),
        color,
        schedule: {
          type: scheduleType,
          days: scheduleType === 'weekly' ? selectedDays : undefined,
          interval: scheduleType === 'interval' ? interval : undefined,
          monthDay: scheduleType === 'monthly' ? monthDay : undefined,
          startDate: task?.schedule.startDate || getTodayISO(),
        },
        completedDates: task?.completedDates || [],
        skippedDates: task?.skippedDates || [],
        quickLink: quickLink.trim() || undefined,
        targetCount: hasCounter ? targetCount : undefined,
        currentCount: hasCounter ? (task?.currentCount || 0) : undefined,
      };

      if (task) {
        dispatch({ type: 'UPDATE_RECURRING_TASK', payload: newTask });
      } else {
        dispatch({ type: 'ADD_RECURRING_TASK', payload: newTask });
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (task && confirm('Delete this recurring task?')) {
      dispatch({ type: 'DELETE_RECURRING_TASK', payload: task.id });
      onClose();
    }
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          {task ? 'Edit Recurring Task' : 'New Recurring Task'}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title..."
            autoFocus
            className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          />
        </div>

        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-dark-secondary ring-white/50 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
            Schedule
          </label>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setScheduleType('daily')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'daily'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('weekdays')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'weekdays'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('weekends')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'weekends'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Weekends
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('weekly')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'weekly'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('monthly')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'monthly'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setScheduleType('interval')}
                className={`px-3 py-2 text-[13px] rounded-lg border ${
                  scheduleType === 'interval'
                    ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                    : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
                }`}
              >
                Custom
              </button>
            </div>

            {scheduleType === 'weekly' && (
              <div>
                <p className="text-[12px] text-dark-text-muted mb-2">Select days:</p>
                <div className="flex gap-1.5">
                  {dayNames.map((name, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleDay(index)}
                      className={`flex-1 px-2 py-2 text-[11px] rounded-lg ${
                        selectedDays.includes(index)
                          ? 'bg-accent-blue text-dark-primary font-medium'
                          : 'bg-dark-tertiary text-dark-text-secondary hover:bg-dark-hover'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {scheduleType === 'interval' && (
              <div>
                <label className="block text-[12px] text-dark-text-muted mb-1.5">
                  Every X days:
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={interval}
                  onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
              </div>
            )}

            {scheduleType === 'monthly' && (
              <div>
                <label className="block text-[12px] text-dark-text-muted mb-1.5">
                  Day of month:
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={monthDay}
                  onChange={(e) => setMonthDay(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
                <p className="text-[11px] text-dark-text-muted mt-1.5">
                  Task will appear on this day each month
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Quick Link (Optional)
          </label>
          <input
            type="url"
            value={quickLink}
            onChange={(e) => setQuickLink(e.target.value)}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          />
        </div>

        {/* Progress Counter */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-medium text-dark-text-secondary">
              Progress Counter
            </label>
            <button
              type="button"
              onClick={() => setHasCounter(!hasCounter)}
              className={`w-10 h-5 rounded-full transition-colors relative ${
                hasCounter ? 'bg-accent-green' : 'bg-dark-tertiary'
              }`}
            >
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  hasCounter ? 'left-5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
          {hasCounter && (
            <div className="bg-dark-tertiary border border-dark-border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-dark-text-secondary">Target:</span>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={targetCount}
                  onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 px-2 py-1.5 text-[14px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary text-center focus:outline-none focus:border-accent-blue"
                />
                <span className="text-[11px] text-dark-text-muted">
                  (e.g., "Complete {targetCount} items")
                </span>
              </div>
              {task?.currentCount !== undefined && task?.currentCount > 0 && (
                <div className="mt-2 text-[11px] text-dark-text-muted">
                  Current progress: {task.currentCount}/{task.targetCount}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-[14px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
          >
            {task ? 'Save' : 'Create'}
          </button>
          {task && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2.5 text-[14px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium"
            >
              Delete
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
