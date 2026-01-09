import type { AppState, Goal, RecurringTask, OneOffTask, Habit, Task, TaskLink } from '../types';

const STORAGE_KEY = 'todo-dashboard-data';

// Get today's date as ISO string (YYYY-MM-DD)
export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

// Get date offset by days
export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
}

// Format a date for display
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Generate sample data for development
function generateSampleData(): AppState {
  const today = getTodayISO();
  const yesterday = getDateOffset(-1);
  const twoDaysAgo = getDateOffset(-2);
  const tomorrow = getDateOffset(1);

  const goals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Learn TypeScript',
      color: '#60a5fa',
      createdAt: twoDaysAgo,
      notes: 'Focus on advanced types and generics. This is a multi-week learning goal to become proficient in TypeScript for better code quality.',
      tasks: [
        {
          id: 'task-1-1',
          goalId: 'goal-1',
          title: 'Complete TypeScript handbook',
          completed: false,
          scheduledDates: [today],
          completedDates: [],
          links: [
            { id: 'link-1-1-1', title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/' },
            { id: 'link-1-1-2', title: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play' },
          ],
          subtasks: [
            {
              id: 'task-1-1-1',
              goalId: 'goal-1',
              parentTaskId: 'task-1-1',
              title: 'Read basics chapter',
              completed: true,
              scheduledDates: [yesterday],
              completedDates: [yesterday],
              links: [],
              subtasks: [],
            },
            {
              id: 'task-1-1-2',
              goalId: 'goal-1',
              parentTaskId: 'task-1-1',
              title: 'Read generics chapter',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [
                { id: 'link-1-1-2-1', title: 'Generics Deep Dive', url: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
              ],
              subtasks: [],
            },
            {
              id: 'task-1-1-3',
              goalId: 'goal-1',
              parentTaskId: 'task-1-1',
              title: 'Read advanced types',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
          ],
        },
        {
          id: 'task-1-2',
          goalId: 'goal-1',
          title: 'Build a sample project',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-1-2-1',
              goalId: 'goal-1',
              parentTaskId: 'task-1-2',
              title: 'Set up project structure',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
            {
              id: 'task-1-2-2',
              goalId: 'goal-1',
              parentTaskId: 'task-1-2',
              title: 'Implement core features',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
          ],
        },
      ],
    },
    {
      id: 'goal-2',
      title: 'Fitness Goals',
      color: '#4ade80',
      createdAt: twoDaysAgo,
      notes: 'Aim for 3x week minimum. Track progress and adjust as needed.',
      tasks: [
        {
          id: 'task-2-1',
          goalId: 'goal-2',
          title: 'Morning run - 5km',
          completed: false,
          scheduledDates: [today],
          completedDates: [],
          links: [
            { id: 'link-2-1-1', title: 'Running Route', url: 'https://www.strava.com' },
          ],
          subtasks: [],
        },
        {
          id: 'task-2-2',
          goalId: 'goal-2',
          title: 'Strength training',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-2-2-1',
              goalId: 'goal-2',
              parentTaskId: 'task-2-2',
              title: 'Upper body workout',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
            {
              id: 'task-2-2-2',
              goalId: 'goal-2',
              parentTaskId: 'task-2-2',
              title: 'Lower body workout',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
          ],
        },
        {
          id: 'task-2-3',
          goalId: 'goal-2',
          title: 'Yoga session',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [
            { id: 'link-2-3-1', title: 'Yoga with Adriene', url: 'https://www.youtube.com/@yogawithadriene' },
          ],
          subtasks: [],
        },
      ],
    },
    {
      id: 'goal-3',
      title: 'Home Organization',
      color: '#c084fc',
      createdAt: yesterday,
      notes: 'Spring cleaning project - tackle one room at a time.',
      tasks: [
        {
          id: 'task-3-1',
          goalId: 'goal-3',
          title: 'Clean garage',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-3-1-1',
              goalId: 'goal-3',
              parentTaskId: 'task-3-1',
              title: 'Sort items into keep/donate/trash',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
            {
              id: 'task-3-1-2',
              goalId: 'goal-3',
              parentTaskId: 'task-3-1',
              title: 'Organize tools',
              completed: false,
              scheduledDates: [],
              completedDates: [],
              links: [],
              subtasks: [],
            },
          ],
        },
        {
          id: 'task-3-2',
          goalId: 'goal-3',
          title: 'Organize closet',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [],
        },
      ],
    },
  ];

  const recurringTasks: RecurringTask[] = [
    {
      id: 'recurring-1',
      title: 'Daily standup meeting',
      color: '#fb923c',
      schedule: {
        type: 'daily',
        startDate: twoDaysAgo,
      },
      completedDates: [yesterday],
      quickLink: 'https://zoom.us/j/example',
    },
    {
      id: 'recurring-2',
      title: 'Weekly review',
      color: '#f472b6',
      schedule: {
        type: 'weekly',
        days: [5], // Friday
        startDate: twoDaysAgo,
      },
      completedDates: [],
    },
    {
      id: 'recurring-3',
      title: 'Water plants',
      color: '#4ade80',
      schedule: {
        type: 'interval',
        interval: 3,
        startDate: twoDaysAgo,
      },
      completedDates: [],
    },
  ];

  const oneOffTasks: OneOffTask[] = [
    {
      id: 'oneoff-1',
      title: 'Call dentist for appointment',
      dueDate: today,
      completed: false,
    },
    {
      id: 'oneoff-2',
      title: 'Buy groceries',
      dueDate: today,
      completed: false,
    },
    {
      id: 'oneoff-3',
      title: 'Submit expense report',
      dueDate: yesterday,
      completed: false,
    },
    {
      id: 'oneoff-4',
      title: 'Research vacation destinations',
      dueDate: tomorrow,
      completed: false,
    },
  ];

  const habits: Habit[] = [
    {
      id: 'habit-1',
      title: 'Meditate',
      color: '#22d3ee',
      frequency: 'daily',
      completedDates: [yesterday, twoDaysAgo],
      currentStreak: 2,
      bestStreak: 5,
      quickLink: 'https://www.headspace.com',
    },
    {
      id: 'habit-2',
      title: 'Read for 30 minutes',
      color: '#facc15',
      frequency: 'daily',
      completedDates: [yesterday],
      currentStreak: 1,
      bestStreak: 7,
    },
    {
      id: 'habit-3',
      title: 'Exercise',
      color: '#4ade80',
      frequency: 'weekly',
      targetCount: 4,
      completedDates: [yesterday, twoDaysAgo],
      currentStreak: 2,
      bestStreak: 4,
    },
  ];

  return {
    goals,
    recurringTasks,
    oneOffTasks,
    habits,
    selectedDate: today,
    viewMode: 'day',
  };
}

// Get default empty state
export function getDefaultState(): AppState {
  return {
    goals: [],
    recurringTasks: [],
    oneOffTasks: [],
    habits: [],
    selectedDate: getTodayISO(),
    viewMode: 'day',
  };
}

// Load state from localStorage
export function loadState(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Return sample data for development
      const sampleData = generateSampleData();
      // Save it so it persists
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleData));
      return sampleData;
    }
    const parsed = JSON.parse(stored);
    // Migrate goals to new format (add links, subtasks if missing)
    const migratedGoals = migrateGoals(parsed.goals || []);
    // Ensure selectedDate is always today when loading fresh
    const state: AppState = {
      ...getDefaultState(),
      ...parsed,
      goals: migratedGoals,
      selectedDate: getTodayISO(),
    };
    // Save migrated state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return generateSampleData();
  }
}

