import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, Project, Task, RecurringTask, OneOffTask, Habit, TaskLink, Subtask, ReadingItem } from '../types';
import {
  loadState,
  saveState,
  generateId,
  getTodayISO,
  findTaskRecursively,
  updateTaskRecursively,
  deleteTaskRecursively,
  addSubtaskToTask,
} from '../utils/storage';

// Action types
type Action =
  | { type: 'SET_STATE'; payload: AppState }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'SET_VIEW_MODE'; payload: AppState['viewMode'] }
  | { type: 'SET_THEME'; payload: 'dark' | 'light' }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: string }
  | { type: 'ARCHIVE_PROJECT'; payload: string }
  | { type: 'UNARCHIVE_PROJECT'; payload: string }
  | { type: 'ADD_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { projectId: string; task: Task } }
  | { type: 'UPDATE_TASK_RECURSIVE'; payload: { projectId: string; taskId: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { projectId: string; taskId: string } }
  | { type: 'DELETE_TASK_RECURSIVE'; payload: { projectId: string; taskId: string } }
  | { type: 'ADD_SUBTASK'; payload: { projectId: string; parentTaskId: string; subtask: Task } }
  | { type: 'ADD_TASK_LINK'; payload: { projectId: string; taskId: string; link: TaskLink } }
  | { type: 'UPDATE_TASK_LINK'; payload: { projectId: string; taskId: string; link: TaskLink } }
  | { type: 'DELETE_TASK_LINK'; payload: { projectId: string; taskId: string; linkId: string } }
  | { type: 'SCHEDULE_TASK_TODAY'; payload: { projectId: string; taskId: string } }
  | { type: 'UNSCHEDULE_TASK_TODAY'; payload: { projectId: string; taskId: string } }
  | { type: 'ADD_RECURRING_TASK'; payload: RecurringTask }
  | { type: 'UPDATE_RECURRING_TASK'; payload: RecurringTask }
  | { type: 'DELETE_RECURRING_TASK'; payload: string }
  | { type: 'SKIP_RECURRING_TASK'; payload: { taskId: string; date: string } }
  | { type: 'UNSKIP_RECURRING_TASK'; payload: { taskId: string; date: string } }
  | { type: 'ADD_ONE_OFF_TASK'; payload: OneOffTask }
  | { type: 'UPDATE_ONE_OFF_TASK'; payload: OneOffTask }
  | { type: 'DELETE_ONE_OFF_TASK'; payload: string }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'REORDER_PROJECTS'; payload: Project[] }
  | { type: 'REORDER_TASKS'; payload: { projectId: string; tasks: Task[] } }
  // Subtask actions for one-off and recurring tasks
  | { type: 'ADD_ONE_OFF_SUBTASK'; payload: { taskId: string; subtask: Subtask } }
  | { type: 'UPDATE_ONE_OFF_SUBTASK'; payload: { taskId: string; subtaskId: string; updates: Partial<Subtask> } }
  | { type: 'DELETE_ONE_OFF_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_ONE_OFF_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'ADD_RECURRING_SUBTASK'; payload: { taskId: string; subtask: Subtask } }
  | { type: 'UPDATE_RECURRING_SUBTASK'; payload: { taskId: string; subtaskId: string; updates: Partial<Subtask> } }
  | { type: 'DELETE_RECURRING_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  | { type: 'TOGGLE_RECURRING_SUBTASK'; payload: { taskId: string; subtaskId: string } }
  // Reading list actions
  | { type: 'ADD_READING_ITEM'; payload: ReadingItem }
  | { type: 'UPDATE_READING_ITEM'; payload: ReadingItem }
  | { type: 'DELETE_READING_ITEM'; payload: string }
  | { type: 'UPDATE_READING_STATUS'; payload: { itemId: string; status: ReadingItem['status'] } };

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'ADD_PROJECT': {
      const newProjects = [...state.projects, action.payload];
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_PROJECT': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.id ? action.payload : p
      );
      return { ...state, projects: newProjects };
    }

    case 'DELETE_PROJECT': {
      const newProjects = state.projects.filter((p) => p.id !== action.payload);
      return { ...state, projects: newProjects };
    }

    case 'ARCHIVE_PROJECT': {
      const projectToArchive = state.projects.find((p) => p.id === action.payload);
      if (!projectToArchive) return state;
      const archivedProject = {
        ...projectToArchive,
        archived: true,
        archivedAt: new Date().toISOString(),
      };
      const newProjects = state.projects.filter((p) => p.id !== action.payload);
      const newArchivedProjects = [...(state.archivedProjects || []), archivedProject];
      return {
        ...state,
        projects: newProjects,
        archivedProjects: newArchivedProjects,
      };
    }

    case 'UNARCHIVE_PROJECT': {
      const projectToUnarchive = (state.archivedProjects || []).find((p) => p.id === action.payload);
      if (!projectToUnarchive) return state;
      const unarchivedProject = {
        ...projectToUnarchive,
        archived: false,
        archivedAt: undefined,
      };
      const newArchivedProjects = (state.archivedProjects || []).filter((p) => p.id !== action.payload);
      const newProjects = [...state.projects, unarchivedProject];
      return {
        ...state,
        archivedProjects: newArchivedProjects,
        projects: newProjects,
      };
    }

    case 'SET_THEME':
      return { ...state, theme: action.payload };

    case 'ADD_TASK': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: [...p.tasks, action.payload.task] }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_TASK': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? {
              ...p,
              tasks: p.tasks.map((t) =>
                t.id === action.payload.task.id ? action.payload.task : t
              ),
            }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'DELETE_TASK': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: p.tasks.filter((t) => t.id !== action.payload.taskId) }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_TASK_RECURSIVE': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: updateTaskRecursively(p.tasks, action.payload.taskId, action.payload.updates) }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'DELETE_TASK_RECURSIVE': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: deleteTaskRecursively(p.tasks, action.payload.taskId) }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'ADD_SUBTASK': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: addSubtaskToTask(p.tasks, action.payload.parentTaskId, action.payload.subtask) }
          : p
      );
      return { ...state, projects: newProjects };
    }

    case 'ADD_TASK_LINK': {
      const { projectId, taskId, link } = action.payload;
      const newProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const task = findTaskRecursively(p.tasks, taskId);
        if (!task) return p;
        return {
          ...p,
          tasks: updateTaskRecursively(p.tasks, taskId, {
            links: [...(task.links || []), link],
          }),
        };
      });
      return { ...state, projects: newProjects };
    }

    case 'UPDATE_TASK_LINK': {
      const { projectId, taskId, link } = action.payload;
      const newProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const task = findTaskRecursively(p.tasks, taskId);
        if (!task) return p;
        return {
          ...p,
          tasks: updateTaskRecursively(p.tasks, taskId, {
            links: (task.links || []).map((l) => (l.id === link.id ? link : l)),
          }),
        };
      });
      return { ...state, projects: newProjects };
    }

    case 'DELETE_TASK_LINK': {
      const { projectId, taskId, linkId } = action.payload;
      const newProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const task = findTaskRecursively(p.tasks, taskId);
        if (!task) return p;
        return {
          ...p,
          tasks: updateTaskRecursively(p.tasks, taskId, {
            links: (task.links || []).filter((l) => l.id !== linkId),
          }),
        };
      });
      return { ...state, projects: newProjects };
    }

    case 'SCHEDULE_TASK_TODAY': {
      const { projectId, taskId } = action.payload;
      const today = getTodayISO();
      const newProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const task = findTaskRecursively(p.tasks, taskId);
        if (!task || task.scheduledDates.includes(today)) return p;
        return {
          ...p,
          tasks: updateTaskRecursively(p.tasks, taskId, {
            scheduledDates: [...task.scheduledDates, today],
          }),
        };
      });
      return { ...state, projects: newProjects };
    }

    case 'UNSCHEDULE_TASK_TODAY': {
      const { projectId, taskId } = action.payload;
      const today = getTodayISO();
      const newProjects = state.projects.map((p) => {
        if (p.id !== projectId) return p;
        const task = findTaskRecursively(p.tasks, taskId);
        if (!task) return p;
        return {
          ...p,
          tasks: updateTaskRecursively(p.tasks, taskId, {
            scheduledDates: task.scheduledDates.filter((d) => d !== today),
          }),
        };
      });
      return { ...state, projects: newProjects };
    }

    case 'ADD_RECURRING_TASK':
      return { ...state, recurringTasks: [...state.recurringTasks, action.payload] };

    case 'UPDATE_RECURRING_TASK':
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_RECURRING_TASK':
      return {
        ...state,
        recurringTasks: state.recurringTasks.filter((t) => t.id !== action.payload),
      };

    case 'SKIP_RECURRING_TASK': {
      const { taskId, date } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? { ...t, skippedDates: [...(t.skippedDates || []), date] }
            : t
        ),
      };
    }

    case 'UNSKIP_RECURRING_TASK': {
      const { taskId, date } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? { ...t, skippedDates: (t.skippedDates || []).filter((d) => d !== date) }
            : t
        ),
      };
    }

    case 'ADD_ONE_OFF_TASK':
      return { ...state, oneOffTasks: [...state.oneOffTasks, action.payload] };

    case 'UPDATE_ONE_OFF_TASK':
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_ONE_OFF_TASK':
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.filter((t) => t.id !== action.payload),
      };

    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };

    case 'DELETE_HABIT':
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload),
      };

    case 'REORDER_PROJECTS':
      return { ...state, projects: action.payload };

    case 'REORDER_TASKS': {
      const newProjects = state.projects.map((p) =>
        p.id === action.payload.projectId
          ? { ...p, tasks: action.payload.tasks }
          : p
      );
      return { ...state, projects: newProjects };
    }

    // One-off task subtask actions
    case 'ADD_ONE_OFF_SUBTASK': {
      const { taskId, subtask } = action.payload;
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
            : t
        ),
      };
    }

    case 'UPDATE_ONE_OFF_SUBTASK': {
      const { taskId, subtaskId, updates } = action.payload;
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((st) =>
                  st.id === subtaskId ? { ...st, ...updates } : st
                ),
              }
            : t
        ),
      };
    }

    case 'DELETE_ONE_OFF_SUBTASK': {
      const { taskId, subtaskId } = action.payload;
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId) }
            : t
        ),
      };
    }

    case 'TOGGLE_ONE_OFF_SUBTASK': {
      const { taskId, subtaskId } = action.payload;
      return {
        ...state,
        oneOffTasks: state.oneOffTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((st) =>
                  st.id === subtaskId
                    ? { ...st, completed: !st.completed, completedDate: !st.completed ? getTodayISO() : undefined }
                    : st
                ),
              }
            : t
        ),
      };
    }

    // Recurring task subtask actions
    case 'ADD_RECURRING_SUBTASK': {
      const { taskId, subtask } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: [...(t.subtasks || []), subtask] }
            : t
        ),
      };
    }

    case 'UPDATE_RECURRING_SUBTASK': {
      const { taskId, subtaskId, updates } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((st) =>
                  st.id === subtaskId ? { ...st, ...updates } : st
                ),
              }
            : t
        ),
      };
    }

    case 'DELETE_RECURRING_SUBTASK': {
      const { taskId, subtaskId } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? { ...t, subtasks: (t.subtasks || []).filter((st) => st.id !== subtaskId) }
            : t
        ),
      };
    }

    case 'TOGGLE_RECURRING_SUBTASK': {
      const { taskId, subtaskId } = action.payload;
      return {
        ...state,
        recurringTasks: state.recurringTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                subtasks: (t.subtasks || []).map((st) =>
                  st.id === subtaskId
                    ? { ...st, completed: !st.completed, completedDate: !st.completed ? getTodayISO() : undefined }
                    : st
                ),
              }
            : t
        ),
      };
    }

    // Reading list reducers
    case 'ADD_READING_ITEM':
      return {
        ...state,
        readingList: [...(state.readingList || []), action.payload],
      };

    case 'UPDATE_READING_ITEM':
      return {
        ...state,
        readingList: (state.readingList || []).map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };

    case 'DELETE_READING_ITEM':
      return {
        ...state,
        readingList: (state.readingList || []).filter((item) => item.id !== action.payload),
      };

    case 'UPDATE_READING_STATUS': {
      const { itemId, status } = action.payload;
      return {
        ...state,
        readingList: (state.readingList || []).map((item) =>
          item.id === itemId
            ? {
                ...item,
                status,
                completedAt: status === 'completed' ? new Date().toISOString() : undefined,
              }
            : item
        ),
      };
    }

    default:
      return state;
  }
}

