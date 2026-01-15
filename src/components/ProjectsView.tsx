import { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import type { Project, Task, TaskLink } from '../types';
import { getTodayISO, countAllTasks, countCompletedTasks, findTaskRecursively } from '../utils/storage';
import { AddToTodayButton } from './AddToTodayButton';
import { TaskLinkEditor } from './TaskLinkEditor';
import { SubtaskList } from './SubtaskList';
import { InlineProjectEditor } from './InlineProjectEditor';
import { Breadcrumb } from './ui/Breadcrumb';
import { IconButton } from './ui/Button';

interface ProjectsViewProps {
  onSelectProject: (project: Project | null) => void;
  onSelectTask: (projectId: string, taskId: string) => void;
  onClose: () => void;
}

interface TaskRowProps {
  task: Task;
  projectId: string;
  projectColor: string;
  depth: number;
  onEditTask: (projectId: string, taskId: string) => void;
  expandedTasks: Set<string>;
  toggleExpanded: (taskId: string) => void;
}

function TaskRow({
  task,
  projectId,
  projectColor,
  depth,
  onEditTask,
  expandedTasks,
  toggleExpanded,
}: TaskRowProps) {
  const { toggleTaskCompletion, updateTaskRecursive, incrementTaskCounter, decrementTaskCounter } = useApp();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const today = getTodayISO();
  const isCompletedToday = task.completedDates.includes(today);
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const isExpanded = expandedTasks.has(task.id);
  const linkCount = task.links?.length || 0;
  const subtaskCount = task.subtasks?.length || 0;

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle.trim() !== task.title) {
      updateTaskRecursive(projectId, task.id, { title: editedTitle.trim() });
    } else {
      setEditedTitle(task.title);
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === 'Escape') {
      setEditedTitle(task.title);
      setIsEditingTitle(false);
    }
  };

  return (
    <>
      <div
        className="flex items-center gap-2 py-2 px-3 hover:bg-dark-tertiary rounded-lg cursor-pointer group"
        style={{ paddingLeft: `${(depth * 20) + 12}px` }}
        onClick={() => !isEditingTitle && onEditTask(projectId, task.id)}
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
            toggleTaskCompletion(projectId, task.id, today);
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 flex-shrink-0"
        />

        {/* Task title - double-click to edit */}
        {isEditingTitle ? (
          <input
            ref={titleInputRef}
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleSaveTitle}
            onKeyDown={handleTitleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 bg-dark-tertiary border border-accent-blue/50 rounded px-2 py-0.5 text-[14px] text-dark-text-primary focus:outline-none"
          />
        ) : (
          <span
            className={`flex-1 text-[14px] ${
              isCompletedToday ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'
            }`}
            onDoubleClick={(e) => {
              e.stopPropagation();
              setIsEditingTitle(true);
            }}
            title="Double-click to edit"
          >
            {task.title}
          </span>
        )}

        {/* Counter display and controls */}
        {task.targetCount !== undefined && (
          <div
            className="flex items-center gap-1.5 bg-dark-tertiary rounded-lg px-2 py-1"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                decrementTaskCounter(projectId, task.id);
              }}
              disabled={(task.currentCount || 0) <= 0}
              className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <div className="flex items-center gap-1 min-w-[48px] justify-center">
              <span
                className="text-[13px] font-medium"
                style={{ color: projectColor }}
              >
                {task.currentCount || 0}
              </span>
              <span className="text-[11px] text-dark-text-muted">/</span>
              <span className="text-[13px] text-dark-text-secondary">{task.targetCount}</span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                incrementTaskCounter(projectId, task.id);
              }}
              disabled={(task.currentCount || 0) >= task.targetCount}
              className="w-5 h-5 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-secondary rounded disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {/* Progress bar */}
            <div className="w-12 h-1.5 bg-dark-secondary rounded-full overflow-hidden ml-1">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${((task.currentCount || 0) / task.targetCount) * 100}%`,
                  backgroundColor: projectColor,
                }}
              />
            </div>
          </div>
        )}

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
            projectId={projectId}
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
            onEditTask(projectId, task.id);
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
              projectId={projectId}
              projectColor={projectColor}
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

// Collect all links from a project's tasks recursively
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

// Helper to build breadcrumb path for a task
function buildTaskBreadcrumb(tasks: Task[], taskId: string, path: Task[] = []): Task[] | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return [...path, task];
    }
    if (task.subtasks && task.subtasks.length > 0) {
      const found = buildTaskBreadcrumb(task.subtasks, taskId, [...path, task]);
      if (found) return found;
    }
  }
  return null;
}

// Inline Task Editor Component
interface InlineTaskEditorProps {
  projectId: string;
  taskId: string;
  onClose: () => void;
  onNavigateToTask?: (taskId: string) => void;
}

function InlineTaskEditor({ projectId, taskId, onClose, onNavigateToTask }: InlineTaskEditorProps) {
  const { state, updateTaskRecursive, deleteTaskRecursive, addTaskLink, updateTaskLink, deleteTaskLink } = useApp();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [task, setTask] = useState<Task | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [breadcrumbPath, setBreadcrumbPath] = useState<Task[]>([]);
  const [hasCounter, setHasCounter] = useState(false);
  const [targetCount, setTargetCount] = useState<number>(5);

  useEffect(() => {
    const foundProject = state.projects.find(g => g.id === projectId);
    if (foundProject) {
      setProject(foundProject);
      const foundTask = findTaskRecursively(foundProject.tasks, taskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
        setNotes(foundTask.notes || '');
        setHasCounter(foundTask.targetCount !== undefined);
        setTargetCount(foundTask.targetCount || 5);
        // Build breadcrumb path
        const path = buildTaskBreadcrumb(foundProject.tasks, taskId);
        setBreadcrumbPath(path || []);
      }
    }
  }, [projectId, taskId, state.projects]);

  const handleSave = () => {
    if (title.trim() && task) {
      updateTaskRecursive(projectId, taskId, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        targetCount: hasCounter ? targetCount : undefined,
        currentCount: hasCounter ? (task.currentCount || 0) : undefined,
      });
      onClose();
    }
  };

  const handleDelete = () => {
    if (confirm('Delete this task and all its subtasks?')) {
      deleteTaskRecursive(projectId, taskId);
      onClose();
    }
  };

  const handleAddLink = (link: TaskLink) => {
    addTaskLink(projectId, taskId, link.title, link.url);
  };

  const handleUpdateLink = (link: TaskLink) => {
    updateTaskLink(projectId, taskId, link);
  };

  const handleDeleteLink = (linkId: string) => {
    deleteTaskLink(projectId, taskId, linkId);
  };

  if (!project || !task) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = [
    { label: project.title, onClick: onClose },
    ...breadcrumbPath.slice(0, -1).map(t => ({
      label: t.title,
      onClick: () => onNavigateToTask?.(t.id),
    })),
    { label: task.title },
  ];

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-dark-secondary border-l border-dark-border z-[60] overflow-y-auto shadow-xl">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
            Edit Task
          </h2>
          <IconButton variant="ghost" size="sm" label="Close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Breadcrumb navigation */}
        <div className="mb-4">
          <Breadcrumb items={breadcrumbItems} color={project.color} />
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

          {/* Counter toggle and settings */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[12px] font-medium text-dark-text-secondary">
                Progress Counter
              </label>
              <button
                type="button"
                onClick={() => setHasCounter(!hasCounter)}
                className={`w-10 h-5 rounded-full transition-colors relative ${
                  hasCounter ? 'bg-accent-green' : 'bg-dark-tertiary'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    hasCounter ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
            {hasCounter && (
              <div className="bg-dark-tertiary border border-dark-border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-dark-text-secondary">Target:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={targetCount}
                    onChange={(e) => setTargetCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-2 py-1.5 text-[14px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary text-center focus:outline-none focus:border-accent-blue"
                  />
                  <span className="text-[11px] text-dark-text-muted">
                    (e.g., "Apply for {targetCount} jobs")
                  </span>
                </div>
                {task?.currentCount !== undefined && task?.currentCount > 0 && (
                  <div className="mt-2 text-[11px] text-dark-text-muted">
                    Current progress: {task.currentCount}/{task.targetCount}
                  </div>
                )}
              </div>
            )}
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
                projectId={projectId}
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

export function ProjectsView({ onSelectProject, onClose }: ProjectsViewProps) {
  const { state, addTask, unarchiveProject, reorderProjects, updateProject } = useApp();
  const { projects, archivedProjects } = state;
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(projects.map(g => g.id)));
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());
  const [expandedResources, setExpandedResources] = useState<Set<string>>(new Set());
  const [addingTaskToProject, setAddingTaskToProject] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [editingTask, setEditingTask] = useState<{ projectId: string; taskId: string } | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [draggedProjectId, setDraggedProjectId] = useState<string | null>(null);
  const [dragOverProjectId, setDragOverProjectId] = useState<string | null>(null);
  const [editingNotesProjectId, setEditingNotesProjectId] = useState<string | null>(null);
  const [editingNotesContent, setEditingNotesContent] = useState('');
  const notesTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus notes textarea when editing starts
  useEffect(() => {
    if (editingNotesProjectId && notesTextareaRef.current) {
      notesTextareaRef.current.focus();
    }
  }, [editingNotesProjectId]);

  // Keep editingProject in sync with context state
  useEffect(() => {
    if (editingProject) {
      const updatedProject = projects.find(g => g.id === editingProject.id);
      if (updatedProject) {
        setEditingProject(updatedProject);
      } else {
        // Project was deleted or archived
        setEditingProject(null);
      }
    }
  }, [projects, editingProject?.id]);

  const handleEditProject = (proj: Project) => {
    // Open inline editor instead of navigating away
    setEditingProject(proj);
    setEditingTask(null); // Close any task editor
  };

  const handleStartEditingNotes = (proj: Project) => {
    setEditingNotesProjectId(proj.id);
    setEditingNotesContent(proj.notes || '');
  };

  const handleSaveNotes = (projectId: string) => {
    const proj = projects.find(g => g.id === projectId);
    if (proj) {
      updateProject({
        ...proj,
        notes: editingNotesContent.trim() || undefined,
      });
    }
    setEditingNotesProjectId(null);
    setEditingNotesContent('');
  };

  const handleNotesKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setEditingNotesProjectId(null);
      setEditingNotesContent('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newValue = editingNotesContent.substring(0, start) + '\t' + editingNotesContent.substring(end);
      setEditingNotesContent(newValue);
      setTimeout(() => {
        if (notesTextareaRef.current) {
          notesTextareaRef.current.selectionStart = notesTextareaRef.current.selectionEnd = start + 1;
        }
      }, 0);
    }
  };

  const handleEditTask = (projectId: string, taskId: string) => {
    // Open inline editor instead of closing
    setEditingTask({ projectId, taskId });
    setEditingProject(null); // Close project editor
  };

  const handleCloseTaskEditor = () => {
    setEditingTask(null);
  };

  const handleCloseProjectEditor = () => {
    setEditingProject(null);
  };

  const toggleProjectExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  // Helper to collect all task IDs recursively
  const collectAllTaskIds = (tasks: Task[]): string[] => {
    const ids: string[] = [];
    const collect = (taskList: Task[]) => {
      taskList.forEach(task => {
        ids.push(task.id);
        if (task.subtasks && task.subtasks.length > 0) {
          collect(task.subtasks);
        }
      });
    };
    collect(tasks);
    return ids;
  };

  const expandAll = () => {
    // Expand all projects
    setExpandedProjects(new Set(projects.map(g => g.id)));
    // Expand all tasks and subtasks
    const allTaskIds: string[] = [];
    projects.forEach(proj => {
      allTaskIds.push(...collectAllTaskIds(proj.tasks));
    });
    setExpandedTasks(new Set(allTaskIds));
  };

  const collapseAll = () => {
    setExpandedProjects(new Set());
    setExpandedTasks(new Set());
  };

  // Check if everything is expanded (projects + all tasks)
  const allTaskIds = projects.flatMap(g => collectAllTaskIds(g.tasks));
  const allExpanded = projects.length > 0 && expandedProjects.size === projects.length && expandedTasks.size >= allTaskIds.length;
  const allCollapsed = expandedProjects.size === 0 && expandedTasks.size === 0;

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    setDraggedProjectId(projectId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', projectId);
  };

  const handleDragEnd = () => {
    setDraggedProjectId(null);
    setDragOverProjectId(null);
  };

  const handleDragOver = (e: React.DragEvent, projectId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (projectId !== draggedProjectId) {
      setDragOverProjectId(projectId);
    }
  };

  const handleDragLeave = () => {
    setDragOverProjectId(null);
  };

  const handleDrop = (e: React.DragEvent, targetProjectId: string) => {
    e.preventDefault();
    if (!draggedProjectId || draggedProjectId === targetProjectId) {
      setDraggedProjectId(null);
      setDragOverProjectId(null);
      return;
    }

    const sourceIndex = projects.findIndex(g => g.id === draggedProjectId);
    const targetIndex = projects.findIndex(g => g.id === targetProjectId);

    if (sourceIndex === -1 || targetIndex === -1) return;

    const newProjects = [...projects];
    const [movedProject] = newProjects.splice(sourceIndex, 1);
    newProjects.splice(targetIndex, 0, movedProject);

    reorderProjects(newProjects);
    setDraggedProjectId(null);
    setDragOverProjectId(null);
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

  const toggleResourcesExpanded = (projectId: string) => {
    const newExpanded = new Set(expandedResources);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedResources(newExpanded);
  };

  const handleAddTask = (projectId: string) => {
    if (newTaskTitle.trim()) {
      addTask(projectId, newTaskTitle.trim());
      setNewTaskTitle('');
      setAddingTaskToProject(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, projectId: string) => {
    if (e.key === 'Enter') {
      handleAddTask(projectId);
    } else if (e.key === 'Escape') {
      setNewTaskTitle('');
      setAddingTaskToProject(null);
    }
  };

  // Filter projects and tasks based on search query
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

  const filteredProjects = projects.map(proj => ({
    ...proj,
    tasks: filterTasks(proj.tasks, searchQuery),
  })).filter(proj => {
    if (!searchQuery.trim()) return true;
    const matchesProject = proj.title.toLowerCase().includes(searchQuery.toLowerCase());
    const hasMatchingTasks = proj.tasks.length > 0;
    return matchesProject || hasMatchingTasks;
  });

  // Quick-jump keyboard shortcuts (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Check for number keys 1-9
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9) {
        const index = num - 1;
        if (index < filteredProjects.length) {
          const proj = filteredProjects[index];
          // Toggle expansion and scroll to the project
          toggleProjectExpanded(proj.id);

          // Scroll the project into view
          const projectElement = document.getElementById(`project-${proj.id}`);
          if (projectElement) {
            projectElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredProjects, toggleProjectExpanded]);

  return (
    <div className="fixed inset-0 bg-dark-primary z-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-dark-secondary border-b border-dark-border z-10">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-dark-text-primary">Projects</h1>
            <span className="text-[14px] text-dark-text-muted">({projects.length} projects)</span>
          </div>
          <div className="flex items-center gap-3">
            {archivedProjects.length > 0 && (
              <button
                onClick={() => setShowArchived(!showArchived)}
                className={`px-4 py-2 rounded-lg font-medium text-[14px] ${
                  showArchived
                    ? 'bg-dark-tertiary text-dark-text-primary'
                    : 'bg-dark-tertiary/50 text-dark-text-secondary hover:bg-dark-tertiary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archived ({archivedProjects.length})
                </span>
              </button>
            )}
            <button
              onClick={() => {
                onSelectProject(null);
                onClose();
              }}
              className="px-4 py-2 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium text-[14px]"
            >
              + New Project
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

        {/* Search bar and controls */}
        <div className="px-6 pb-4 flex items-center gap-3">
          <div className="relative flex-1">
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
              placeholder="Search projects and tasks..."
              className="w-full pl-10 pr-4 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>

          {/* Collapse/Expand all buttons */}
          {projects.length > 0 && (
            <div className="flex items-center gap-1.5">
              <IconButton
                variant="secondary"
                size="sm"
                label="Collapse all"
                onClick={collapseAll}
                disabled={allCollapsed}
                className={allCollapsed ? 'opacity-50' : ''}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </IconButton>
              <IconButton
                variant="secondary"
                size="sm"
                label="Expand all"
                onClick={expandAll}
                disabled={allExpanded}
                className={allExpanded ? 'opacity-50' : ''}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              </IconButton>
            </div>
          )}
        </div>
      </div>

      {/* Projects Checklist */}
      <div className={`max-w-4xl mx-auto p-6 ${editingTask || editingProject ? 'mr-[420px]' : ''}`}>
        {projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-[20px] font-semibold text-dark-text-primary mb-2">No projects yet</h2>
            <p className="text-[14px] text-dark-text-muted mb-6">
              Create your first project to start organizing your work
            </p>
            <button
              onClick={() => {
                onSelectProject(null);
                onClose();
              }}
              className="px-6 py-3 bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
            >
              Create Your First Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12 text-dark-text-muted">
            <p className="text-[14px]">No projects or tasks match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Archived Projects Section */}
            {showArchived && archivedProjects.length > 0 && (
              <div className="mb-6">
                <h2 className="text-[14px] font-semibold text-dark-text-muted uppercase tracking-wide mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  Archived Projects
                </h2>
                <div className="space-y-2">
                  {archivedProjects.map(proj => {
                    const totalTasks = countAllTasks(proj.tasks);
                    const completedTasks = countCompletedTasks(proj.tasks);
                    const archivedDate = proj.archivedAt ? new Date(proj.archivedAt).toLocaleDateString() : '';

                    return (
                      <div
                        key={proj.id}
                        className="bg-dark-secondary/50 border border-dark-border rounded-xl p-4 opacity-75"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-3 h-3 rounded-sm flex-shrink-0 opacity-50"
                            style={{ backgroundColor: proj.color }}
                          />
                          <h3 className="flex-1 text-[15px] font-medium text-dark-text-secondary">
                            {proj.title}
                          </h3>
                          <span className="text-[12px] text-dark-text-muted">
                            {completedTasks}/{totalTasks} completed
                          </span>
                          {archivedDate && (
                            <span className="text-[11px] text-dark-text-muted">
                              Archived {archivedDate}
                            </span>
                          )}
                          <button
                            onClick={() => unarchiveProject(proj.id)}
                            className="px-3 py-1.5 text-[12px] bg-accent-blue/20 text-accent-blue rounded-lg hover:bg-accent-blue/30 font-medium"
                          >
                            Restore
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Projects */}
            {filteredProjects.map(proj => {
              const totalTasks = countAllTasks(proj.tasks);
              const completedTasks = countCompletedTasks(proj.tasks);
              const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
              const isExpanded = expandedProjects.has(proj.id);
              const allLinks = collectAllLinks(proj.tasks);
              const isResourcesExpanded = expandedResources.has(proj.id);

              // Get index for keyboard shortcut indicator (1-9)
              const projIndex = filteredProjects.indexOf(proj);
              const shortcutNum = projIndex >= 0 && projIndex < 9 ? projIndex + 1 : null;
              const isDragging = draggedProjectId === proj.id;
              const isDragOver = dragOverProjectId === proj.id;

              return (
                <div
                  key={proj.id}
                  id={`project-${proj.id}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, proj.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, proj.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, proj.id)}
                  className={`bg-dark-secondary border rounded-xl overflow-hidden transition-all ${
                    isDragging ? 'opacity-50 border-accent-blue' : ''
                  } ${
                    isDragOver ? 'border-accent-green border-2 scale-[1.01]' : 'border-dark-border'
                  }`}
                >
                  {/* Project Header - Collapsible */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-dark-tertiary/50"
                    onClick={() => toggleProjectExpanded(proj.id)}
                  >
                    {/* Drag handle */}
                    <div
                      className="w-5 h-5 flex items-center justify-center text-dark-text-muted cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                      </svg>
                    </div>

                    {/* Shortcut number indicator */}
                    {shortcutNum && (
                      <span className="w-5 h-5 flex items-center justify-center text-[10px] font-mono text-dark-text-muted bg-dark-tertiary rounded">
                        {shortcutNum}
                      </span>
                    )}

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
                      style={{ backgroundColor: proj.color }}
                    />

                    {/* Project title */}
                    <h3 className="flex-1 text-[16px] font-semibold text-dark-text-primary">
                      {proj.title}
                    </h3>

                    {/* Progress indicator */}
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-dark-tertiary rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${progress}%`, backgroundColor: proj.color }}
                        />
                      </div>
                      <span className="text-[12px] text-dark-text-muted font-mono w-12 text-right">
                        {completedTasks}/{totalTasks}
                      </span>
                    </div>

                    {/* Edit project button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditProject(proj);
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
                      {/* Project Notes - Click to edit */}
                      <div className="px-4 pb-3 pt-0">
                        <div className="text-[11px] font-medium text-dark-text-muted uppercase tracking-wide mb-1.5">
                          Notes
                        </div>
                        {editingNotesProjectId === proj.id ? (
                          <textarea
                            ref={notesTextareaRef}
                            value={editingNotesContent}
                            onChange={(e) => setEditingNotesContent(e.target.value)}
                            onBlur={() => handleSaveNotes(proj.id)}
                            onKeyDown={handleNotesKeyDown}
                            placeholder="Add notes, context, or details..."
                            rows={4}
                            className="w-full px-3 py-2 text-[13px] bg-dark-tertiary border border-accent-blue/50 rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none resize-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEditingNotes(proj);
                            }}
                            className="min-h-[60px] px-3 py-2 text-[13px] bg-dark-tertiary/50 rounded-lg cursor-text hover:bg-dark-tertiary transition-colors"
                          >
                            {proj.notes ? (
                              <p className="text-dark-text-secondary whitespace-pre-wrap">{proj.notes}</p>
                            ) : (
                              <p className="text-dark-text-muted">Click to add notes...</p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Resources/Links Section - includes project-level and task-level links */}
                      {((proj.links && proj.links.length > 0) || allLinks.length > 0) && (
                        <div className="px-4 pb-3">
                          <button
                            type="button"
                            onClick={() => toggleResourcesExpanded(proj.id)}
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
                            Resources ({(proj.links?.length || 0) + allLinks.reduce((sum, t) => sum + t.links.length, 0)} links)
                          </button>
                          {isResourcesExpanded && (
                            <div className="bg-dark-tertiary/50 rounded-lg p-3 space-y-3">
                              {/* Project-level links */}
                              {proj.links && proj.links.length > 0 && (
                                <div>
                                  <div className="text-[11px] text-dark-text-muted mb-1 flex items-center gap-1.5">
                                    <span
                                      className="w-2 h-2 rounded-sm"
                                      style={{ backgroundColor: proj.color }}
                                    />
                                    Project Links
                                  </div>
                                  <div className="space-y-1">
                                    {proj.links.map(link => (
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
                              )}
                              {/* Task-level links */}
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
                        {proj.tasks.length === 0 ? (
                          <p className="text-[13px] text-dark-text-muted text-center py-4">
                            No tasks yet
                          </p>
                        ) : (
                          <div className="py-2">
                            {proj.tasks.map(task => (
                              <TaskRow
                                key={task.id}
                                task={task}
                                projectId={proj.id}
                                projectColor={proj.color}
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
                          {addingTaskToProject === proj.id ? (
                            <div className="flex items-center gap-2 pl-7">
                              <input
                                type="text"
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, proj.id)}
                                onBlur={() => {
                                  if (!newTaskTitle.trim()) {
                                    setAddingTaskToProject(null);
                                  }
                                }}
                                placeholder="New task..."
                                autoFocus
                                className="flex-1 bg-dark-tertiary border border-dark-border rounded-lg px-3 py-2 text-[13px] text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                              />
                              <button
                                onClick={() => handleAddTask(proj.id)}
                                className="p-2 text-accent-green hover:text-accent-green/80"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  setAddingTaskToProject(null);
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
                              onClick={() => setAddingTaskToProject(proj.id)}
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
          projectId={editingTask.projectId}
          taskId={editingTask.taskId}
          onClose={handleCloseTaskEditor}
          onNavigateToTask={(taskId) => setEditingTask({ projectId: editingTask.projectId, taskId })}
        />
      )}

      {/* Inline Project Editor */}
      {editingProject && (
        <InlineProjectEditor
          project={editingProject}
          onClose={handleCloseProjectEditor}
        />
      )}
    </div>
  );
}
