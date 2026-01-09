import { useState } from 'react';
import type { OneOffTask } from '../types';
import { useApp } from '../context/AppContext';
import { generateId, getTodayISO } from '../utils/storage';

interface OneOffTasksProps {
  onSelectTask: (task: OneOffTask) => void;
}

export function OneOffTasks({ onSelectTask }: OneOffTasksProps) {
  const { state, dispatch } = useApp();
  const { oneOffTasks, selectedDate } = state;
  const [quickAddTitle, setQuickAddTitle] = useState('');

  const toggleCompletion = (task: OneOffTask) => {
    const updatedTask: OneOffTask = {
      ...task,
      completed: !task.completed,
      completedDate: !task.completed ? getTodayISO() : undefined,
    };
    dispatch({ type: 'UPDATE_ONE_OFF_TASK', payload: updatedTask });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickAddTitle.trim()) {
      const newTask: OneOffTask = {
        id: generateId(),
        title: quickAddTitle.trim(),
        completed: false,
      };
      dispatch({ type: 'ADD_ONE_OFF_TASK', payload: newTask });
      setQuickAddTitle('');
    }
  };

  // Separate tasks into categories
  const tasksForToday = oneOffTasks.filter(
    t => !t.completed && (!t.dueDate || t.dueDate === selectedDate)
  );
  const overdueTasks = oneOffTasks.filter(
    t => !t.completed && t.dueDate && t.dueDate < selectedDate
  );
  const futureTasks = oneOffTasks.filter(
    t => !t.completed && t.dueDate && t.dueDate > selectedDate
  );
  const completedTasks = oneOffTasks.filter(t => t.completed);

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderTask = (task: OneOffTask, showDueDate: boolean = true) => (
    <div key={task.id} className="flex items-center gap-2 group">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => toggleCompletion(task)}
        className="w-4 h-4 rounded border-gray-300 cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <span
          className={`text-sm ${
            task.completed ? 'text-gray-400 line-through' : 'text-gray-700'
          }`}
        >
          {task.title}
        </span>
        {showDueDate && task.dueDate && (
          <span className="ml-2 text-xs text-gray-500">
            {formatDueDate(task.dueDate)}
          </span>
        )}
      </div>
      <button
        onClick={() => onSelectTask(task)}
        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
        title="Edit task"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        One-Off Tasks
      </h2>

      {/* Quick Add Input */}
      <form onSubmit={handleQuickAdd} className="mb-4">
        <input
          type="text"
          value={quickAddTitle}
          onChange={(e) => setQuickAddTitle(e.target.value)}
          placeholder="Quick add task... (press Enter)"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
      </form>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">
            Overdue
          </h3>
          <div className="space-y-2">
            {overdueTasks.map(task => renderTask(task))}
          </div>
        </div>
      )}

      {/* Today / No Due Date */}
      {tasksForToday.length > 0 && (
        <div className="mb-4">
          <div className="space-y-2">
            {tasksForToday.map(task => renderTask(task, false))}
          </div>
        </div>
      )}

      {/* Future Tasks */}
      {futureTasks.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2">
            Upcoming
          </h3>
          <div className="space-y-2">
            {futureTasks.map(task => renderTask(task))}
          </div>
        </div>
      )}

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
            Completed
          </h3>
          <div className="space-y-2">
            {completedTasks.map(task => renderTask(task))}
          </div>
        </div>
      )}

      {oneOffTasks.length === 0 && (
        <p className="text-sm text-gray-400">
          No tasks yet. Use the input above for quick capture!
        </p>
      )}
    </section>
  );
}
