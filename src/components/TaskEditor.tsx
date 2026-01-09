import { useState, useEffect } from 'react';
import type { Task, Goal } from '../types';
import { useApp } from '../context/AppContext';

interface TaskEditorProps {
  goalId: string;
  taskId: string;
  onClose: () => void;
}

export function TaskEditor({ goalId, taskId, onClose }: TaskEditorProps) {
  const { state, updateTask, deleteTask } = useApp();
  const [title, setTitle] = useState('');
  const [quickLink, setQuickLink] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    const foundGoal = state.goals.find(g => g.id === goalId);
    if (foundGoal) {
      setGoal(foundGoal);
      const foundTask = foundGoal.tasks.find(t => t.id === taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setQuickLink(foundTask.quickLink || '');
      }
    }
  }, [goalId, taskId, state.goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && task) {
      updateTask(goalId, {
        ...task,
        title: title.trim(),
        quickLink: quickLink.trim() || undefined,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask(goalId, taskId);
      onClose();
    }
  };

  if (!goal || !task) {
    return null;
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          Edit Task
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

      <div className="mb-4">
        <div className="flex items-center gap-2 text-[12px] text-dark-text-muted">
          <div
            className="w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: goal.color }}
          />
          <span>{goal.title}</span>
        </div>
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
            Save
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2.5 text-[14px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium"
          >
            Delete
          </button>
        </div>
      </form>
    </div>
  );
}
