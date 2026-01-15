import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Task, Project } from '../types';
import { getTodayISO, formatDateToLocal } from '../utils/storage';

interface TaskSchedulerModalProps {
  onClose: () => void;
}

interface FlatTask {
  task: Task;
  project: Project;
  depth: number;
  path: string;
}

export function TaskSchedulerModal({ onClose }: TaskSchedulerModalProps) {
  const { state, updateTaskRecursive } = useApp();
  const { projects } = state;
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');

  const today = getTodayISO();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = formatDateToLocal(tomorrow);

  // Get flattened tasks for selected project
  const flatTasks = useMemo((): FlatTask[] => {
    if (!selectedProjectId) return [];
    const project = projects.find(g => g.id === selectedProjectId);
    if (!project) return [];

    const result: FlatTask[] = [];
    const flatten = (tasks: Task[], depth: number, pathPrefix: string) => {
      tasks.forEach(task => {
        const path = pathPrefix ? `${pathPrefix} → ${task.title}` : task.title;
        result.push({ task, project, depth, path });
        if (task.subtasks && task.subtasks.length > 0) {
          flatten(task.subtasks, depth + 1, path);
        }
      });
    };
    flatten(project.tasks, 0, '');
    return result;
  }, [selectedProjectId, projects]);

  const selectedProject = projects.find(g => g.id === selectedProjectId);
  const selectedTask = flatTasks.find(ft => ft.task.id === selectedTaskId);

  const handleSchedule = () => {
    if (!selectedProjectId || !selectedTaskId) return;

    let scheduleDate: string;
    switch (dateOption) {
      case 'today':
        scheduleDate = today;
        break;
      case 'tomorrow':
        scheduleDate = tomorrowISO;
        break;
      case 'custom':
        if (!customDate) return;
        scheduleDate = customDate;
        break;
    }

    const task = flatTasks.find(ft => ft.task.id === selectedTaskId)?.task;
    if (task && !task.scheduledDates.includes(scheduleDate)) {
      updateTaskRecursive(selectedProjectId, selectedTaskId, {
        scheduledDates: [...task.scheduledDates, scheduleDate],
      });
    }

    onClose();
  };

  const canSchedule = selectedProjectId && selectedTaskId && (dateOption !== 'custom' || customDate);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-dark-secondary border border-dark-border rounded-xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <h2 className="text-[16px] font-semibold text-dark-text-primary">
            Schedule Task
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

        <div className="p-5 space-y-5">
          {/* Project selector - Dropdown */}
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
              Select Project
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => {
                setSelectedProjectId(e.target.value);
                setSelectedTaskId('');
              }}
              className="w-full px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 cursor-pointer"
            >
              <option value="">Choose a project...</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.title} ({project.tasks.length} tasks)
                </option>
              ))}
            </select>
            {selectedProject && (
              <div className="flex items-center gap-2 mt-2 px-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: selectedProject.color }}
                />
                <span className="text-[13px] text-dark-text-secondary">
                  {selectedProject.tasks.length} tasks available
                </span>
              </div>
            )}
          </div>

          {/* Task selector - Dropdown */}
          {selectedProjectId && (
            <div>
              <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
                Select Task
              </label>
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50 cursor-pointer"
              >
                <option value="">Choose a task...</option>
                {flatTasks.map(ft => (
                  <option key={ft.task.id} value={ft.task.id}>
                    {'─'.repeat(ft.depth)} {ft.task.title}
                    {ft.task.scheduledDates.includes(today) ? ' (already scheduled today)' : ''}
                  </option>
                ))}
              </select>
              {selectedTask && selectedTask.depth > 0 && (
                <div className="mt-2 px-2">
                  <span className="text-[11px] text-dark-text-muted">Path: {selectedTask.path}</span>
                </div>
              )}
            </div>
          )}

          {/* Date picker */}
          {selectedTaskId && (
            <div>
              <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
                Schedule For
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDateOption('today')}
                  className={`flex-1 px-3 py-2.5 text-[14px] rounded-lg border transition-colors ${
                    dateOption === 'today'
                      ? 'bg-accent-blue text-white border-accent-blue'
                      : 'bg-dark-tertiary border-dark-border text-dark-text-primary hover:bg-dark-tertiary/80'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setDateOption('tomorrow')}
                  className={`flex-1 px-3 py-2.5 text-[14px] rounded-lg border transition-colors ${
                    dateOption === 'tomorrow'
                      ? 'bg-accent-blue text-white border-accent-blue'
                      : 'bg-dark-tertiary border-dark-border text-dark-text-primary hover:bg-dark-tertiary/80'
                  }`}
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setDateOption('custom')}
                  className={`flex-1 px-3 py-2.5 text-[14px] rounded-lg border transition-colors ${
                    dateOption === 'custom'
                      ? 'bg-accent-blue text-white border-accent-blue'
                      : 'bg-dark-tertiary border-dark-border text-dark-text-primary hover:bg-dark-tertiary/80'
                  }`}
                >
                  Custom
                </button>
              </div>
              {dateOption === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={today}
                  className="w-full mt-2 px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-dark-border bg-dark-tertiary/30">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-[14px] text-dark-text-muted hover:text-dark-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSchedule}
            disabled={!canSchedule}
            className="px-4 py-2 text-[14px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            Schedule Task
          </button>
        </div>
      </div>
    </div>
  );
}
