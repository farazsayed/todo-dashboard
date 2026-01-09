import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { Goal, Task, TaskLink } from '../types';
import { getTodayISO, countAllTasks, countCompletedTasks, findTaskRecursively } from '../utils/storage';
import { AddToTodayButton } from './AddToTodayButton';
import { TaskLinkEditor } from './TaskLinkEditor';
import { SubtaskList } from './SubtaskList';

interface GoalsViewProps {
  onSelectGoal: (goal: Goal | null) => void;
  onSelectTask: (goalId: string, taskId: string) => void;
  onClose: () => void;
}

interface TaskRowProps {
  task: Task;
  goalId: string;
  goalColor: string;
  depth: number;
  onEditTask: (goalId: string, taskId: string) => void;
  expandedTasks: Set<string>;
  toggleExpanded: (taskId: string) => void;
}

function TaskRow({
  task,
  goalId,
  goalColor,
  depth,
  onEditTask,
  expandedTasks,
  toggleExpanded,
}: TaskRowProps) {
  const { toggleTaskCompletion } = useApp();
  const today = getTodayISO();
  const isCompletedToday = task.completedDates.includes(today);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);
  const linkCount = task.links?.length || 0;
  const subtaskCount = task.subtasks?.length || 0;

  return (
    <>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-dark-tertiary rounded-lg cursor-pointer group"
        style={{ paddingLeft: `${(depth * 20) + 12}px` }}
        onClick={() => onEditTask(goalId, task.id)}
      >
        {/* Expand/collapse for subtasks */}
        {hasSubtasks ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded(task.id);
            }}
            className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary flex-shrink-0"
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
        ) : (
          <div className="w-5" />
        )}

        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isCompletedToday}
          onChange={(e) => {
            e.stopPropagation();
            toggleTaskCompletion(goalId, task.id, today);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 flex-shrink-0"
        />

        {/* Task title */}
        <span
          className={`flex-1 text-[14px] ${
            isCompletedToday ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'
          }`}
        >
          {task.title}
        </span>

        {/* Subtask count badge */}
        {subtaskCount > 0 && (
          <span className="text-[10px] text-dark-text-muted bg-dark-tertiary px-1.5 py-0.5 rounded">
            {subtaskCount}
          </span>
        )}

        {/* Links count badge */}
        {linkCount > 0 && (
          <span className="text-[10px] text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {linkCount}
          </span>
        )}

        {/* Add to today button */}
        <div onClick={(e) => e.stopPropagation()}>
          <AddToTodayButton
            goalId={goalId}
            taskId={task.id}
            scheduledDates={task.scheduledDates}
            size="sm"
          />
        </div>

        {/* Edit button (visible on hover) */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditTask(goalId, task.id);
          }}
          className="p-1 text-dark-text-muted hover:text-dark-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
      </div>

      {/* Nested subtasks */}
      {hasSubtasks && isExpanded && (
        <div>
          {task.subtasks.map((subtask) => (
            <TaskRow
              key={subtask.id}
              task={subtask}
              goalId={goalId}
              goalColor={goalColor}
              depth={depth + 1}
              onEditTask={onEditTask}
              expandedTasks={expandedTasks}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      )}
    </>
  );
}

// Collect all links from a goal's tasks recursively
function collectAllLinks(tasks: Task[]): { taskTitle: string; links: TaskLink[] }[] {
  const result: { taskTitle: string; links: TaskLink[] }[] = [];

  const traverse = (taskList: Task[]) => {
    for (const task of taskList) {
      if (task.links && task.links.length > 0) {
        result.push({ taskTitle: task.title, links: task.links });
      }
      if (task.subtasks && task.subtasks.length > 0) {
        traverse(task.subtasks);
      }
    }
  };

  traverse(tasks);
  return result;
}

// Inline Task Editor Component
interface InlineTaskEditorProps {
  goalId: string;
  taskId: string;
  onClose: () => void;
}

function InlineTaskEditor({ goalId, taskId, onClose }: InlineTaskEditorProps) {
  const { state, updateTaskRecursive, deleteTaskRecursive, addTaskLink, updateTaskLink, deleteTaskLink } = useApp();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [task, setTask] = useState<Task | null>(null);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    const foundGoal = state.goals.find(g => g.id === goalId);
    if (foundGoal) {
      setGoal(foundGoal);
      const foundTask = findTaskRecursively(foundGoal.tasks, taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
      }
    }
  }, [goalId, taskId, state.goals]);

  const handleSave = () => {
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

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[400px] bg-dark-secondary border-l border-dark-border z-[60] overflow-y-auto shadow-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[14px] font-semibold text-dark-text-secondary uppercase tracking-wide">
            Edit Task
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

        <div className="space-y-5">
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
                {(task.subtasks?.length || 0) > 0 && (
                  <span className="ml-2 text-dark-text-muted">({task.subtasks?.length})</span>
                )}
              </label>
            </div>
            <div className="bg-dark-tertiary border border-dark-border rounded-lg p-2">
              <SubtaskList
                goalId={goalId}
                parentTaskId={taskId}
                subtasks={task.subtasks || []}
                depth={0}
                maxDepth={2}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleSave}
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
        </div>
      </div>
    </div>
  );
}

