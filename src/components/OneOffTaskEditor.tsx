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
  const [quickLink, setQuickLink] = useState('');
  const [hasCounter, setHasCounter] = useState(false);
  const [targetCount, setTargetCount] = useState(5);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDueDate(task.dueDate || '');
      setQuickLink(task.quickLink || '');
      setHasCounter(task.targetCount !== undefined);
      setTargetCount(task.targetCount || 5);
    } else {
      setTitle('');
      setDueDate('');
      setQuickLink('');
      setHasCounter(false);
      setTargetCount(5);
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      const newTask: OneOffTask = {
        id: task?.id || generateId(),
        title: title.trim(),
        dueDate: dueDate || undefined,
        quickLink: quickLink.trim() || undefined,
        completed: task?.completed || false,
        completedDate: task?.completedDate,
        targetCount: hasCounter ? targetCount : undefined,
        currentCount: hasCounter ? (task?.currentCount || 0) : undefined,
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

  const handleConvertToProjectTask = (projectId: string) => {
    if (task) {
      addTask(projectId, task.title);
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

        {/* Quick Link */}
        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Quick Link (Optional)
          </label>
          <div className="relative">
            <input
              type="url"
              value={quickLink}
              onChange={(e) => setQuickLink(e.target.value)}
              placeholder="https://..."
              className="w-full pl-9 pr-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          {quickLink && (
            <a
              href={quickLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 text-[11px] text-accent-blue hover:underline flex items-center gap-1"
            >
              <span className="truncate max-w-[250px]">{quickLink}</span>
              <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          )}
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

        {task && state.projects.length > 0 && (
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
              Convert to Project Task
            </label>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {state.projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => handleConvertToProjectTask(project.id)}
                  className="w-full text-left px-3.5 py-2.5 text-[13px] bg-dark-tertiary border border-dark-border rounded-lg hover:bg-dark-hover flex items-center gap-2.5"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="truncate text-dark-text-primary">{project.title}</span>
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
