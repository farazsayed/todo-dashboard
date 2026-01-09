import { useState, useEffect } from 'react';
import type { OneOffTask } from '../types';
import { useApp } from '../context/AppContext';
import { generateId } from '../utils/storage';

interface OneOffTaskEditorProps {
  task: OneOffTask | null;
  onClose: () => void;
}

export function OneOffTaskEditor({ task, onClose }: OneOffTaskEditorProps) {
  const { state, dispatch, addTask } = useApp();
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate || '');
    } else {
      setTitle('');
      setDueDate('');
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: OneOffTask = {
        id: task?.id || generateId(),
        title: title.trim(),
        dueDate: dueDate || undefined,
        completed: task?.completed || false,
        completedDate: task?.completedDate,
      };

      if (task) {
        dispatch({ type: 'UPDATE_ONE_OFF_TASK', payload: newTask });
      } else {
        dispatch({ type: 'ADD_ONE_OFF_TASK', payload: newTask });
      }
      onClose();
    }
  };

  const handleDelete = () => {
    if (task && confirm('Delete this task?')) {
      dispatch({ type: 'DELETE_ONE_OFF_TASK', payload: task.id });
      onClose();
    }
  };

  const handleConvertToGoalTask = (goalId: string) => {
    if (task) {
      addTask(goalId, task.title);
      dispatch({ type: 'DELETE_ONE_OFF_TASK', payload: task.id });
      onClose();
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          {task ? 'Edit Task' : 'New Task'}
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
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Due Date (Optional)
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
          />
        </div>

        {task && state.goals.length > 0 && (
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
              Convert to Goal Task
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {state.goals.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => handleConvertToGoalTask(goal.id)}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] bg-dark-tertiary border border-dark-border rounded-lg hover:bg-dark-hover flex items-center gap-2.5"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: goal.color }}
                  />
                  <span className="truncate text-dark-text-primary">{goal.title}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
