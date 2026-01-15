// Link resource for tasks
export interface TaskLink {
  id: string;
  title: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
  createdAt: string;
  notes?: string;
  links?: TaskLink[]; // Project-level links (not tied to specific tasks)
  archived?: boolean;
  archivedAt?: string;
}


export interface Task {
  id: string;
  projectId: string;
  parentTaskId?: string; // For subtasks - reference to parent task
  title: string;
  completed: boolean;
  scheduledDates: string[]; // dates this task is scheduled for (ISO date strings)
  completedDates: string[]; // dates this task was completed
  colorOverride?: string;
  notes?: string; // Task-level notes
  links: TaskLink[]; // Multiple resource links
  subtasks: Task[]; // Nested subtasks
  // Counter for tasks with targets (e.g., "apply for 5 jobs" -> targetCount: 5)
  targetCount?: number;
  currentCount?: number;
  // Keep quickLink for backward compatibility during migration
  quickLink?: string;
}

// Subtask for one-off and recurring tasks (simpler than project Task)
export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedDate?: string;
}

export interface RecurringTask {
  id: string;
  title: string;
  color: string;
  schedule: {
    type: 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'interval' | 'monthly';
    days?: number[]; // 0-6 for weekly (0 = Sunday)
    interval?: number; // for interval type
    startDate?: string; // when the interval counting starts
    monthDay?: number; // day of month for monthly (1-31)
    monthWeek?: number; // week of month (1-4, or -1 for last)
    monthWeekday?: number; // day of week for monthly (0-6)
  };
  completedDates: string[];
  skippedDates: string[]; // dates this task was skipped
  quickLink?: string;
  subtasks?: Subtask[]; // Subtasks for this recurring task
  // Counter for tasks with targets
  targetCount?: number;
  currentCount?: number;
}

export interface OneOffTask {
  id: string;
  title: string;
  dueDate?: string;
  completed: boolean;
  completedDate?: string;
  quickLink?: string; // Quick link for this task
  subtasks?: Subtask[]; // Subtasks for this one-off task
  // Counter for tasks with targets
  targetCount?: number;
  currentCount?: number;
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

// Reading list item for tracking books
export interface ReadingItem {
  id: string;
  title: string;
  author?: string;
  status: 'want-to-read' | 'reading' | 'completed';
  rating?: number; // 1-5 stars
  notes?: string;
  link?: string; // Link to book (Amazon, Goodreads, etc.)
  addedAt: string;
  completedAt?: string;
}

export interface AppState {
  projects: Project[];
  archivedProjects: Project[];
  recurringTasks: RecurringTask[];
  oneOffTasks: OneOffTask[];
  habits: Habit[];
  readingList: ReadingItem[];
  selectedDate: string; // ISO date string for currently viewed date
  viewMode: 'day' | 'week' | 'month' | 'stats';
  theme: 'dark' | 'light';
}

export type TaskItem = Task | RecurringTask | OneOffTask;

// Color palette for projects and habits (matching dark theme)
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
