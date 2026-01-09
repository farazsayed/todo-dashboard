import type { AppState, Goal, RecurringTask, OneOffTask, Habit, Task } from '../types';

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
      notes: 'Focus on advanced types and generics',
      tasks: [
        {
          id: 'task-1-1',
          goalId: 'goal-1',
          title: 'Complete TypeScript handbook',
          completed: false,
          scheduledDates: [today, tomorrow],
          completedDates: [],
          quickLink: 'https://www.typescriptlang.org/docs/handbook/',
        },
        {
          id: 'task-1-2',
          goalId: 'goal-1',
          title: 'Build a sample project',
          completed: false,
          scheduledDates: [today],
          completedDates: [],
        },
        {
          id: 'task-1-3',
          goalId: 'goal-1',
          title: 'Read about generics',
          completed: true,
          scheduledDates: [yesterday],
          completedDates: [yesterday],
        },
      ],
    },
    {
      id: 'goal-2',
      title: 'Fitness Goals',
      color: '#4ade80',
      createdAt: twoDaysAgo,
      notes: 'Aim for 3x week minimum',
      tasks: [
        {
          id: 'task-2-1',
          goalId: 'goal-2',
          title: 'Morning run - 5km',
          completed: false,
          scheduledDates: [today],
          completedDates: [],
        },
        {
          id: 'task-2-2',
          goalId: 'goal-2',
          title: 'Strength training',
          completed: false,
          scheduledDates: [tomorrow],
          completedDates: [],
        },
        {
          id: 'task-2-3',
          goalId: 'goal-2',
          title: 'Yoga session',
          completed: false,
          scheduledDates: [yesterday],
          completedDates: [],
        },
      ],
    },
    {
      id: 'goal-3',
      title: 'Home Organization',
      color: '#c084fc',
      createdAt: yesterday,
      tasks: [
        {
          id: 'task-3-1',
          goalId: 'goal-3',
          title: 'Clean garage',
          completed: false,
          scheduledDates: [today],
          completedDates: [],
        },
        {
          id: 'task-3-2',
          goalId: 'goal-3',
          title: 'Organize closet',
          completed: false,
          scheduledDates: [tomorrow],
          completedDates: [],
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
    // Ensure selectedDate is always today when loading fresh
    return {
      ...getDefaultState(),
      ...parsed,
      selectedDate: getTodayISO(),
    };
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
export function createTask(goalId: string, title: string): Task {
  return {
    id: generateId(),
    goalId,
    title,
    completed: false,
    scheduledDates: [getTodayISO()], // Schedule for today by default
    completedDates: [],
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
