import { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Goal } from '../types';

interface GoalsViewProps {
  onSelectGoal: (goal: Goal | null) => void;
  onSelectTask: (goalId: string, taskId: string) => void;
  onClose: () => void;
}

export function GoalsView({ onSelectGoal, onSelectTask, onClose }: GoalsViewProps) {
  const { state, toggleTaskCompletion, addTask } = useApp();
  const { goals, selectedDate } = state;
  const [addingTaskToGoal, setAddingTaskToGoal] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

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

  return (
    <div className="fixed inset-0 bg-dark-primary z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-dark-secondary border-b border-dark-border z-10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold text-dark-text-primary">🎯 Goals</h1>
          <span className="text-[14px] text-dark-text-muted">({goals.length} goals)</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectGoal(null)}
            className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium text-[14px]"
          >
            + New Goal
          </button>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-lg text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="p-6">
        {goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-[20px] font-semibold text-dark-text-primary mb-2">No goals yet</h2>
            <p className="text-[14px] text-dark-text-muted mb-6">
              Create your first goal to start tracking your progress
            </p>
            <button
              onClick={() => onSelectGoal(null)}
              className="px-6 py-3 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
            >
              Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
            {goals.map(goal => {
              const completedTasks = goal.tasks.filter(t => t.completed).length;
              const totalTasks = goal.tasks.length;
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

              return (
                <div
                  key={goal.id}
                  className="bg-dark-secondary border border-dark-border rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Goal Header */}
                  <div className="p-4 border-b border-dark-border">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className="w-4 h-4 rounded-md flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: goal.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[16px] font-semibold text-dark-text-primary mb-1">
                          {goal.title}
                        </h3>
                        {goal.notes && (
                          <p className="text-[13px] text-dark-text-primary/80 mt-2 whitespace-pre-wrap leading-relaxed">
                            {goal.notes}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectGoal(goal);
                        }}
                        className="text-dark-text-muted hover:text-dark-text-primary p-2 hover:bg-dark-tertiary rounded-lg transition-colors flex-shrink-0"
                        title="Edit goal"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[12px]">
                        <span className="text-dark-text-muted">Progress</span>
                        <span className="text-dark-text-primary font-mono">{completedTasks}/{totalTasks} ({progress}%)</span>
                      </div>
                      <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${progress}%`,
                            backgroundColor: goal.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 p-4">
                    {goal.tasks.length === 0 ? (
                      <p className="text-[13px] text-dark-text-muted text-center py-4">
                        No tasks yet
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {goal.tasks.map(task => {
                          const isScheduledToday = task.scheduledDates.includes(selectedDate);
                          const isCompletedToday = task.completedDates.includes(selectedDate);

                          return (
                            <div
                              key={task.id}
                              className={`flex items-center gap-2.5 p-2.5 rounded-lg hover:bg-dark-tertiary cursor-pointer group ${
                                isScheduledToday ? 'bg-dark-tertiary/50' : ''
                              }`}
                              onClick={() => onSelectTask(goal.id, task.id)}
                            >
                              <input
                                type="checkbox"
                                checked={isCompletedToday}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompletion(goal.id, task.id, selectedDate);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-4 h-4 flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className={`text-[14px] ${isCompletedToday ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'}`}>
                                  {task.title}
                                </div>
                                {isScheduledToday && (
                                  <div className="text-[11px] text-accent-blue mt-0.5">
                                    📅 Scheduled for today
                                  </div>
                                )}
                              </div>
                              {task.quickLink && (
                                <a
                                  href={task.quickLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-accent-blue hover:text-accent-blue/80 p-1 flex-shrink-0"
                                  title="Open quick link"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Add Task */}
                    <div className="mt-3 pt-3 border-t border-dark-border">
                      {addingTaskToGoal === goal.id ? (
                        <div className="flex items-center gap-2">
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
                            className="flex-1 bg-dark-tertiary border border-dark-border rounded px-3 py-2 text-[13px] text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                          />
                          <button
                            onClick={() => handleAddTask(goal.id)}
                            className="text-accent-green hover:text-accent-green/80 p-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingTaskToGoal(goal.id)}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[13px] text-dark-text-muted hover:text-dark-text-primary bg-transparent border border-dashed border-dark-border rounded-lg hover:bg-dark-tertiary"
                        >
                          <span className="text-accent-green font-semibold">+</span>
                          Add Task
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