// Context types
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  // Convenience methods
  setSelectedDate: (date: string) => void;
  setViewMode: (mode: AppState['viewMode']) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTheme: () => void;
  addProject: (title: string, color: string) => void;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  archiveProject: (projectId: string) => void;
  unarchiveProject: (projectId: string) => void;
  addTask: (projectId: string, title: string) => void;
  updateTask: (projectId: string, task: Task) => void;
  updateTaskRecursive: (projectId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (projectId: string, taskId: string) => void;
  deleteTaskRecursive: (projectId: string, taskId: string) => void;
  toggleTaskCompletion: (projectId: string, taskId: string, date: string) => void;
  scheduleTaskForDate: (projectId: string, taskId: string, date: string) => void;
  unscheduleTaskFromDate: (projectId: string, taskId: string, date: string) => void;
  // Subtask methods
  addSubtask: (projectId: string, parentTaskId: string, title: string) => void;
  // Link methods
  addTaskLink: (projectId: string, taskId: string, title: string, url: string) => void;
  updateTaskLink: (projectId: string, taskId: string, link: TaskLink) => void;
  deleteTaskLink: (projectId: string, taskId: string, linkId: string) => void;
  // Quick scheduling
  scheduleTaskToday: (projectId: string, taskId: string) => void;
  unscheduleTaskToday: (projectId: string, taskId: string) => void;
  toggleTaskScheduleToday: (projectId: string, taskId: string) => void;
  // Task counter
  updateTaskCounter: (projectId: string, taskId: string, count: number) => void;
  incrementTaskCounter: (projectId: string, taskId: string) => void;
  decrementTaskCounter: (projectId: string, taskId: string) => void;
  // Recurring task counter
  updateRecurringTaskCounter: (taskId: string, count: number) => void;
  incrementRecurringTaskCounter: (taskId: string) => void;
  decrementRecurringTaskCounter: (taskId: string) => void;
  // One-off task counter
  updateOneOffTaskCounter: (taskId: string, count: number) => void;
  incrementOneOffTaskCounter: (taskId: string) => void;
  decrementOneOffTaskCounter: (taskId: string) => void;
  // Recurring task
  skipRecurringTask: (taskId: string, date: string) => void;
  unskipRecurringTask: (taskId: string, date: string) => void;
  reorderProjects: (projects: Project[]) => void;
  reorderTasks: (projectId: string, tasks: Task[]) => void;
  // One-off task subtask methods
  addOneOffSubtask: (taskId: string, title: string) => void;
  toggleOneOffSubtask: (taskId: string, subtaskId: string) => void;
  deleteOneOffSubtask: (taskId: string, subtaskId: string) => void;
  // Recurring task subtask methods
  addRecurringSubtask: (taskId: string, title: string) => void;
  toggleRecurringSubtask: (taskId: string, subtaskId: string) => void;
  deleteRecurringSubtask: (taskId: string, subtaskId: string) => void;
  // Reading list methods
  addReadingItem: (title: string, author?: string, link?: string) => void;
  updateReadingItem: (item: ReadingItem) => void;
  deleteReadingItem: (itemId: string) => void;
  updateReadingStatus: (itemId: string, status: ReadingItem['status']) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, loadState());

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  }, []);

  // Convenience methods
  const setSelectedDate = (date: string) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const setViewMode = (mode: AppState['viewMode']) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const setTheme = (theme: 'dark' | 'light') => {
    dispatch({ type: 'SET_THEME', payload: theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const toggleTheme = () => {
    const newTheme = state.theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  const addProject = (title: string, color: string) => {
    const project: Project = {
      id: generateId(),
      title,
      color,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject = (project: Project) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: project });
  };

  const deleteProject = (projectId: string) => {
    dispatch({ type: 'DELETE_PROJECT', payload: projectId });
  };

  const archiveProject = (projectId: string) => {
    dispatch({ type: 'ARCHIVE_PROJECT', payload: projectId });
  };

  const unarchiveProject = (projectId: string) => {
    dispatch({ type: 'UNARCHIVE_PROJECT', payload: projectId });
  };

  const addTask = (projectId: string, title: string) => {
    const task: Task = {
      id: generateId(),
      projectId,
      title,
      completed: false,
      scheduledDates: [], // Don't schedule by default - user picks when to work on it
      completedDates: [],
      links: [],
      subtasks: [],
    };
    dispatch({ type: 'ADD_TASK', payload: { projectId, task } });
  };

  const updateTask = (projectId: string, task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task } });
  };

  const updateTaskRecursive = (projectId: string, taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK_RECURSIVE', payload: { projectId, taskId, updates } });
  };

  const deleteTask = (projectId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { projectId, taskId } });
  };

  const deleteTaskRecursive = (projectId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK_RECURSIVE', payload: { projectId, taskId } });
  };

  const toggleTaskCompletion = (projectId: string, taskId: string, date: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    // Use recursive search to find task (including subtasks)
    const task = findTaskRecursively(project.tasks, taskId);
    if (!task) return;

    const isCompletedOnDate = task.completedDates.includes(date);

    // Use recursive update to handle nested subtasks
    dispatch({
      type: 'UPDATE_TASK_RECURSIVE',
      payload: {
        projectId,
        taskId,
        updates: {
          completedDates: isCompletedOnDate
            ? task.completedDates.filter((d) => d !== date)
            : [...task.completedDates, date],
          completed: !isCompletedOnDate,
        },
      },
    });
  };

  const scheduleTaskForDate = (projectId: string, taskId: string, date: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.scheduledDates.includes(date)) {
      const updatedTask: Task = {
        ...task,
        scheduledDates: [...task.scheduledDates, date],
      };
      dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: updatedTask } });
    }
  };

  const unscheduleTaskFromDate = (projectId: string, taskId: string, date: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = project.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      scheduledDates: task.scheduledDates.filter((d) => d !== date),
    };
    dispatch({ type: 'UPDATE_TASK', payload: { projectId, task: updatedTask } });
  };

  const reorderProjects = (projects: Project[]) => {
    dispatch({ type: 'REORDER_PROJECTS', payload: projects });
  };

  const reorderTasks = (projectId: string, tasks: Task[]) => {
    dispatch({ type: 'REORDER_TASKS', payload: { projectId, tasks } });
  };

  // Recurring task skip methods
  const skipRecurringTask = (taskId: string, date: string) => {
    dispatch({ type: 'SKIP_RECURRING_TASK', payload: { taskId, date } });
  };

  const unskipRecurringTask = (taskId: string, date: string) => {
    dispatch({ type: 'UNSKIP_RECURRING_TASK', payload: { taskId, date } });
  };

  // Subtask methods
  const addSubtask = (projectId: string, parentTaskId: string, title: string) => {
    const subtask: Task = {
      id: generateId(),
      projectId,
      parentTaskId,
      title,
      completed: false,
      scheduledDates: [],
      completedDates: [],
      links: [],
      subtasks: [],
    };
    dispatch({ type: 'ADD_SUBTASK', payload: { projectId, parentTaskId, subtask } });
  };

  // Link methods
  const addTaskLink = (projectId: string, taskId: string, title: string, url: string) => {
    const link: TaskLink = {
      id: generateId(),
      title,
      url,
    };
    dispatch({ type: 'ADD_TASK_LINK', payload: { projectId, taskId, link } });
  };

  const updateTaskLink = (projectId: string, taskId: string, link: TaskLink) => {
    dispatch({ type: 'UPDATE_TASK_LINK', payload: { projectId, taskId, link } });
  };

  const deleteTaskLink = (projectId: string, taskId: string, linkId: string) => {
    dispatch({ type: 'DELETE_TASK_LINK', payload: { projectId, taskId, linkId } });
  };

  // Quick scheduling
  const scheduleTaskToday = (projectId: string, taskId: string) => {
    dispatch({ type: 'SCHEDULE_TASK_TODAY', payload: { projectId, taskId } });
  };

  const unscheduleTaskToday = (projectId: string, taskId: string) => {
    dispatch({ type: 'UNSCHEDULE_TASK_TODAY', payload: { projectId, taskId } });
  };

  const toggleTaskScheduleToday = (projectId: string, taskId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = findTaskRecursively(project.tasks, taskId);
    if (!task) return;

    const today = getTodayISO();
    if (task.scheduledDates.includes(today)) {
      unscheduleTaskToday(projectId, taskId);
    } else {
      scheduleTaskToday(projectId, taskId);
    }
  };

  // Task counter methods
  const updateTaskCounter = (projectId: string, taskId: string, count: number) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = findTaskRecursively(project.tasks, taskId);
    if (!task || task.targetCount === undefined) return;

    const newCount = Math.max(0, Math.min(count, task.targetCount));
    dispatch({
      type: 'UPDATE_TASK_RECURSIVE',
      payload: {
        projectId,
        taskId,
        updates: { currentCount: newCount },
      },
    });
  };

  const incrementTaskCounter = (projectId: string, taskId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = findTaskRecursively(project.tasks, taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount < task.targetCount) {
      updateTaskCounter(projectId, taskId, currentCount + 1);
    }
  };

  const decrementTaskCounter = (projectId: string, taskId: string) => {
    const project = state.projects.find((p) => p.id === projectId);
    if (!project) return;

    const task = findTaskRecursively(project.tasks, taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount > 0) {
      updateTaskCounter(projectId, taskId, currentCount - 1);
    }
  };

  // Recurring task counter methods
  const updateRecurringTaskCounter = (taskId: string, count: number) => {
    const task = state.recurringTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const newCount = Math.max(0, Math.min(count, task.targetCount));
    dispatch({
      type: 'UPDATE_RECURRING_TASK',
      payload: { ...task, currentCount: newCount },
    });
  };

  const incrementRecurringTaskCounter = (taskId: string) => {
    const task = state.recurringTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount < task.targetCount) {
      updateRecurringTaskCounter(taskId, currentCount + 1);
    }
  };

  const decrementRecurringTaskCounter = (taskId: string) => {
    const task = state.recurringTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount > 0) {
      updateRecurringTaskCounter(taskId, currentCount - 1);
    }
  };

  // One-off task counter methods
  const updateOneOffTaskCounter = (taskId: string, count: number) => {
    const task = state.oneOffTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const newCount = Math.max(0, Math.min(count, task.targetCount));
    dispatch({
      type: 'UPDATE_ONE_OFF_TASK',
      payload: { ...task, currentCount: newCount },
    });
  };

  const incrementOneOffTaskCounter = (taskId: string) => {
    const task = state.oneOffTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount < task.targetCount) {
      updateOneOffTaskCounter(taskId, currentCount + 1);
    }
  };

  const decrementOneOffTaskCounter = (taskId: string) => {
    const task = state.oneOffTasks.find((t) => t.id === taskId);
    if (!task || task.targetCount === undefined) return;

    const currentCount = task.currentCount || 0;
    if (currentCount > 0) {
      updateOneOffTaskCounter(taskId, currentCount - 1);
    }
  };

  // One-off task subtask methods
  const addOneOffSubtask = (taskId: string, title: string) => {
    const subtask: Subtask = {
      id: generateId(),
      title,
      completed: false,
    };
    dispatch({ type: 'ADD_ONE_OFF_SUBTASK', payload: { taskId, subtask } });
  };

  const toggleOneOffSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_ONE_OFF_SUBTASK', payload: { taskId, subtaskId } });
  };

  const deleteOneOffSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'DELETE_ONE_OFF_SUBTASK', payload: { taskId, subtaskId } });
  };

  // Recurring task subtask methods
  const addRecurringSubtask = (taskId: string, title: string) => {
    const subtask: Subtask = {
      id: generateId(),
      title,
      completed: false,
    };
    dispatch({ type: 'ADD_RECURRING_SUBTASK', payload: { taskId, subtask } });
  };

  const toggleRecurringSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'TOGGLE_RECURRING_SUBTASK', payload: { taskId, subtaskId } });
  };

  const deleteRecurringSubtask = (taskId: string, subtaskId: string) => {
    dispatch({ type: 'DELETE_RECURRING_SUBTASK', payload: { taskId, subtaskId } });
  };

  // Reading list methods
  const addReadingItem = (title: string, author?: string, link?: string) => {
    const item: ReadingItem = {
      id: generateId(),
      title,
      author,
      link,
      status: 'want-to-read',
      addedAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_READING_ITEM', payload: item });
  };

  const updateReadingItem = (item: ReadingItem) => {
    dispatch({ type: 'UPDATE_READING_ITEM', payload: item });
  };

  const deleteReadingItem = (itemId: string) => {
    dispatch({ type: 'DELETE_READING_ITEM', payload: itemId });
  };

  const updateReadingStatus = (itemId: string, status: ReadingItem['status']) => {
    dispatch({ type: 'UPDATE_READING_STATUS', payload: { itemId, status } });
  };

  const value: AppContextType = {
    state,
    dispatch,
    setSelectedDate,
    setViewMode,
    setTheme,
    toggleTheme,
    addProject,
    updateProject,
    deleteProject,
    archiveProject,
    unarchiveProject,
    addTask,
    updateTask,
    updateTaskRecursive,
    deleteTask,
    deleteTaskRecursive,
    toggleTaskCompletion,
    scheduleTaskForDate,
    unscheduleTaskFromDate,
    addSubtask,
    addTaskLink,
    updateTaskLink,
    deleteTaskLink,
    scheduleTaskToday,
    unscheduleTaskToday,
    toggleTaskScheduleToday,
    updateTaskCounter,
    incrementTaskCounter,
    decrementTaskCounter,
    updateRecurringTaskCounter,
    incrementRecurringTaskCounter,
    decrementRecurringTaskCounter,
    updateOneOffTaskCounter,
    incrementOneOffTaskCounter,
    decrementOneOffTaskCounter,
    skipRecurringTask,
    unskipRecurringTask,
    reorderProjects,
    reorderTasks,
    addOneOffSubtask,
    toggleOneOffSubtask,
    deleteOneOffSubtask,
    addRecurringSubtask,
    toggleRecurringSubtask,
    deleteRecurringSubtask,
    addReadingItem,
    updateReadingItem,
    deleteReadingItem,
    updateReadingStatus,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Custom hook to use the context
export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
