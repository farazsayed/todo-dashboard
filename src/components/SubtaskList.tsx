import { useState } from 'react';
import type { Task } from '../types';
import { useApp } from '../context/AppContext';
import { getTodayISO } from '../utils/storage';
import { AddToTodayButton } from './AddToTodayButton';

interface SubtaskListProps {
  projectId: string;
  parentTaskId: string;
  subtasks: Task[];
  depth?: number;
  maxDepth?: number;
  onSelectTask?: (taskId: string) => void;
}

export function SubtaskList({
  projectId,
  parentTaskId,
  subtasks,
  depth = 0,
  maxDepth = 2,
  onSelectTask,
}: SubtaskListProps) {
  const { addSubtask, toggleTaskCompletion, deleteTaskRecursive } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [expandedSubtasks, setExpandedSubtasks] = useState<Set<string>>(new Set());
  const today = getTodayISO();

  const handleAdd = () => {
    if (newTitle.trim()) {
      addSubtask(projectId, parentTaskId, newTitle.trim());
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  const toggleExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedSubtasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedSubtasks(newExpanded);
  };

  const handleDelete = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this subtask and all its children?')) {
      deleteTaskRecursive(projectId, taskId);
    }
  };

  return (
    <div className="space-y-1">
      {subtasks.map((subtask) => {
        const hasChildren = subtask.subtasks && subtask.subtasks.length > 0;
        const isExpanded = expandedSubtasks.has(subtask.id);
        const isCompletedToday = subtask.completedDates.includes(today);

        return (
          <div key={subtask.id}>
            <div
              className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-dark-tertiary group cursor-pointer"
              style={{ paddingLeft: `${(depth * 16) + 8}px` }}
              onClick={() => onSelectTask?.(subtask.id)}
            >
              {/* Expand/collapse for nested subtasks */}
              {hasChildren ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(subtask.id);
                  }}
                  className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary"
                >
                  <svg
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <div className="w-4" />
              )}

              {/* Checkbox */}
              <input
                type="checkbox"
                checked={isCompletedToday}
                onChange={(e) => {
                  e.stopPropagation();
                  toggleTaskCompletion(projectId, subtask.id, today);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-4 h-4 flex-shrink-0"
              />

              {/* Title */}
              <span
                className={`flex-1 text-[13px] ${
                  isCompletedToday ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'
                }`}
              >
                {subtask.title}
              </span>

              {/* Subtask count badge */}
              {hasChildren && (
                <span className="text-[10px] text-dark-text-muted bg-dark-tertiary px-1.5 py-0.5 rounded">
                  {subtask.subtasks.length}
                </span>
              )}

              {/* Links count badge */}
              {subtask.links && subtask.links.length > 0 && (
                <span className="text-[10px] text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
                  {subtask.links.length} link{subtask.links.length > 1 ? 's' : ''}
                </span>
              )}

              {/* Add to today button */}
              <AddToTodayButton
                projectId={projectId}
                taskId={subtask.id}
                scheduledDates={subtask.scheduledDates}
                size="sm"
              />

              {/* Delete button */}
              <button
                type="button"
                onClick={(e) => handleDelete(subtask.id, e)}
                className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Nested subtasks */}
            {hasChildren && isExpanded && depth < maxDepth && (
              <SubtaskList
                projectId={projectId}
                parentTaskId={subtask.id}
                subtasks={subtask.subtasks}
                depth={depth + 1}
                maxDepth={maxDepth}
                onSelectTask={onSelectTask}
              />
            )}
          </div>
        );
      })}

      {/* Add subtask input */}
      {depth < maxDepth && (
        <div style={{ paddingLeft: `${(depth * 16) + 8}px` }}>
          {isAdding ? (
            <div className="flex items-center gap-2 py-1">
              <div className="w-4" />
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={() => {
                  if (!newTitle.trim()) {
                    setIsAdding(false);
                  }
                }}
                placeholder="Subtask title..."
                autoFocus
                className="flex-1 px-2 py-1 text-[13px] bg-dark-tertiary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
              />
              <button
                type="button"
                onClick={handleAdd}
                className="p-1 text-accent-green hover:text-accent-green/80"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAdding(false);
                  setNewTitle('');
                }}
                className="p-1 text-dark-text-muted hover:text-dark-text-primary"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 py-1 px-2 text-[12px] text-dark-text-muted hover:text-dark-text-primary"
            >
              <div className="w-4" />
              <svg className="w-3.5 h-3.5 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add subtask
            </button>
          )}
        </div>
      )}
    </div>
  );
}