export function GoalsView({ onSelectGoal, onClose }: GoalsViewProps) {
  const { state, addTask } = useApp();
  const { goals } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set(goals.map(g => g.id)));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [addingTaskToGoal, setAddingTaskToGoal] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<{ goalId: string; taskId: string } | null>(null);

  const handleEditGoal = (goal: Goal) => {
    onSelectGoal(goal);
    onClose();
  };

  const handleEditTask = (goalId: string, taskId: string) => {
    // Open inline editor instead of closing
    setEditingTask({ goalId, taskId });
  };

  const handleCloseInlineEditor = () => {
    setEditingTask(null);
  };

  const toggleGoalExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const toggleTaskExpanded = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const toggleResourcesExpanded = (goalId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedResources(newExpanded);
  };

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

  // Filter goals and tasks based on search query
  const filterTasks = (tasks: Task[], query: string): Task[] => {
    if (!query.trim()) return tasks;
    const lowerQuery = query.toLowerCase();
    return tasks.filter(task => {
      const matchesTitle = task.title.toLowerCase().includes(lowerQuery);
      const hasMatchingSubtask = task.subtasks?.some(st =>
        st.title.toLowerCase().includes(lowerQuery) ||
        filterTasks(st.subtasks || [], query).length > 0
      );
      return matchesTitle || hasMatchingSubtask;
    });
  };

  const filteredGoals = goals.map(goal => ({
    ...goal,
    tasks: filterTasks(goal.tasks, searchQuery),
  })).filter(goal => {
    if (!searchQuery.trim()) return true;
    const matchesGoal = goal.title.toLowerCase().includes(searchQuery.toLowerCase());
    const hasMatchingTasks = goal.tasks.length > 0;
    return matchesGoal || hasMatchingTasks;
  });

  return (
    <div className="fixed inset-0 bg-dark-primary z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-dark-secondary border-b border-dark-border z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-dark-text-primary">Goals</h1>
            <span className="text-[14px] text-dark-text-muted">({goals.length} goals)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectGoal(null);
                onClose();
              }}
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

        {/* Search bar */}
        <div className="px-6 pb-4">
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-text-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search goals and tasks..."
              className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>
        </div>
      </div>

      {/* Goals Checklist */}
      <div className={`max-w-4xl mx-auto p-6 ${editingTask ? 'mr-[400px]' : ''}`}>
        {goals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-[20px] font-semibold text-dark-text-primary mb-2">No goals yet</h2>
            <p className="text-[14px] text-dark-text-muted mb-6">
              Create your first goal to start planning your projects
            </p>
            <button
              onClick={() => {
                onSelectGoal(null);
                onClose();
              }}
              className="px-6 py-3 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
            >
              Create Your First Goal
            </button>
          </div>
        ) : filteredGoals.length === 0 ? (
          <div className="text-center py-12 text-dark-text-muted">
            <p className="text-[14px]">No goals or tasks match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGoals.map(goal => {
              const totalTasks = countAllTasks(goal.tasks);
              const completedTasks = countCompletedTasks(goal.tasks);
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const isExpanded = expandedGoals.has(goal.id);
              const allLinks = collectAllLinks(goal.tasks);
              const isResourcesExpanded = expandedResources.has(goal.id);

              return (
                <div
                  key={goal.id}
                  className="bg-dark-secondary border border-dark-border rounded-xl overflow-hidden"
                >
                  {/* Goal Header - Collapsible */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-tertiary/50"
                    onClick={() => toggleGoalExpanded(goal.id)}
                  >
                    {/* Expand/collapse arrow */}
                    <svg
                      className={`w-4 h-4 text-dark-text-muted transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>

                    {/* Color indicator */}
                    <div
                      className="w-3 h-3 rounded-sm flex-shrink-0"
                      style={{ backgroundColor: goal.color }}
                    />

                    {/* Goal title */}
                    <h3 className="flex-1 text-[16px] font-semibold text-dark-text-primary">
                      {goal.title}
                    </h3>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-dark-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: goal.color }}
                        />
                      </div>
                      <span className="text-[12px] text-dark-text-muted font-mono w-12 text-right">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>

                    {/* Edit goal button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditGoal(goal);
                      }}
                      className="p-2 text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <>
                      {/* Goal Notes */}
                      {goal.notes && (
                        <div className="px-4 pb-3 pt-0">
                          <div className="text-[11px] font-medium text-dark-text-muted uppercase tracking-wide mb-1.5">
                            Notes
                          </div>
                          <p className="text-[13px] text-dark-text-secondary bg-dark-tertiary/50 px-3 py-2 rounded-lg whitespace-pre-wrap">
                            {goal.notes}
                          </p>
                        </div>
                      )}

                      {/* Resources/Links Section */}
                      {allLinks.length > 0 && (
                        <div className="px-4 pb-3">
                          <button
                            type="button"
                            onClick={() => toggleResourcesExpanded(goal.id)}
                            className="flex items-center gap-2 text-[11px] font-medium text-dark-text-muted uppercase tracking-wide mb-1.5 hover:text-dark-text-secondary"
                          >
                            <svg
                              className={`w-3 h-3 transition-transform ${isResourcesExpanded ? 'rotate-90' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            Resources ({allLinks.reduce((sum, t) => sum + t.links.length, 0)} links)
                          </button>
                          {isResourcesExpanded && (
                            <div className="bg-dark-tertiary/50 rounded-lg p-3 space-y-3">
                              {allLinks.map(({ taskTitle, links }, idx) => (
                                <div key={idx}>
                                  <div className="text-[11px] text-dark-text-muted mb-1">{taskTitle}</div>
                                  <div className="space-y-1">
                                    {links.map(link => (
                                      <a
                                        key={link.id}
                                        href={link.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 p-2 bg-dark-secondary rounded hover:bg-dark-tertiary group"
                                      >
                                        <svg className="w-4 h-4 text-accent-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                        </svg>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-[13px] text-accent-blue group-hover:underline truncate">{link.title}</div>
                                          <div className="text-[10px] text-dark-text-muted truncate">{link.url}</div>
                                        </div>
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tasks List */}
                      <div className="border-t border-dark-border">
                        {goal.tasks.length === 0 ? (
                          <p className="text-[13px] text-dark-text-muted text-center py-4">
                            No tasks yet
                          </p>
                        ) : (
                          <div className="py-2">
                            {goal.tasks.map(task => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                goalId={goal.id}
                                goalColor={goal.color}
                                depth={0}
                                onEditTask={handleEditTask}
                                expandedTasks={expandedTasks}
                                toggleExpanded={toggleTaskExpanded}
                              />
                            ))}
                          </div>
                        )}

                        {/* Add Task */}
                        <div className="px-3 pb-3">
                          {addingTaskToGoal === goal.id ? (
                            <div className="flex items-center gap-2 pl-7">
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
                                placeholder="New task..."
                                autoFocus
                                className="flex-1 bg-dark-tertiary border border-dark-border rounded-lg px-3 py-2 text-[13px] text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                              />
                              <button
                                onClick={() => handleAddTask(goal.id)}
                                className="p-2 text-accent-green hover:text-accent-green/80"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setAddingTaskToGoal(null);
                                  setNewTaskTitle('');
                                }}
                                className="p-2 text-dark-text-muted hover:text-dark-text-primary"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setAddingTaskToGoal(goal.id)}
                              className="flex items-center gap-2 py-2 px-3 ml-5 text-[13px] text-dark-text-muted hover:text-dark-text-primary"
                            >
                              <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              Add task
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inline Task Editor */}
      {editingTask && (
        <InlineTaskEditor
          goalId={editingTask.goalId}
          taskId={editingTask.taskId}
          onClose={handleCloseInlineEditor}
        />
      )}
    </div>
  );
}
