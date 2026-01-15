import { useMemo, useState, useCallback } from 'react';
import type { RecurringTask, Habit, OneOffTask, Subtask, Task } from '../types';
import { useApp } from '../context/AppContext';
import { EmptyState } from './EmptyState';
import { getTasksForDate, getCarryoverTasks, formatRelativeDate, getRecurringTasksForDate } from '../utils/storage';

// Unified subtask type for display
interface DisplaySubtask {
  id: string;
  title: string;
  completed: boolean;
}

interface MainContentProps {
  onSelectTask: (projectId: string, taskId: string) => void;
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
  const {
    state,
    toggleTaskCompletion,
    dispatch,
    incrementTaskCounter,
    decrementTaskCounter,
    incrementRecurringTaskCounter,
    decrementRecurringTaskCounter,
    incrementOneOffTaskCounter,
    decrementOneOffTaskCounter,
    toggleOneOffSubtask,
    toggleRecurringSubtask,
    addOneOffSubtask,
    addRecurringSubtask,
    deleteOneOffSubtask,
    deleteRecurringSubtask,
  } = useApp();
  const { selectedDate, projects, recurringTasks, oneOffTasks, habits } = state;

  // Track expanded tasks for controlled expand/collapse all
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const toggleTaskExpanded = useCallback((taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  }, []);

  // Memoize expensive task calculations
  const scheduledTasks = useMemo(
    () => getTasksForDate(projects, selectedDate),
    [projects, selectedDate]
  );

  const carryoverTasks = useMemo(
    () => getCarryoverTasks(projects, selectedDate),
    [projects, selectedDate]
  );

  const recurringTasksForDate = useMemo(
    () => getRecurringTasksForDate(recurringTasks, selectedDate),
    [recurringTasks, selectedDate]
  );

  // Memoize one-off task filtering
  const { todayOneOff, overdueOneOff, upcomingOneOff } = useMemo(() => ({
    todayOneOff: oneOffTasks.filter(t => t.dueDate === selectedDate),
    overdueOneOff: oneOffTasks.filter(t => !t.completed && t.dueDate && t.dueDate < selectedDate),
    upcomingOneOff: oneOffTasks.filter(t => !t.completed && (!t.dueDate || t.dueDate > selectedDate)),
  }), [oneOffTasks, selectedDate]);

  // Memoize progress calculation
  const completedCount = useMemo(() => [
    ...scheduledTasks.filter(({ task }) => task.completedDates.includes(selectedDate)),
    ...carryoverTasks.filter(({ task }) => task.completedDates.includes(selectedDate)),
    ...recurringTasksForDate.filter(t => t.completedDates.includes(selectedDate)),
    ...todayOneOff.filter(t => t.completed || (t.completedDate === selectedDate)),
    ...habits.filter(h => h.completedDates.includes(selectedDate))
  ].length, [scheduledTasks, carryoverTasks, recurringTasksForDate, todayOneOff, habits, selectedDate]);

