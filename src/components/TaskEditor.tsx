import { useState, useEffect } from 'react';
import type { Task, Goal, TaskLink } from '../types';
import { useApp } from '../context/AppContext';
import { findTaskRecursively } from '../utils/storage';
import { TaskLinkEditor } from './TaskLinkEditor';
import { SubtaskList } from './SubtaskList';

interface TaskEditorProps {
  goalId: string;
  taskId: string;
  onClose: () => void;
}

export function TaskEditor({ goalId, taskId, onClose }: TaskEditorProps) {
  const { state, updateTaskRecursive, deleteTaskRecursive, addTaskLink, updateTaskLink, deleteTaskLink } = useApp();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [goal, setGoal] = useState<Goal | null>(null);
  const [task, setTask] = useState<Task | null>(null);

  useEffect(() => {
    const foundGoal = state.goals.find(g => g.id === goalId);
    if (foundGoal) {
      setGoal(foundGoal);
      // Find task recursively (could be a subtask)
      const foundTask = findTaskRecursively(foundGoal.tasks, taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
      }
    }
  }, [goalId, taskId, state.goals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && task) {
      updateTaskRecursive(goalId, taskId, {
        title: title.trim(),
        notes: notes.trim() || undefined,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this task and all its subtasks?')) {
      deleteTaskRecursive(goalId, taskId);
      onClose();
    }
  };

  const handleAddLink = (link: TaskLink) => {
    addTaskLink(goalId, taskId, link.title, link.url);
  };

  const handleUpdateLink = (link: TaskLink) => {
    updateTaskLink(goalId, taskId, link);
  };

  const handleDeleteLink = (linkId: string) => {
    deleteTaskLink(goalId, taskId, linkId);
  };

  if (!goal || !task) {
    return null;
  }

  const isSubtask = !!task.parentTaskId;
  const subtaskCount = task.subtasks?.length || 0;
  const linkCount = task.links?.length || 0;

  return (
    <div className="p-5 overflow-y-auto max-h-full">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          {isSubtask ? 'Edit Subtask' : 'Edit Task'}
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

      {/* Goal indicator */}
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
        {/* Title */}
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

        {/* Notes */}
        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes, details, or context..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-none"
          />
        </div>

        {/* Resource Links */}
        <TaskLinkEditor
          links={task.links || []}
          onAddLink={handleAddLink}
          onUpdateLink={handleUpdateLink}
          onDeleteLink={handleDeleteLink}
        />

        {/* Subtasks section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-medium text-dark-text-secondary">
              Subtasks
              {subtaskCount > 0 && (
                <span className="ml-2 text-dark-text-muted">({subtaskCount})</span>
              )}
            </label>
          </div>
          <div className="bg-dark-tertiary border border-dark-border rounded-lg p-2">
            {subtaskCount > 0 ? (
              <SubtaskList
                goalId={goalId}
                parentTaskId={taskId}
                subtasks={task.subtasks || []}
                depth={0}
                maxDepth={2}
              />
            ) : (
              <SubtaskList
                goalId={goalId}
                parentTaskId={taskId}
                subtasks={[]}
                depth={0}
                maxDepth={2}
              />
            )}
          </div>
        </div>

        {/* Task stats */}
        <div className="flex items-center gap-4 text-[11px] text-dark-text-muted pt-2 border-t border-dark-border">
          {subtaskCount > 0 && (
            <span>{subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}</span>
          )}
          {linkCount > 0 && (
            <span>{linkCount} link{linkCount !== 1 ? 's' : ''}</span>
          )}
          {task.scheduledDates.length > 0 && (
            <span>Scheduled {task.scheduledDates.length} time{task.scheduledDates.length !== 1 ? 's' : ''}</span>
          )}
        </div>

        {/* Action buttons */}
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
