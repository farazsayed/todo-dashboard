import type { Task } from '../types';
import { useApp } from '../context/AppContext';
import { getTasksForDate, getCarryoverTasks, formatRelativeDate } from '../utils/storage';

interface TodayTasksProps {
  onSelectTask: (projectId: string, taskId: string) => void;
}

export function TodayTasks({ onSelectTask }: TodayTasksProps) {
  const { state, toggleTaskCompletion, scheduleTaskForDate } = useApp();
  const { selectedDate, projects } = state;

  // Get tasks scheduled for this date
  const scheduledTasks = getTasksForDate(projects, selectedDate);

  // Get carryover tasks (only if viewing today or future dates)
  const carryoverTasks = getCarryoverTasks(projects, selectedDate);

  const totalTasks = scheduledTasks.length + carryoverTasks.length;
  const completedCount = [
    ...scheduledTasks.filter(({ task }) => task.completedDates.includes(selectedDate)),
    ...carryoverTasks.filter(({ task }) => task.completedDates.includes(selectedDate))
  ].length;

  const progress = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0;

  const handleCarryoverTaskCheck = (task: Task, projectId: string) => {
    // When checking a carryover task, automatically schedule it for today
    if (!task.scheduledDates.includes(selectedDate)) {
      scheduleTaskForDate(projectId, task.id, selectedDate);
    }
    toggleTaskCompletion(projectId, task.id, selectedDate);
  };

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <section className="bg-gray-50 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <span>Today's Progress</span>
        </h2>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600">{Math.round(progress)}% complete</span>
            <span className="text-gray-400">{completedCount}/{totalTasks} tasks</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* Carried Over Tasks */}
      {carryoverTasks.length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide mb-3">
            Carried Over
          </h2>
          <div className="space-y-2">
            {carryoverTasks.map(({ task, project, originalDate }) => (
              <div key={task.id} className="flex items-center gap-2 group bg-white rounded px-3 py-2 hover:shadow-sm transition-shadow">
                <input
                  type="checkbox"
                  checked={task.completedDates.includes(selectedDate)}
                  onChange={() => handleCarryoverTaskCheck(task, project.id)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      task.completedDates.includes(selectedDate)
                        ? 'text-gray-400 line-through'
                        : 'text-gray-700'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-xs text-amber-600">
                      {formatRelativeDate(originalDate, selectedDate)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTask(project.id, task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
                  title="Edit task"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Project Tasks */}
      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Today's Tasks
        </h2>
        {scheduledTasks.length === 0 ? (
          <p className="text-sm text-gray-400">
            No tasks scheduled. Use the "+ Today" button on tasks below to schedule them.
          </p>
        ) : (
          <div className="space-y-2">
            {scheduledTasks.map(({ task, project }) => (
              <div key={task.id} className="flex items-center gap-2 group p-2 -mx-2 rounded hover:bg-gray-50 transition-colors">
                <input
                  type="checkbox"
                  checked={task.completedDates.includes(selectedDate)}
                  onChange={() => toggleTaskCompletion(project.id, task.id, selectedDate)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer transition-all"
                  style={{ accentColor: project.color }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm transition-all duration-200 ${
                      task.completedDates.includes(selectedDate)
                        ? 'text-gray-400 line-through'
                        : 'text-gray-700'
                    }`}
                  >
                    {task.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    <span className="text-xs text-gray-500">{project.title}</span>
                  </div>
                </div>
                <button
                  onClick={() => onSelectTask(project.id, task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
                  title="Edit task"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