  const totalCount = scheduledTasks.length + carryoverTasks.length + recurringTasksForDate.length + todayOneOff.length + habits.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Collect all task IDs that have subtasks for expand/collapse all
  const tasksWithSubtasks = useMemo(() => {
    const ids: string[] = [];
    // Project tasks
    scheduledTasks.forEach(({ task }) => {
      if (task.subtasks && task.subtasks.length > 0) ids.push(task.id);
    });
    carryoverTasks.forEach(({ task }) => {
      if (task.subtasks && task.subtasks.length > 0) ids.push(task.id);
    });
    // Recurring tasks
    recurringTasksForDate.forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) ids.push(task.id);
    });
    // One-off tasks
    [...overdueOneOff, ...todayOneOff, ...upcomingOneOff].forEach(task => {
      if (task.subtasks && task.subtasks.length > 0) ids.push(task.id);
    });
    return ids;
  }, [scheduledTasks, carryoverTasks, recurringTasksForDate, overdueOneOff, todayOneOff, upcomingOneOff]);

  const expandAll = useCallback(() => {
    setExpandedTasks(new Set(tasksWithSubtasks));
  }, [tasksWithSubtasks]);

  const collapseAll = useCallback(() => {
    setExpandedTasks(new Set());
  }, []);

  const allExpanded = tasksWithSubtasks.length > 0 && expandedTasks.size >= tasksWithSubtasks.length;
  const allCollapsed = expandedTasks.size === 0;

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
          <div className="flex items-center gap-3">
            {/* Expand/Collapse all buttons */}
            {tasksWithSubtasks.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={collapseAll}
                  disabled={allCollapsed}
                  className={`p-1.5 rounded text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary ${
                    allCollapsed ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title="Collapse all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <button
                  onClick={expandAll}
                  disabled={allExpanded}
                  className={`p-1.5 rounded text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary ${
                    allExpanded ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                  title="Expand all"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
              </div>
            )}
            <span className="text-[14px] text-dark-text-primary font-mono">
              {completedCount} / {totalCount} tasks ({progress}%)
            </span>
          </div>
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
          {carryoverTasks.map(({ task, project, originalDate }) => (
            <TaskItem
              key={task.id}
              title={task.title}
              meta={formatRelativeDate(originalDate, selectedDate)}
              color={project.color}
              checked={task.completedDates.includes(selectedDate)}
              onCheck={() => toggleTaskCompletion(project.id, task.id, selectedDate)}
              onEdit={() => onSelectTask(project.id, task.id)}
              quickLink={task.quickLink}
              linksCount={task.links?.length}
              targetCount={task.targetCount}
              currentCount={task.currentCount}
              onIncrement={() => incrementTaskCounter(project.id, task.id)}
              onDecrement={() => decrementTaskCounter(project.id, task.id)}
              projectSubtasks={task.subtasks}
              onToggleProjectSubtask={(subtaskId) => toggleTaskCompletion(project.id, subtaskId, selectedDate)}
              selectedDate={selectedDate}
              isExpandedControlled={expandedTasks.has(task.id)}
              onToggleExpand={() => toggleTaskExpanded(task.id)}
            />
          ))}
        </TaskSection>
      )}

      {/* Project Tasks */}
      {scheduledTasks.length > 0 && (
        <TaskSection
          icon="📁"
          title="Project Tasks"
          count={scheduledTasks.length}
        >
          {scheduledTasks.map(({ task, project }) => (
            <TaskItem
              key={task.id}
              title={task.title}
              meta={project.title}
              color={project.color}
              checked={task.completedDates.includes(selectedDate)}
              onCheck={() => toggleTaskCompletion(project.id, task.id, selectedDate)}
              onEdit={() => onSelectTask(project.id, task.id)}
              quickLink={task.quickLink}
              linksCount={task.links?.length}
              targetCount={task.targetCount}
              currentCount={task.currentCount}
              onIncrement={() => incrementTaskCounter(project.id, task.id)}
              onDecrement={() => decrementTaskCounter(project.id, task.id)}
              projectSubtasks={task.subtasks}
              onToggleProjectSubtask={(subtaskId) => toggleTaskCompletion(project.id, subtaskId, selectedDate)}
              selectedDate={selectedDate}
              isExpandedControlled={expandedTasks.has(task.id)}
              onToggleExpand={() => toggleTaskExpanded(task.id)}
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
            const getScheduleMeta = () => {
              switch (task.schedule.type) {
                case 'daily': return 'Every day';
                case 'weekdays': return 'Weekdays';
                case 'weekends': return 'Weekends';
                case 'weekly': return 'Weekly';
                case 'monthly': return `Monthly (day ${task.schedule.monthDay})`;
                case 'interval': return `Every ${task.schedule.interval} days`;
                default: return 'Recurring';
              }
            };
            return (
              <TaskItem
                key={task.id}
                title={task.title}
                meta={getScheduleMeta()}
                checked={task.completedDates.includes(selectedDate)}
                onCheck={() => toggleRecurringTask(task.id)}
                onEdit={() => onSelectRecurringTask(task)}
                streak={streak}
                quickLink={task.quickLink}
                targetCount={task.targetCount}
                currentCount={task.currentCount}
                onIncrement={() => incrementRecurringTaskCounter(task.id)}
                onDecrement={() => decrementRecurringTaskCounter(task.id)}
                subtasks={task.subtasks}
                onToggleSubtask={(subtaskId) => toggleRecurringSubtask(task.id, subtaskId)}
                onAddSubtask={(title) => addRecurringSubtask(task.id, title)}
                onDeleteSubtask={(subtaskId) => deleteRecurringSubtask(task.id, subtaskId)}
                isExpandedControlled={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpanded(task.id)}
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
                quickLink={task.quickLink}
                targetCount={task.targetCount}
                currentCount={task.currentCount}
                onIncrement={() => incrementOneOffTaskCounter(task.id)}
                onDecrement={() => decrementOneOffTaskCounter(task.id)}
                subtasks={task.subtasks}
                onToggleSubtask={(subtaskId) => toggleOneOffSubtask(task.id, subtaskId)}
                onAddSubtask={(title) => addOneOffSubtask(task.id, title)}
                onDeleteSubtask={(subtaskId) => deleteOneOffSubtask(task.id, subtaskId)}
                isExpandedControlled={expandedTasks.has(task.id)}
                onToggleExpand={() => toggleTaskExpanded(task.id)}
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
        <EmptyState type="tasks" />
      )}

      {/* Completed all tasks state */}
      {totalCount > 0 && completedCount === totalCount && (
        <EmptyState type="completed" />
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
  quickLink,
  targetCount,
  currentCount,
  onIncrement,
  onDecrement,
  subtasks,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  linksCount,
  // Project task subtasks (Task[] type)
  projectSubtasks,
  onToggleProjectSubtask,
  selectedDate,
  // Controlled expand state
  isExpandedControlled,
  onToggleExpand,
}: {
  title: string;
  meta?: string;
  color?: string;
  checked: boolean;
  onCheck: () => void;
  onEdit: () => void;
  streak?: number;
  quickLink?: string;
  targetCount?: number;
  currentCount?: number;
  onIncrement?: () => void;
  onDecrement?: () => void;
  subtasks?: Subtask[];
  onToggleSubtask?: (subtaskId: string) => void;
  onAddSubtask?: (title: string) => void;
  onDeleteSubtask?: (subtaskId: string) => void;
  linksCount?: number;
  // Project task subtasks
  projectSubtasks?: Task[];
  onToggleProjectSubtask?: (subtaskId: string) => void;
  selectedDate?: string;
  // Controlled expand state
  isExpandedControlled?: boolean;
  onToggleExpand?: () => void;
}) {
  const [isExpandedLocal, setIsExpandedLocal] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  // Use controlled state if provided, otherwise use local state
  const isExpanded = isExpandedControlled !== undefined ? isExpandedControlled : isExpandedLocal;
  const toggleExpand = onToggleExpand || (() => setIsExpandedLocal(!isExpandedLocal));

  // Combine both subtask types for display
  const hasSubtasks = (subtasks && subtasks.length > 0) || (projectSubtasks && projectSubtasks.length > 0);
  const allSubtasks: DisplaySubtask[] = subtasks
    ? subtasks.map(s => ({ id: s.id, title: s.title, completed: s.completed }))
    : projectSubtasks
      ? projectSubtasks.map(s => ({ id: s.id, title: s.title, completed: selectedDate ? s.completedDates.includes(selectedDate) : s.completed }))
      : [];
  const completedSubtasks = allSubtasks.filter(s => s.completed).length;

  const handleAddSubtask = () => {
    if (newSubtaskTitle.trim() && onAddSubtask) {
      onAddSubtask(newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  return (
    <div className="space-y-0">
      <div
        className="flex items-center gap-3.5 px-4 py-3 bg-dark-secondary rounded-[10px] cursor-pointer hover:bg-dark-tertiary border border-transparent hover:border-dark-border group"
        onClick={onCheck}
      >
        {/* Expand/Collapse button for subtasks */}
        {(hasSubtasks || onAddSubtask) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleExpand();
            }}
            className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary flex-shrink-0 -ml-1"
            title={isExpanded ? 'Collapse subtasks' : 'Expand subtasks'}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
        <input
          type="checkbox"
          checked={checked}
          onChange={onCheck}
          onClick={(e) => e.stopPropagation()}
          className="w-5 h-5"
        />
        <div className="flex-1 min-w-0">
          <div className={`text-[14px] ${checked ? 'text-dark-text-muted line-through' : 'text-dark-text-primary'}`}>
            {title}
            {hasSubtasks && (
              <span className="ml-2 text-[11px] text-dark-text-muted">
                ({completedSubtasks}/{allSubtasks.length})
              </span>
            )}
          </div>
          {meta && (
            <div className="text-[12px] text-dark-text-muted">{meta}</div>
          )}
        </div>
        {/* Counter display */}
        {targetCount !== undefined && onIncrement && onDecrement && (
          <div
            className="flex items-center gap-1.5 bg-dark-tertiary rounded-lg px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDecrement();
              }}
              disabled={(currentCount || 0) <= 0}
              className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="flex items-center gap-1 min-w-[40px] justify-center">
              <span className="text-[13px] font-medium text-accent-green">
                {currentCount || 0}
              </span>
              <span className="text-[11px] text-dark-text-muted">/</span>
              <span className="text-[13px] text-dark-text-secondary">{targetCount}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onIncrement();
              }}
              disabled={(currentCount || 0) >= targetCount}
              className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Progress bar */}
            <div className="w-10 h-1.5 bg-dark-secondary rounded-full overflow-hidden ml-1">
              <div
                className="h-full rounded-full transition-all bg-accent-green"
                style={{
                  width: `${((currentCount || 0) / targetCount) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
        {/* Links count badge */}
        {linksCount !== undefined && linksCount > 0 && (
          <span
            className="flex items-center gap-1 text-[11px] text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded"
            title={`${linksCount} link${linksCount > 1 ? 's' : ''}`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {linksCount}
          </span>
        )}
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
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="p-1.5 text-dark-text-muted hover:text-dark-text-primary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          title="Edit task"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
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

      {/* Collapsible Subtasks */}
      {isExpanded && (
        <div className="ml-8 mt-1 space-y-1">
          {allSubtasks.map(subtask => (
            <div
              key={subtask.id}
              className="flex items-center gap-2.5 px-3 py-2 bg-dark-tertiary rounded-lg group/subtask"
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => {
                  if (onToggleSubtask) {
                    onToggleSubtask(subtask.id);
                  } else if (onToggleProjectSubtask) {
                    onToggleProjectSubtask(subtask.id);
                  }
                }}
                className="w-4 h-4"
              />
              <span className={`flex-1 text-[13px] ${subtask.completed ? 'text-dark-text-muted line-through' : 'text-dark-text-secondary'}`}>
                {subtask.title}
              </span>
              {onDeleteSubtask && (
                <button
                  onClick={() => onDeleteSubtask(subtask.id)}
                  className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover/subtask:opacity-100 transition-opacity"
                  title="Delete subtask"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}

          {/* Add subtask input */}
          {onAddSubtask && (
            <>
              {isAddingSubtask ? (
                <div className="flex items-center gap-2 px-3 py-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddSubtask();
                      if (e.key === 'Escape') {
                        setIsAddingSubtask(false);
                        setNewSubtaskTitle('');
                      }
                    }}
                    placeholder="Subtask title..."
                    autoFocus
                    className="flex-1 text-[13px] bg-dark-tertiary border border-dark-border rounded px-2 py-1.5 text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="px-2 py-1 text-[12px] bg-accent-green text-dark-primary rounded hover:bg-accent-green/90"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingSubtask(false);
                      setNewSubtaskTitle('');
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
                  onClick={() => setIsAddingSubtask(true)}
                  className="flex items-center gap-2 px-3 py-2 text-[12px] text-dark-text-muted hover:text-dark-text-secondary"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add subtask
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