// Save state to localStorage
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

// Clear storage and reload with sample data
export function resetToSampleData(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  return generateSampleData();
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Helper to create a new Goal
export function createGoal(title: string, color: string): Goal {
  return {
    id: generateId(),
    title,
    color,
    tasks: [],
    createdAt: new Date().toISOString(),
  };
}

// Helper to create a new Task
export function createTask(goalId: string, title: string, parentTaskId?: string): Task {
  return {
    id: generateId(),
    goalId,
    parentTaskId,
    title,
    completed: false,
    scheduledDates: [], // Don't schedule by default - user picks when to work on it
    completedDates: [],
    links: [],
    subtasks: [],
  };
}

// Helper to create a new Subtask
export function createSubtask(goalId: string, parentTaskId: string, title: string): Task {
  return createTask(goalId, title, parentTaskId);
}

// Helper to create a new TaskLink
export function createTaskLink(title: string, url: string): TaskLink {
  return {
    id: generateId(),
    title,
    url,
  };
}

// Helper to create a new RecurringTask
export function createRecurringTask(
  title: string,
  color: string,
  schedule: RecurringTask['schedule']
): RecurringTask {
  return {
    id: generateId(),
    title,
    color,
    schedule: {
      ...schedule,
      startDate: getTodayISO(),
    },
    completedDates: [],
  };
}

// Helper to create a new OneOffTask
export function createOneOffTask(title: string, dueDate?: string): OneOffTask {
  return {
    id: generateId(),
    title,
    dueDate,
    completed: false,
  };
}

// Helper to create a new Habit
export function createHabit(
  title: string,
  color: string,
  frequency: 'daily' | 'weekly',
  targetCount?: number
): Habit {
  return {
    id: generateId(),
    title,
    color,
    frequency,
    targetCount,
    completedDates: [],
    currentStreak: 0,
    bestStreak: 0,
  };
}

// Get all tasks scheduled for a specific date
export function getTasksForDate(goals: Goal[], date: string) {
  const tasks: Array<{ task: Task; goal: Goal }> = [];

  goals.forEach(goal => {
    goal.tasks.forEach(task => {
      if (task.scheduledDates.includes(date)) {
        tasks.push({ task, goal });
      }
    });
  });

  return tasks;
}

// Get carryover tasks (tasks scheduled for dates before today that weren't completed)
export function getCarryoverTasks(goals: Goal[], currentDate: string) {
  const carryoverTasks: Array<{ task: Task; goal: Goal; originalDate: string }> = [];
  const today = currentDate;

  goals.forEach(goal => {
    goal.tasks.forEach(task => {
      // Find dates before today where task was scheduled but not completed
      task.scheduledDates.forEach(scheduledDate => {
        if (scheduledDate < today && !task.completedDates.includes(scheduledDate)) {
          // Only add if not already scheduled for today
          if (!task.scheduledDates.includes(today)) {
            carryoverTasks.push({ task, goal, originalDate: scheduledDate });
          }
        }
      });
    });
  });

  // Remove duplicates (keep most recent original date)
  const uniqueCarryovers = carryoverTasks.reduce((acc, item) => {
    const existing = acc.find(i => i.task.id === item.task.id);
    if (!existing || item.originalDate > existing.originalDate) {
      return [...acc.filter(i => i.task.id !== item.task.id), item];
    }
    return acc;
  }, [] as typeof carryoverTasks);

  return uniqueCarryovers;
}

// Format relative date (e.g., "from yesterday", "from Jan 5")
export function formatRelativeDate(dateStr: string, referenceDate: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const reference = new Date(referenceDate + 'T00:00:00');
  const diffDays = Math.floor((reference.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'from yesterday';
  if (diffDays === 2) return 'from 2 days ago';
  if (diffDays <= 7) return `from ${diffDays} days ago`;

  return `from ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

// Check if a recurring task should appear on a given date
export function isRecurringTaskDueOnDate(task: RecurringTask, dateStr: string): boolean {
  const date = new Date(dateStr + 'T00:00:00');
  const startDate = new Date((task.schedule.startDate || dateStr) + 'T00:00:00');

  // Task can't be due before it was created
  if (date < startDate) return false;

  if (task.schedule.type === 'daily') {
    return true;
  }

  if (task.schedule.type === 'weekly') {
    const dayOfWeek = date.getDay();
    return task.schedule.days?.includes(dayOfWeek) || false;
  }

  if (task.schedule.type === 'interval') {
    const interval = task.schedule.interval || 1;
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff % interval === 0;
  }

  return false;
}

// Get all recurring tasks due on a specific date
export function getRecurringTasksForDate(recurringTasks: RecurringTask[], date: string) {
  return recurringTasks.filter(task => isRecurringTaskDueOnDate(task, date));
}

// Calculate current streak for a habit
export function calculateHabitStreak(completedDates: string[], referenceDate: string): number {
  if (completedDates.length === 0) return 0;

  const sortedDates = [...completedDates].sort().reverse();
  const reference = new Date(referenceDate + 'T00:00:00');

  let streak = 0;
  let currentDate = new Date(reference);

  // Check if completed today or yesterday (streak is still active)
  const today = reference.toISOString().split('T')[0];
  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (!sortedDates.includes(today) && !sortedDates.includes(yesterdayStr)) {
    return 0; // Streak broken
  }

  // Count backwards from today
  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = currentDate.toISOString().split('T')[0];

    if (sortedDates.includes(checkDate)) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

// Update habit streaks
export function updateHabitStreaks(habit: Habit, referenceDate: string): Habit {
  const currentStreak = calculateHabitStreak(habit.completedDates, referenceDate);
  const bestStreak = Math.max(currentStreak, habit.bestStreak);

  return {
    ...habit,
    currentStreak,
    bestStreak,
  };
}

// Get days in a month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// Get start day of month (0 = Sunday)
export function getStartDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

// Migrate a task to the new format (add links, subtasks if missing)
export function migrateTask(task: Task): Task {
  const migrated: Task = {
    ...task,
    links: task.links || [],
    subtasks: (task.subtasks || []).map(migrateTask),
  };

  // Migrate quickLink to links array if exists and links is empty
  if (task.quickLink && migrated.links.length === 0) {
    migrated.links = [{
      id: generateId(),
      title: 'Quick Link',
      url: task.quickLink,
    }];
  }

  return migrated;
}

// Migrate goals to new format
export function migrateGoals(goals: Goal[]): Goal[] {
  return goals.map(goal => ({
    ...goal,
    tasks: goal.tasks.map(migrateTask),
  }));
}

// Find a task recursively in a task tree
export function findTaskRecursively(tasks: Task[], taskId: string): Task | null {
  for (const task of tasks) {
    if (task.id === taskId) {
      return task;
    }
    const found = findTaskRecursively(task.subtasks || [], taskId);
    if (found) {
      return found;
    }
  }
  return null;
}

// Find a task in goals
export function findTaskInGoals(goals: Goal[], taskId: string): { task: Task; goal: Goal } | null {
  for (const goal of goals) {
    const task = findTaskRecursively(goal.tasks, taskId);
    if (task) {
      return { task, goal };
    }
  }
  return null;
}

// Update a task recursively in a task tree
export function updateTaskRecursively(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, ...updates };
    }
    return {
      ...task,
      subtasks: updateTaskRecursively(task.subtasks || [], taskId, updates),
    };
  });
}

// Delete a task recursively from a task tree
export function deleteTaskRecursively(tasks: Task[], taskId: string): Task[] {
  return tasks
    .filter(task => task.id !== taskId)
    .map(task => ({
      ...task,
      subtasks: deleteTaskRecursively(task.subtasks || [], taskId),
    }));
}

// Add a subtask to a parent task
export function addSubtaskToTask(tasks: Task[], parentTaskId: string, subtask: Task): Task[] {
  return tasks.map(task => {
    if (task.id === parentTaskId) {
      return {
        ...task,
        subtasks: [...(task.subtasks || []), subtask],
      };
    }
    return {
      ...task,
      subtasks: addSubtaskToTask(task.subtasks || [], parentTaskId, subtask),
    };
  });
}

// Count total tasks including subtasks
export function countAllTasks(tasks: Task[]): number {
  return tasks.reduce((count, task) => {
    return count + 1 + countAllTasks(task.subtasks || []);
  }, 0);
}

// Count completed tasks including subtasks
export function countCompletedTasks(tasks: Task[]): number {
  return tasks.reduce((count, task) => {
    const thisTaskComplete = task.completed ? 1 : 0;
    return count + thisTaskComplete + countCompletedTasks(task.subtasks || []);
  }, 0);
}

// Flatten tasks with depth info for rendering
export interface FlattenedTask {
  task: Task;
  depth: number;
  hasChildren: boolean;
  parentId?: string;
}

export function flattenTasks(tasks: Task[], depth: number = 0, parentId?: string): FlattenedTask[] {
  const result: FlattenedTask[] = [];

  for (const task of tasks) {
    result.push({
      task,
      depth,
      hasChildren: (task.subtasks || []).length > 0,
      parentId,
    });

    if (task.subtasks && task.subtasks.length > 0) {
      result.push(...flattenTasks(task.subtasks, depth + 1, task.id));
    }
  }

  return result;
}

// Get all tasks scheduled for a date (including subtasks)
export function getAllTasksForDate(goals: Goal[], date: string): Array<{ task: Task; goal: Goal; depth: number }> {
  const result: Array<{ task: Task; goal: Goal; depth: number }> = [];

  function collectTasks(tasks: Task[], goal: Goal, depth: number) {
    for (const task of tasks) {
      if (task.scheduledDates.includes(date)) {
        result.push({ task, goal, depth });
      }
      collectTasks(task.subtasks || [], goal, depth + 1);
    }
  }

  for (const goal of goals) {
    collectTasks(goal.tasks, goal, 0);
  }

  return result;
}
