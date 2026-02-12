import type { AppState, Project, RecurringTask, OneOffTask, Habit, Task, TaskLink } from '../types';

const STORAGE_KEY = 'todo-dashboard-data';
const CLOUD_CONFIG_KEY = 'todo-dashboard-cloud-config';
const LAST_BACKUP_KEY = 'todo-dashboard-last-backup';
const LAST_CLOUD_TIMESTAMP_KEY = 'todo-dashboard-last-cloud-timestamp';
const GROCERY_LIST_KEY = 'groceryList';
const QUICK_LINKS_KEY = 'quickLinks';
const COLLAPSED_SECTIONS_KEY = 'sidebarCollapsedSections';

// Cloud sync configuration
export interface CloudConfig {
  apiKey: string;
  binId: string | null;
}

// Get cloud config from localStorage
export function getCloudConfig(): CloudConfig | null {
  try {
    const stored = localStorage.getItem(CLOUD_CONFIG_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

// Save cloud config to localStorage
export function saveCloudConfig(config: CloudConfig): void {
  localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
}

// Clear cloud config
export function clearCloudConfig(): void {
  localStorage.removeItem(CLOUD_CONFIG_KEY);
  localStorage.removeItem(LAST_CLOUD_TIMESTAMP_KEY);
}

// Get the last known cloud timestamp (when we last synced)
export function getLastCloudTimestamp(): string | null {
  return localStorage.getItem(LAST_CLOUD_TIMESTAMP_KEY);
}

// Save the cloud timestamp after a successful sync
export function saveLastCloudTimestamp(timestamp: string): void {
  localStorage.setItem(LAST_CLOUD_TIMESTAMP_KEY, timestamp);
}

// Check if cloud has newer data than our last sync
export async function checkCloudForConflicts(): Promise<{ hasConflict: boolean; cloudTimestamp?: string; message: string }> {
  const config = getCloudConfig();
  if (!config?.apiKey || !config.binId) {
    return { hasConflict: false, message: 'No cloud sync configured' };
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      return { hasConflict: false, message: 'Could not check cloud' };
    }

    const result = await response.json();
    const cloudData = result.record;
    const cloudTimestamp = cloudData.lastSynced;

    if (!cloudTimestamp) {
      return { hasConflict: false, message: 'No timestamp in cloud data' };
    }

    const lastKnownTimestamp = getLastCloudTimestamp();

    // If we've never synced, or cloud is newer than our last known sync
    if (lastKnownTimestamp && cloudTimestamp > lastKnownTimestamp) {
      return {
        hasConflict: true,
        cloudTimestamp,
        message: 'Cloud has newer data from another device'
      };
    }

    return { hasConflict: false, cloudTimestamp, message: 'No conflict' };
  } catch (error) {
    console.error('Conflict check failed:', error);
    return { hasConflict: false, message: 'Conflict check failed' };
  }
}

// Push data to JSONBin.io
export async function pushToCloud(): Promise<{ success: boolean; message: string }> {
  const config = getCloudConfig();
  if (!config?.apiKey) {
    return { success: false, message: 'No API key configured' };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { success: false, message: 'No data to sync' };
  }

  try {
    const appState = JSON.parse(stored);

    // Gather all data including separate localStorage items
    const groceryList = localStorage.getItem(GROCERY_LIST_KEY);
    const quickLinks = localStorage.getItem(QUICK_LINKS_KEY);
    const collapsedSections = localStorage.getItem(COLLAPSED_SECTIONS_KEY);

    const syncTimestamp = new Date().toISOString();
    const payload = {
      version: 2,
      lastSynced: syncTimestamp,
      data: appState,
      groceryList: groceryList ? JSON.parse(groceryList) : [],
      quickLinks: quickLinks ? JSON.parse(quickLinks) : [],
      collapsedSections: collapsedSections ? JSON.parse(collapsedSections) : [],
    };

    if (config.binId) {
      // Update existing bin
      const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update bin');
      }

      localStorage.setItem(LAST_BACKUP_KEY, syncTimestamp);
      saveLastCloudTimestamp(syncTimestamp);
      return { success: true, message: 'Data synced to cloud' };
    } else {
      // Create new bin
      const response = await fetch('https://api.jsonbin.io/v3/b', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': config.apiKey,
          'X-Bin-Name': 'todo-dashboard-backup',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create bin');
      }

      const result = await response.json();
      const binId = result.metadata.id;

      // Save the bin ID for future syncs
      saveCloudConfig({ ...config, binId });
      localStorage.setItem(LAST_BACKUP_KEY, syncTimestamp);
      saveLastCloudTimestamp(syncTimestamp);

      return { success: true, message: 'Data synced to cloud (new backup created)' };
    }
  } catch (error) {
    console.error('Push to cloud failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Sync failed' };
  }
}

// Pull data from JSONBin.io
export async function pullFromCloud(): Promise<{ success: boolean; message: string; data?: AppState }> {
  const config = getCloudConfig();
  if (!config?.apiKey) {
    return { success: false, message: 'No API key configured' };
  }

  if (!config.binId) {
    return { success: false, message: 'No cloud backup found. Push data first to create a backup.' };
  }

  try {
    const response = await fetch(`https://api.jsonbin.io/v3/b/${config.binId}/latest`, {
      method: 'GET',
      headers: {
        'X-Master-Key': config.apiKey,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch from cloud');
    }

    const result = await response.json();
    const cloudData = result.record;

    // Handle both wrapped format and raw format
    const data = cloudData.data || cloudData;

    // Validate the data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid data format in cloud backup');
    }

    // Merge with default state
    const state: AppState = {
      ...getDefaultState(),
      ...data,
      selectedDate: getTodayISO(),
    };

    // Save main app state to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

    // Restore grocery list if present
    if (cloudData.groceryList) {
      localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(cloudData.groceryList));
    }

    // Restore quick links if present
    if (cloudData.quickLinks) {
      localStorage.setItem(QUICK_LINKS_KEY, JSON.stringify(cloudData.quickLinks));
    }

    // Restore collapsed sections if present
    if (cloudData.collapsedSections) {
      localStorage.setItem(COLLAPSED_SECTIONS_KEY, JSON.stringify(cloudData.collapsedSections));
    }

    // Save the cloud timestamp so we know we're in sync
    if (cloudData.lastSynced) {
      saveLastCloudTimestamp(cloudData.lastSynced);
    }

    return { success: true, message: 'Data restored from cloud', data: state };
  } catch (error) {
    console.error('Pull from cloud failed:', error);
    return { success: false, message: error instanceof Error ? error.message : 'Sync failed' };
  }
}

// Get last backup time
export function getLastBackupTime(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

// Check if auto-backup is due (12 hours)
export function isAutoBackupDue(): boolean {
  const lastBackup = getLastBackupTime();
  if (!lastBackup) return true;

  const lastBackupDate = new Date(lastBackup);
  const now = new Date();
  const hoursSinceBackup = (now.getTime() - lastBackupDate.getTime()) / (1000 * 60 * 60);

  return hoursSinceBackup >= 12;
}

// Perform auto-backup if due and configured
export async function performAutoBackupIfDue(): Promise<void> {
  const config = getCloudConfig();
  if (!config?.apiKey) return;

  if (isAutoBackupDue()) {
    console.log('Auto-backup: Starting...');
    const result = await pushToCloud();
    console.log('Auto-backup:', result.message);
  }
}

// Format a Date object to local YYYY-MM-DD string
// This avoids timezone issues with toISOString() which returns UTC
export function formatDateToLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Get today's date as ISO string (YYYY-MM-DD) in local timezone
export function getTodayISO(): string {
  return formatDateToLocal(new Date());
}

// Get date offset by days in local timezone
export function getDateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return formatDateToLocal(date);
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

  const projects: Project[] = [
    {
      id: 'project-1',
      title: 'Learn TypeScript',
      color: '#60a5fa',
      createdAt: twoDaysAgo,
      notes: 'Focus on advanced types and generics. This is a multi-week learning project to become proficient in TypeScript for better code quality.',
      tasks: [
        {
          id: 'task-1-1',
          projectId: 'project-1',
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
              projectId: 'project-1',
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
              projectId: 'project-1',
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
              projectId: 'project-1',
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
          projectId: 'project-1',
          title: 'Build a sample project',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-1-2-1',
              projectId: 'project-1',
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
              projectId: 'project-1',
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
      id: 'project-2',
      title: 'Fitness Goals',
      color: '#4ade80',
      createdAt: twoDaysAgo,
      notes: 'Aim for 3x week minimum. Track progress and adjust as needed.',
      tasks: [
        {
          id: 'task-2-1',
          projectId: 'project-2',
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
          projectId: 'project-2',
          title: 'Strength training',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-2-2-1',
              projectId: 'project-2',
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
              projectId: 'project-2',
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
          projectId: 'project-2',
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
      id: 'project-3',
      title: 'Home Organization',
      color: '#c084fc',
      createdAt: yesterday,
      notes: 'Spring cleaning project - tackle one room at a time.',
      tasks: [
        {
          id: 'task-3-1',
          projectId: 'project-3',
          title: 'Clean garage',
          completed: false,
          scheduledDates: [],
          completedDates: [],
          links: [],
          subtasks: [
            {
              id: 'task-3-1-1',
              projectId: 'project-3',
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
              projectId: 'project-3',
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
          projectId: 'project-3',
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
      skippedDates: [],
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
      skippedDates: [],
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
      skippedDates: [],
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
    projects,
    archivedProjects: [],
    recurringTasks,
    oneOffTasks,
    habits,
    readingList: [],
    selectedDate: today,
    viewMode: 'day',
    theme: 'dark',
  };
}

// Get default empty state
export function getDefaultState(): AppState {
  return {
    projects: [],
    archivedProjects: [],
    recurringTasks: [],
    oneOffTasks: [],
    habits: [],
    readingList: [],
    selectedDate: getTodayISO(),
    viewMode: 'day',
    theme: 'dark',
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
    // Migrate projects to new format (add links, subtasks if missing)
    // Support both old 'goals' key and new 'projects' key for backward compatibility
    const rawProjects = parsed.projects || parsed.goals || [];
    const migratedProjects = migrateProjects(rawProjects);
    const archivedProjects = parsed.archivedProjects || parsed.archivedGoals || [];
    // Ensure selectedDate is always today when loading fresh
    const state: AppState = {
      ...getDefaultState(),
      ...parsed,
      projects: migratedProjects,
      archivedProjects: archivedProjects,
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

// Clear all data and start fresh
export function clearAllData(): AppState {
  localStorage.removeItem(STORAGE_KEY);
  const emptyState = getDefaultState();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(emptyState));
  return emptyState;
}

// Export data to a JSON file for backup
export function exportData(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      alert('No data to export');
      return;
    }

    const data = JSON.parse(stored);
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data: data,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `todo-dashboard-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    alert('Failed to export data. Please try again.');
  }
}

// Import data from a JSON backup file
export function importData(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Handle both wrapped format (with version/exportedAt) and raw format
        const data = parsed.data || parsed;

        // Validate the data has expected structure
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid backup file format');
        }

        // Check for required fields (at least one should exist)
        const hasValidStructure =
          Array.isArray(data.projects) ||
          Array.isArray(data.recurringTasks) ||
          Array.isArray(data.oneOffTasks) ||
          Array.isArray(data.habits);

        if (!hasValidStructure) {
          throw new Error('Backup file does not contain valid todo data');
        }

        // Merge with default state to ensure all fields exist
        const state: AppState = {
          ...getDefaultState(),
          ...data,
          selectedDate: getTodayISO(), // Always use today's date
        };

        // Save to localStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));

        resolve(state);
      } catch (error) {
        console.error('Failed to import data:', error);
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

// Generate a unique ID
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// Helper to create a new Project
export function createProject(title: string, color: string): Project {
  return {
    id: generateId(),
    title,
    color,
    tasks: [],
    createdAt: new Date().toISOString(),
  };
}

// Alias for backward compatibility
export const createGoal = createProject;

// Helper to create a new Task
export function createTask(projectId: string, title: string, parentTaskId?: string): Task {
  return {
    id: generateId(),
    projectId,
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
export function createSubtask(projectId: string, parentTaskId: string, title: string): Task {
  return createTask(projectId, title, parentTaskId);
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
    skippedDates: [],
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

// Get all tasks scheduled for a specific date (including subtasks)
export function getTasksForDate(projects: Project[], date: string) {
  const tasks: Array<{ task: Task; project: Project }> = [];

  // Helper function to recursively find scheduled tasks
  const collectScheduledTasks = (taskList: Task[], project: Project) => {
    taskList.forEach(task => {
      if (task.scheduledDates.includes(date)) {
        tasks.push({ task, project });
      }
      // Check subtasks recursively
      if (task.subtasks && task.subtasks.length > 0) {
        collectScheduledTasks(task.subtasks, project);
      }
    });
  };

  projects.forEach(project => {
    collectScheduledTasks(project.tasks, project);
  });

  return tasks;
}

// Get carryover tasks (tasks scheduled for dates before today that weren't completed)
export function getCarryoverTasks(projects: Project[], currentDate: string) {
  const carryoverTasks: Array<{ task: Task; project: Project; originalDate: string }> = [];
  const today = currentDate;

  // Helper function to recursively find carryover tasks
  const collectCarryoverTasks = (taskList: Task[], project: Project) => {
    taskList.forEach(task => {
      // Find dates before today where task was scheduled but not completed
      task.scheduledDates.forEach(scheduledDate => {
        if (scheduledDate < today && !task.completedDates.includes(scheduledDate)) {
          // Only add if not already scheduled for today
          if (!task.scheduledDates.includes(today)) {
            carryoverTasks.push({ task, project, originalDate: scheduledDate });
          }
        }
      });
      // Check subtasks recursively
      if (task.subtasks && task.subtasks.length > 0) {
        collectCarryoverTasks(task.subtasks, project);
      }
    });
  };

  projects.forEach(project => {
    collectCarryoverTasks(project.tasks, project);
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

  // Check if this date was skipped
  if (task.skippedDates?.includes(dateStr)) return false;

  const dayOfWeek = date.getDay();

  if (task.schedule.type === 'daily') {
    return true;
  }

  if (task.schedule.type === 'weekdays') {
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Mon-Fri
  }

  if (task.schedule.type === 'weekends') {
    return dayOfWeek === 0 || dayOfWeek === 6; // Sat-Sun
  }

  if (task.schedule.type === 'weekly') {
    return task.schedule.days?.includes(dayOfWeek) || false;
  }

  if (task.schedule.type === 'interval') {
    const interval = task.schedule.interval || 1;
    const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff % interval === 0;
  }

  if (task.schedule.type === 'monthly') {
    const dayOfMonth = date.getDate();

    // Simple day of month (e.g., "15th of every month")
    if (task.schedule.monthDay) {
      return dayOfMonth === task.schedule.monthDay;
    }

    // Specific weekday of specific week (e.g., "first Monday")
    if (task.schedule.monthWeek !== undefined && task.schedule.monthWeekday !== undefined) {
      if (dayOfWeek !== task.schedule.monthWeekday) return false;

      const weekOfMonth = Math.ceil(dayOfMonth / 7);
      if (task.schedule.monthWeek === -1) {
        // Last occurrence of weekday in month
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const remainingDays = lastDayOfMonth - dayOfMonth;
        return remainingDays < 7;
      }
      return weekOfMonth === task.schedule.monthWeek;
    }
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
  const today = formatDateToLocal(reference);
  const yesterday = new Date(reference);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = formatDateToLocal(yesterday);

  if (!sortedDates.includes(today) && !sortedDates.includes(yesterdayStr)) {
    return 0; // Streak broken
  }

  // Count backwards from today
  for (let i = 0; i < sortedDates.length; i++) {
    const checkDate = formatDateToLocal(currentDate);

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

// Migrate projects to new format
export function migrateProjects(projects: Project[]): Project[] {
  return projects.map(project => ({
    ...project,
    tasks: project.tasks.map(migrateTask),
  }));
}

// Alias for backward compatibility
export const migrateGoals = migrateProjects;

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

// Find a task in projects
export function findTaskInProjects(projects: Project[], taskId: string): { task: Task; project: Project } | null {
  for (const project of projects) {
    const task = findTaskRecursively(project.tasks, taskId);
    if (task) {
      return { task, project };
    }
  }
  return null;
}

// Alias for backward compatibility
export const findTaskInGoals = findTaskInProjects;

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
export function getAllTasksForDate(projects: Project[], date: string): Array<{ task: Task; project: Project; depth: number }> {
  const result: Array<{ task: Task; project: Project; depth: number }> = [];

  function collectTasks(tasks: Task[], project: Project, depth: number) {
    for (const task of tasks) {
      if (task.scheduledDates.includes(date)) {
        result.push({ task, project, depth });
      }
      collectTasks(task.subtasks || [], project, depth + 1);
    }
  }

  for (const project of projects) {
    collectTasks(project.tasks, project, 0);
  }

  return result;
}
