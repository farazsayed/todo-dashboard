export interface Goal {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  createdAt: string;
  notes?: string;
}

export interface Task {
  id: string;
  goalId: string;
  title: string;
  completed: boolean;
  scheduledDates: string[]; // dates this task is scheduled for (ISO date strings)
  completedDates: string[]; // dates this task was completed
  colorOverride?: string;
  quickLink?: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  color: string;
  schedule: {
    type: 'daily' | 'weekly' | 'interval';
    days?: number[]; // 0-6 for weekly (0 = Sunday)
    interval?: number; // for interval type
    startDate?: string; // when the interval counting starts
  };
  completedDates: string[];
  quickLink?: string;
}

export interface OneOffTask {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  completedDate?: string;
}

export interface Habit {
  id: string;
  title: string;
  color: string;
  frequency: 'daily' | 'weekly';
  targetCount?: number; // for weekly: X times per week
  completedDates: string[];
  currentStreak: number;
  bestStreak: number;
  quickLink?: string;
}

export interface AppState {
  goals: Goal[];
  recurringTasks: RecurringTask[];
  oneOffTasks: OneOffTask[];
  habits: Habit[];
  selectedDate: string; // ISO date string for currently viewed date
  viewMode: 'day' | 'week' | 'month' | 'stats';
}

export type TaskItem = Task | RecurringTask | OneOffTask;

// Color palette for goals and habits (matching dark theme)
export const COLORS = [
  '#4ade80', // accent-green
  '#60a5fa', // accent-blue
  '#c084fc', // accent-purple
  '#fb923c', // accent-orange
  '#f472b6', // accent-pink
  '#facc15', // accent-yellow
  '#f97316', // streak-fire
  '#22d3ee', // cyan
] as const;

export type AppColor = typeof COLORS[number];
