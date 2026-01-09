import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Task, Goal } from '../types';
import { getTodayISO } from '../utils/storage';

interface TaskSchedulerModalProps {
  onClose: () => void;
}

interface FlatTask {
  task: Task;
  goal: Goal;
  depth: number;
  path: string;
}

export function TaskSchedulerModal({ onClose }: TaskSchedulerModalProps) {
  const { state, updateTaskRecursive } = useApp();
  const { goals } = state;
  const [selectedGoalId, setSelectedGoalId] = useState<string>('');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [dateOption, setDateOption] = useState<'today' | 'tomorrow' | 'custom'>('today');
  const [customDate, setCustomDate] = useState('');
  const [searchGoal, setSearchGoal] = useState('');
  const [searchTask, setSearchTask] = useState('');

  const today = getTodayISO();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowISO = tomorrow.toISOString().split('T')[0];

  // Get filtered goals
  const filteredGoals = useMemo(() => {
    if (!searchGoal.trim()) return goals;
    return goals.filter(g =>
      g.title.toLowerCase().includes(searchGoal.toLowerCase())
    );
  }, [goals, searchGoal]);

  // Get flattened tasks for selected goal
  const flatTasks = useMemo((): FlatTask[] => {
    if (!selectedGoalId) return [];
    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return [];

    const result: FlatTask[] = [];
    const flatten = (tasks: Task[], depth: number, pathPrefix: string) => {
      tasks.forEach(task => {
        const path = pathPrefix ? `${pathPrefix} → ${task.title}` : task.title;
        result.push({ task, goal, depth, path });
        if (task.subtasks && task.subtasks.length > 0) {
          flatten(task.subtasks, depth + 1, path);
        }
      });
    };
    flatten(goal.tasks, 0, '');
    return result;
  }, [selectedGoalId, goals]);

  // Filter tasks based on search
  const filteredTasks = useMemo(() => {
    if (!searchTask.trim()) return flatTasks;
    return flatTasks.filter(ft =>
      ft.task.title.toLowerCase().includes(searchTask.toLowerCase())
    );
  }, [flatTasks, searchTask]);

  const selectedGoal = goals.find(g => g.id === selectedGoalId);
  const selectedTask = flatTasks.find(ft => ft.task.id === selectedTaskId);

  const handleSchedule = () => {
    if (!selectedGoalId || !selectedTaskId) return;

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
      updateTaskRecursive(selectedGoalId, selectedTaskId, {
        scheduledDates: [...task.scheduledDates, scheduleDate],
      });
    }

    onClose();
  };

  const canSchedule = selectedGoalId && selectedTaskId && (dateOption !== 'custom' || customDate);

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
          {/* Goal selector */}
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
              Select Goal
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchGoal}
                onChange={(e) => {
                  setSearchGoal(e.target.value);
                  setSelectedGoalId('');
                  setSelectedTaskId('');
                }}
                placeholder="Search goals..."
                className="w-full px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
              />
              {searchGoal && !selectedGoalId && filteredGoals.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-dark-tertiary border border-dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                  {filteredGoals.map(goal => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => {
                        setSelectedGoalId(goal.id);
                        setSearchGoal(goal.title);
                        setSelectedTaskId('');
                        setSearchTask('');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-dark-secondary text-left"
                    >
                      <div
                        className="w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ backgroundColor: goal.color }}
                      />
                      <span className="text-[14px] text-dark-text-primary">{goal.title}</span>
                      <span className="text-[12px] text-dark-text-muted ml-auto">
                        {goal.tasks.length} tasks
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedGoal && (
              <div className="flex items-center gap-2 mt-2 px-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: selectedGoal.color }}
                />
                <span className="text-[13px] text-dark-text-primary">{selectedGoal.title}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGoalId('');
                    setSearchGoal('');
                    setSelectedTaskId('');
                    setSearchTask('');
                  }}
                  className="text-dark-text-muted hover:text-dark-text-primary ml-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Task selector */}
          {selectedGoalId && (
            <div>
              <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
                Select Task
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTask}
                  onChange={(e) => {
                    setSearchTask(e.target.value);
                    setSelectedTaskId('');
                  }}
                  placeholder="Search tasks..."
                  className="w-full px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
                />
                {!selectedTaskId && filteredTasks.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-tertiary border border-dark-border rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                    {filteredTasks.map(ft => (
                      <button
                        key={ft.task.id}
                        type="button"
                        onClick={() => {
                          setSelectedTaskId(ft.task.id);
                          setSearchTask(ft.task.title);
                        }}
                        className="w-full flex items-start gap-2 px-3 py-2.5 hover:bg-dark-secondary text-left"
                        style={{ paddingLeft: `${(ft.depth * 12) + 12}px` }}
                      >
                        <div className="flex-1 min-w-0">
                          <span className="text-[14px] text-dark-text-primary block">{ft.task.title}</span>
                          {ft.depth > 0 && (
                            <span className="text-[11px] text-dark-text-muted truncate block">{ft.path}</span>
                          )}
                        </div>
                        {ft.task.scheduledDates.includes(today) && (
                          <span className="text-[10px] text-accent-green bg-accent-green/10 px-1.5 py-0.5 rounded flex-shrink-0">
                            Today
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedTask && (
                <div className="mt-2 px-2">
                  <span className="text-[13px] text-dark-text-primary">{selectedTask.task.title}</span>
                  {selectedTask.depth > 0 && (
                    <span className="text-[11px] text-dark-text-muted block">{selectedTask.path}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTaskId('');
                      setSearchTask('');
                    }}
                    className="text-dark-text-muted hover:text-dark-text-primary mt-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
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
