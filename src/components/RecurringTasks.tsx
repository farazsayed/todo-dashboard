import type { RecurringTask } from '../types';
import { useApp } from '../context/AppContext';
import { getRecurringTasksForDate } from '../utils/storage';

interface RecurringTasksProps {
  onSelectTask: (task: RecurringTask) => void;
  onNewTask: () => void;
}

export function RecurringTasks({ onSelectTask, onNewTask }: RecurringTasksProps) {
  const { state, dispatch } = useApp();
  const { selectedDate, recurringTasks } = state;

  const tasksForDate = getRecurringTasksForDate(recurringTasks, selectedDate);

  const toggleCompletion = (task: RecurringTask) => {
    const isCompleted = task.completedDates.includes(selectedDate);
    const updatedTask: RecurringTask = {
      ...task,
      completedDates: isCompleted
        ? task.completedDates.filter(d => d !== selectedDate)
        : [...task.completedDates, selectedDate],
    };
    dispatch({ type: 'UPDATE_RECURRING_TASK', payload: updatedTask });
  };

  const getScheduleLabel = (task: RecurringTask) => {
    if (task.schedule.type === 'daily') return 'Daily';
    if (task.schedule.type === 'weekly') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const days = task.schedule.days?.map(d => dayNames[d]).join(', ') || '';
      return days;
    }
    if (task.schedule.type === 'interval') {
      const interval = task.schedule.interval || 1;
      return `Every ${interval} day${interval > 1 ? 's' : ''}`;
    }
    return '';
  };

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Recurring Tasks
        </h2>
        <button
          onClick={onNewTask}
          className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 font-medium"
        >
          + New
        </button>
      </div>

      {tasksForDate.length === 0 ? (
        <p className="text-sm text-gray-400">
          No recurring tasks for this date
        </p>
      ) : (
        <div className="space-y-2">
          {tasksForDate.map(task => {
            const isCompleted = task.completedDates.includes(selectedDate);

            return (
              <div key={task.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleCompletion(task)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: task.color }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: task.color }}
                    />
                    <span className="text-xs text-gray-500">{getScheduleLabel(task)}</span>
                  </div>
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
          })}
        </div>
      )}
    </section>
  );
}
