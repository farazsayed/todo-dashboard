import type { RecurringTask, Habit, OneOffTask } from '../types';
import { useApp } from '../context/AppContext';
import { getTasksForDate, getCarryoverTasks, formatRelativeDate, getRecurringTasksForDate } from '../utils/storage';

interface MainContentProps {
  onSelectTask: (goalId: string, taskId: string) => void;
  onSelectRecurringTask: (task: RecurringTask | null) => void;
  onSelectHabit: (habit: Habit | null) => void;
  onSelectOneOffTask: (task: OneOffTask) => void;
}

export function MainContent({
  onSelectTask,
  onSelectRecurringTask,
  onSelectHabit,
  onSelectOneOffTask
}: MainContentProps) {
  const { state, toggleTaskCompletion, dispatch } = useApp();
  const { selectedDate, goals, recurringTasks, oneOffTasks, habits } = state;

  // Get tasks for today
  const scheduledTasks = getTasksForDate(goals, selectedDate);
  const carryoverTasks = getCarryoverTasks(goals, selectedDate);
  const recurringTasksForDate = getRecurringTasksForDate(recurringTasks, selectedDate);

  // Filter one-off tasks - include completed ones
  const todayOneOff = oneOffTasks.filter(t => t.dueDate === selectedDate);
  const overdueOneOff = oneOffTasks.filter(t => !t.completed && t.dueDate && t.dueDate < selectedDate);
  const upcomingOneOff = oneOffTasks.filter(t => !t.completed && (!t.dueDate || t.dueDate > selectedDate));

  // Calculate progress - include all tasks due today (including completed one-offs)
  const completedCount = [
    ...scheduledTasks.filter(({ task }) => task.completedDates.includes(selectedDate)),
    ...carryoverTasks.filter(({ task }) => task.completedDates.includes(selectedDate)),
    ...recurringTasksForDate.filter(t => t.completedDates.includes(selectedDate)),
    ...todayOneOff.filter(t => t.completed || (t.completedDate === selectedDate)),
    ...habits.filter(h => h.completedDates.includes(selectedDate))
  ].length;

  const totalCount = scheduledTasks.length + carryoverTasks.length + recurringTasksForDate.length + todayOneOff.length + habits.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleRecurringTask = (taskId: string) => {
    const task = recurringTasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleted = task.completedDates.includes(selectedDate);
    dispatch({
      type: 'UPDATE_RECURRING_TASK',
      payload: {
        ...task,
        completedDates: isCompleted
          ? task.completedDates.filter(d => d !== selectedDate)
          : [...task.completedDates, selectedDate]
      }
    });
  };

  const toggleOneOffTask = (taskId: string) => {
    const task = oneOffTasks.find(t => t.id === taskId);
    if (!task) return;

    dispatch({
      type: 'UPDATE_ONE_OFF_TASK',
      payload: {
        ...task,
        completed: !task.completed,
        completedDate: !task.completed ? selectedDate : undefined
      }
    });
  };

  const toggleHabit = (habitId: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(selectedDate);
    dispatch({
      type: 'UPDATE_HABIT',
      payload: {
        ...habit,
        completedDates: isCompleted
          ? habit.completedDates.filter(d => d !== selectedDate)
          : [...habit.completedDates, selectedDate]
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2.5">
          <span className="text-[13px] font-medium text-dark-text-secondary">Today's Progress</span>
          <span className="text-[14px] text-dark-text-primary font-mono">
            {completedCount} / {totalCount} tasks ({progress}%)
          </span>
        </div>
        <div className="h-2 bg-progress-bg rounded overflow-hidden">
          <div
            className="h-full rounded bg-gradient-to-r from-accent-green to-accent-blue transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Carried Over */}
      {carryoverTasks.length > 0 && (
        <TaskSection
          icon="📌"
          title="Carried Over"
          count={carryoverTasks.length}
        >
          {carryoverTasks.map(({ task, goal, originalDate }) => (
            <TaskItem
              key={task.id}
              title={task.title}
              meta={formatRelativeDate(originalDate, selectedDate)}
              color={goal.color}
              checked={task.completedDates.includes(selectedDate)}
              onCheck={() => toggleTaskCompletion(goal.id, task.id, selectedDate)}
              onEdit={() => onSelectTask(goal.id, task.id)}
              quickLink={task.quickLink}
            />
          ))}
        </TaskSection>
      )}

      {/* Scheduled Tasks */}
      {scheduledTasks.length > 0 && (
        <TaskSection
          icon="📅"
          title="Scheduled Tasks"
          count={scheduledTasks.length}
        >
          {scheduledTasks.map(({ task, goal }) => (
            <TaskItem
              key={task.id}
              title={task.title}
              meta={goal.title}
              color={goal.color}
              checked={task.completedDates.includes(selectedDate)}
              onCheck={() => toggleTaskCompletion(goal.id, task.id, selectedDate)}
              onEdit={() => onSelectTask(goal.id, task.id)}
              quickLink={task.quickLink}
            />
          ))}
        </TaskSection>
      )}

      {/* Recurring Tasks */}
      {recurringTasksForDate.length > 0 && (
        <TaskSection
          icon="🔄"
          title="Recurring"
          count={recurringTasksForDate.length}
        >
          {recurringTasksForDate.map(task => {
            const streak = task.completedDates.length;
            return (
              <TaskItem
                key={task.id}
                title={task.title}
                meta={task.schedule.type === 'daily' ? 'Every day' : task.schedule.type === 'weekly' ? 'Weekly' : `Every ${task.schedule.interval} days`}
                checked={task.completedDates.includes(selectedDate)}
                onCheck={() => toggleRecurringTask(task.id)}
                onEdit={() => onSelectRecurringTask(task)}
                streak={streak}
                quickLink={task.quickLink}
              />
            );
          })}
        </TaskSection>
      )}

      {/* One-Off Tasks */}
      {(todayOneOff.length > 0 || overdueOneOff.length > 0 || upcomingOneOff.length > 0) && (
        <TaskSection
          icon="⚡"
          title="One-Off"
          count={todayOneOff.length + overdueOneOff.length + upcomingOneOff.length}
        >
          {[...overdueOneOff, ...todayOneOff, ...upcomingOneOff].map(task => {
            const isOverdue = task.dueDate && task.dueDate < selectedDate;
            const metaText = isOverdue ? 'Overdue' : task.completed ? `Done ${task.completedDate ? new Date(task.completedDate).toLocaleDateString() : ''}` : undefined;

            return (
              <TaskItem
                key={task.id}
                title={task.title}
                meta={metaText}
                checked={task.completed}
                onCheck={() => toggleOneOffTask(task.id)}
                onEdit={() => onSelectOneOffTask(task)}
              />
            );
          })}
        </TaskSection>
      )}

      {/* Habits */}
      {habits.length > 0 && (
        <TaskSection
          icon="✓"
          title="Habits"
          count={habits.length}
        >
          {habits.map(habit => (
            <TaskItem
              key={habit.id}
              title={habit.title}
              meta={habit.frequency === 'daily' ? 'Daily' : 'Weekly'}
              checked={habit.completedDates.includes(selectedDate)}
              onCheck={() => toggleHabit(habit.id)}
              onEdit={() => onSelectHabit(habit)}
              streak={habit.currentStreak}
              quickLink={habit.quickLink}
            />
          ))}
        </TaskSection>
      )}

      {/* Empty state */}
      {totalCount === 0 && (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🎯</div>
          <h3 className="text-lg font-medium text-dark-text-primary mb-2">No tasks for today</h3>
          <p className="text-[14px] text-dark-text-muted">
            Use the sidebar to create goals and add tasks, or use Quick Add for one-off tasks.
          </p>
        </div>
      )}
    </div>
  );
}

// Task Section Component
function TaskSection({
  icon,
  title,
  count,
  children
}: {
  icon: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-dark-border">
        <span className="text-[16px]">{icon}</span>
        <span className="text-[13px] font-semibold uppercase tracking-wide text-dark-text-secondary">
          {title}
        </span>
        <span className="text-[11px] text-dark-text-muted bg-dark-tertiary px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="space-y-1">
        {children}
      </div>
    </div>
  );
}

// Task Item Component
function TaskItem({
  title,
  meta,
  color,
  checked,
  onCheck,
  onEdit,
  streak,
  quickLink
}: {
  title: string;
  meta?: string;
  color?: string;
  checked: boolean;
  onCheck: () => void;
  onEdit: () => void;
  streak?: number;
  quickLink?: string;
}) {
  return (
    <div
      className="flex items-center gap-3.5 px-4 py-3 bg-dark-secondary rounded-[10px] cursor-pointer hover:bg-dark-tertiary border border-transparent hover:border-dark-border group"
      onClick={onEdit}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => {
          e.stopPropagation();
          onCheck();
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-5 h-5"
      />
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] ${checked ? 'text-dark-text-muted line-through' : 'text-dark-text-primary'}`}>
          {title}
        </div>
        {meta && (
          <div className="text-[12px] text-dark-text-muted">{meta}</div>
        )}
      </div>
      {quickLink && (
        <a
          href={quickLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-accent-blue hover:text-accent-blue/80 p-1.5 flex-shrink-0"
          title="Open quick link"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      )}
      {color && (
        <div
          className="w-2 h-2 rounded-sm flex-shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {streak !== undefined && streak > 0 && (
        <span className="flex items-center gap-1 text-[13px] text-streak-fire font-mono">
          🔥 {streak}
        </span>
      )}
    </div>
  );
}
