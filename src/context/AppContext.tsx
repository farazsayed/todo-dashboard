import { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AppState, Goal, Task, RecurringTask, OneOffTask, Habit, TaskLink } from '../types';
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
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_TASK'; payload: { goalId: string; task: Task } }
  | { type: 'UPDATE_TASK'; payload: { goalId: string; task: Task } }
  | { type: 'UPDATE_TASK_RECURSIVE'; payload: { goalId: string; taskId: string; updates: Partial<Task> } }
  | { type: 'DELETE_TASK'; payload: { goalId: string; taskId: string } }
  | { type: 'DELETE_TASK_RECURSIVE'; payload: { goalId: string; taskId: string } }
  | { type: 'ADD_SUBTASK'; payload: { goalId: string; parentTaskId: string; subtask: Task } }
  | { type: 'ADD_TASK_LINK'; payload: { goalId: string; taskId: string; link: TaskLink } }
  | { type: 'UPDATE_TASK_LINK'; payload: { goalId: string; taskId: string; link: TaskLink } }
  | { type: 'DELETE_TASK_LINK'; payload: { goalId: string; taskId: string; linkId: string } }
  | { type: 'SCHEDULE_TASK_TODAY'; payload: { goalId: string; taskId: string } }
  | { type: 'UNSCHEDULE_TASK_TODAY'; payload: { goalId: string; taskId: string } }
  | { type: 'ADD_RECURRING_TASK'; payload: RecurringTask }
  | { type: 'UPDATE_RECURRING_TASK'; payload: RecurringTask }
  | { type: 'DELETE_RECURRING_TASK'; payload: string }
  | { type: 'ADD_ONE_OFF_TASK'; payload: OneOffTask }
  | { type: 'UPDATE_ONE_OFF_TASK'; payload: OneOffTask }
  | { type: 'DELETE_ONE_OFF_TASK'; payload: string }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'REORDER_GOALS'; payload: Goal[] }
  | { type: 'REORDER_TASKS'; payload: { goalId: string; tasks: Task[] } };

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_STATE':
      return action.payload;

    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };

    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };

    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] };

    case 'UPDATE_GOAL':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.id ? action.payload : g
        ),
      };

    case 'DELETE_GOAL':
      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== action.payload),
      };

    case 'ADD_TASK':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: [...g.tasks, action.payload.task] }
            : g
        ),
      };

    case 'UPDATE_TASK':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? {
                ...g,
                tasks: g.tasks.map((t) =>
                  t.id === action.payload.task.id ? action.payload.task : t
                ),
              }
            : g
        ),
      };

    case 'DELETE_TASK':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: g.tasks.filter((t) => t.id !== action.payload.taskId) }
            : g
        ),
      };

    case 'UPDATE_TASK_RECURSIVE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: updateTaskRecursively(g.tasks, action.payload.taskId, action.payload.updates) }
            : g
        ),
      };

    case 'DELETE_TASK_RECURSIVE':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: deleteTaskRecursively(g.tasks, action.payload.taskId) }
            : g
        ),
      };

    case 'ADD_SUBTASK':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: addSubtaskToTask(g.tasks, action.payload.parentTaskId, action.payload.subtask) }
            : g
        ),
      };

    case 'ADD_TASK_LINK': {
      const { goalId, taskId, link } = action.payload;
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const task = findTaskRecursively(g.tasks, taskId);
          if (!task) return g;
          return {
            ...g,
            tasks: updateTaskRecursively(g.tasks, taskId, {
              links: [...(task.links || []), link],
            }),
          };
        }),
      };
    }

    case 'UPDATE_TASK_LINK': {
      const { goalId, taskId, link } = action.payload;
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const task = findTaskRecursively(g.tasks, taskId);
          if (!task) return g;
          return {
            ...g,
            tasks: updateTaskRecursively(g.tasks, taskId, {
              links: (task.links || []).map((l) => (l.id === link.id ? link : l)),
            }),
          };
        }),
      };
    }

    case 'DELETE_TASK_LINK': {
      const { goalId, taskId, linkId } = action.payload;
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const task = findTaskRecursively(g.tasks, taskId);
          if (!task) return g;
          return {
            ...g,
            tasks: updateTaskRecursively(g.tasks, taskId, {
              links: (task.links || []).filter((l) => l.id !== linkId),
            }),
          };
        }),
      };
    }

    case 'SCHEDULE_TASK_TODAY': {
      const { goalId, taskId } = action.payload;
      const today = getTodayISO();
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const task = findTaskRecursively(g.tasks, taskId);
          if (!task || task.scheduledDates.includes(today)) return g;
          return {
            ...g,
            tasks: updateTaskRecursively(g.tasks, taskId, {
              scheduledDates: [...task.scheduledDates, today],
            }),
          };
        }),
      };
    }

    case 'UNSCHEDULE_TASK_TODAY': {
      const { goalId, taskId } = action.payload;
      const today = getTodayISO();
      return {
        ...state,
        goals: state.goals.map((g) => {
          if (g.id !== goalId) return g;
          const task = findTaskRecursively(g.tasks, taskId);
          if (!task) return g;
          return {
            ...g,
            tasks: updateTaskRecursively(g.tasks, taskId, {
              scheduledDates: task.scheduledDates.filter((d) => d !== today),
            }),
          };
        }),
      };
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

    case 'REORDER_GOALS':
      return { ...state, goals: action.payload };

    case 'REORDER_TASKS':
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.payload.goalId
            ? { ...g, tasks: action.payload.tasks }
            : g
        ),
      };

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
  addGoal: (title: string, color: string) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (goalId: string) => void;
  addTask: (goalId: string, title: string) => void;
  updateTask: (goalId: string, task: Task) => void;
  updateTaskRecursive: (goalId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (goalId: string, taskId: string) => void;
  deleteTaskRecursive: (goalId: string, taskId: string) => void;
  toggleTaskCompletion: (goalId: string, taskId: string, date: string) => void;
  scheduleTaskForDate: (goalId: string, taskId: string, date: string) => void;
  unscheduleTaskFromDate: (goalId: string, taskId: string, date: string) => void;
  // Subtask methods
  addSubtask: (goalId: string, parentTaskId: string, title: string) => void;
  // Link methods
  addTaskLink: (goalId: string, taskId: string, title: string, url: string) => void;
  updateTaskLink: (goalId: string, taskId: string, link: TaskLink) => void;
  deleteTaskLink: (goalId: string, taskId: string, linkId: string) => void;
  // Quick scheduling
  scheduleTaskToday: (goalId: string, taskId: string) => void;
  unscheduleTaskToday: (goalId: string, taskId: string) => void;
  toggleTaskScheduleToday: (goalId: string, taskId: string) => void;
  reorderGoals: (goals: Goal[]) => void;
  reorderTasks: (goalId: string, tasks: Task[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider component
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, loadState());

  // Save to localStorage whenever state changes
  useEffect(() => {
    saveState(state);
  }, [state]);

  // Convenience methods
  const setSelectedDate = (date: string) => {
    dispatch({ type: 'SET_SELECTED_DATE', payload: date });
  };

  const setViewMode = (mode: AppState['viewMode']) => {
    dispatch({ type: 'SET_VIEW_MODE', payload: mode });
  };

  const addGoal = (title: string, color: string) => {
    const goal: Goal = {
      id: generateId(),
      title,
      color,
      tasks: [],
      createdAt: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_GOAL', payload: goal });
  };

  const updateGoal = (goal: Goal) => {
    dispatch({ type: 'UPDATE_GOAL', payload: goal });
  };

  const deleteGoal = (goalId: string) => {
    dispatch({ type: 'DELETE_GOAL', payload: goalId });
  };

  const addTask = (goalId: string, title: string) => {
    const task: Task = {
      id: generateId(),
      goalId,
      title,
      completed: false,
      scheduledDates: [], // Don't schedule by default - user picks when to work on it
      completedDates: [],
      links: [],
      subtasks: [],
    };
    dispatch({ type: 'ADD_TASK', payload: { goalId, task } });
  };

  const updateTask = (goalId: string, task: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: { goalId, task } });
  };

  const updateTaskRecursive = (goalId: string, taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK_RECURSIVE', payload: { goalId, taskId, updates } });
  };

  const deleteTask = (goalId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK', payload: { goalId, taskId } });
  };

  const deleteTaskRecursive = (goalId: string, taskId: string) => {
    dispatch({ type: 'DELETE_TASK_RECURSIVE', payload: { goalId, taskId } });
  };

  const toggleTaskCompletion = (goalId: string, taskId: string, date: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;

    const task = goal.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const isCompletedOnDate = task.completedDates.includes(date);
    const updatedTask: Task = {
      ...task,
      completedDates: isCompletedOnDate
        ? task.completedDates.filter((d) => d !== date)
        : [...task.completedDates, date],
      completed: !isCompletedOnDate,
    };

    dispatch({ type: 'UPDATE_TASK', payload: { goalId, task: updatedTask } });
  };

  const scheduleTaskForDate = (goalId: string, taskId: string, date: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;

    const task = goal.tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (!task.scheduledDates.includes(date)) {
      const updatedTask: Task = {
        ...task,
        scheduledDates: [...task.scheduledDates, date],
      };
      dispatch({ type: 'UPDATE_TASK', payload: { goalId, task: updatedTask } });
    }
  };

  const unscheduleTaskFromDate = (goalId: string, taskId: string, date: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;

    const task = goal.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedTask: Task = {
      ...task,
      scheduledDates: task.scheduledDates.filter((d) => d !== date),
    };
    dispatch({ type: 'UPDATE_TASK', payload: { goalId, task: updatedTask } });
  };

  const reorderGoals = (goals: Goal[]) => {
    dispatch({ type: 'REORDER_GOALS', payload: goals });
  };

  const reorderTasks = (goalId: string, tasks: Task[]) => {
    dispatch({ type: 'REORDER_TASKS', payload: { goalId, tasks } });
  };

  // Subtask methods
  const addSubtask = (goalId: string, parentTaskId: string, title: string) => {
    const subtask: Task = {
      id: generateId(),
      goalId,
      parentTaskId,
      title,
      completed: false,
      scheduledDates: [],
      completedDates: [],
      links: [],
      subtasks: [],
    };
    dispatch({ type: 'ADD_SUBTASK', payload: { goalId, parentTaskId, subtask } });
  };

  // Link methods
  const addTaskLink = (goalId: string, taskId: string, title: string, url: string) => {
    const link: TaskLink = {
      id: generateId(),
      title,
      url,
    };
    dispatch({ type: 'ADD_TASK_LINK', payload: { goalId, taskId, link } });
  };

  const updateTaskLink = (goalId: string, taskId: string, link: TaskLink) => {
    dispatch({ type: 'UPDATE_TASK_LINK', payload: { goalId, taskId, link } });
  };

  const deleteTaskLink = (goalId: string, taskId: string, linkId: string) => {
    dispatch({ type: 'DELETE_TASK_LINK', payload: { goalId, taskId, linkId } });
  };

  // Quick scheduling
  const scheduleTaskToday = (goalId: string, taskId: string) => {
    dispatch({ type: 'SCHEDULE_TASK_TODAY', payload: { goalId, taskId } });
  };

  const unscheduleTaskToday = (goalId: string, taskId: string) => {
    dispatch({ type: 'UNSCHEDULE_TASK_TODAY', payload: { goalId, taskId } });
  };

  const toggleTaskScheduleToday = (goalId: string, taskId: string) => {
    const goal = state.goals.find((g) => g.id === goalId);
    if (!goal) return;

    const task = findTaskRecursively(goal.tasks, taskId);
    if (!task) return;

    const today = getTodayISO();
    if (task.scheduledDates.includes(today)) {
      unscheduleTaskToday(goalId, taskId);
    } else {
      scheduleTaskToday(goalId, taskId);
    }
  };

  const value: AppContextType = {
    state,
    dispatch,
    setSelectedDate,
    setViewMode,
    addGoal,
    updateGoal,
    deleteGoal,
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
    reorderGoals,
    reorderTasks,
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
