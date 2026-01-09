import { useState, useEffect } from 'react';
import type { Habit } from '../types';
import { COLORS } from '../types';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';

interface HabitEditorProps {
  habit: Habit | null;
  onClose: () => void;
}

export function HabitEditor({ habit, onClose }: HabitEditorProps) {
  const { dispatch } = useApp();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [quickLink, setQuickLink] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [targetCount, setTargetCount] = useState(3);

  useEffect(() => {
    if (habit) {
      setTitle(habit.title);
      setColor(habit.color);
      setQuickLink(habit.quickLink || '');
      setFrequency(habit.frequency);
      setTargetCount(habit.targetCount || 3);
    } else {
      setTitle('');
      setColor(COLORS[0]);
      setQuickLink('');
      setFrequency('daily');
      setTargetCount(3);
    }
  }, [habit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newHabit: Habit = {
        id: habit?.id || generateId(),
        title: title.trim(),
        color,
        frequency,
        targetCount: frequency === 'weekly' ? targetCount : undefined,
        completedDates: habit?.completedDates || [],
        currentStreak: habit?.currentStreak || 0,
        bestStreak: habit?.bestStreak || 0,
        quickLink: quickLink.trim() || undefined,
      };

      if (habit) {
        dispatch({ type: 'UPDATE_HABIT', payload: newHabit });
      } else {
        dispatch({ type: 'ADD_HABIT', payload: newHabit });
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (habit && confirm('Delete this habit?')) {
      dispatch({ type: 'DELETE_HABIT', payload: habit.id });
      onClose();
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          {habit ? 'Edit Habit' : 'New Habit'}
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
            placeholder="Enter habit title..."
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
            Frequency
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFrequency('daily')}
              className={`flex-1 px-3 py-2 text-[13px] rounded-lg border ${
                frequency === 'daily'
                  ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                  : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
              }`}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setFrequency('weekly')}
              className={`flex-1 px-3 py-2 text-[13px] rounded-lg border ${
                frequency === 'weekly'
                  ? 'bg-accent-blue/20 border-accent-blue text-accent-blue'
                  : 'bg-dark-tertiary border-dark-border text-dark-text-secondary hover:bg-dark-hover'
              }`}
            >
              Weekly
            </button>
          </div>

          {frequency === 'weekly' && (
            <div className="mt-3">
              <label className="block text-[12px] text-dark-text-muted mb-1.5">
                Target times per week:
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={targetCount}
                onChange={(e) => setTargetCount(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              />
            </div>
          )}
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

        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-[14px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
          >
            {habit ? 'Save' : 'Create'}
          </button>
          {habit && (
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
