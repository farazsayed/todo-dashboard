import type { Project, RecurringTask, OneOffTask, Habit } from '../types';
import { getTasksForDate, getCarryoverTasks, getRecurringTasksForDate, formatDateToLocal } from './storage';

// Get start and end dates for a week (Sunday to Saturday)
export function getWeekBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    start: formatDateToLocal(startOfWeek),
    end: formatDateToLocal(endOfWeek),
  };
}

// Get completion percentage for a specific date
export function getCompletionForDate(projects: Project[], date: string): number {
  const tasksForDate = getTasksForDate(projects, date);
  if (tasksForDate.length === 0) return 0;

  const completed = tasksForDate.filter(({ task }) =>
    task.completedDates.includes(date)
  ).length;

  return Math.round((completed / tasksForDate.length) * 100);
}

// Calculate average completion for a date range
export function getAverageCompletion(projects: Project[], startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  let totalCompletion = 0;
  let daysWithTasks = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToLocal(d);
    const tasksForDate = getTasksForDate(projects, dateStr);

    if (tasksForDate.length > 0) {
      totalCompletion += getCompletionForDate(projects, dateStr);
      daysWithTasks++;
    }
  }

  return daysWithTasks > 0 ? Math.round(totalCompletion / daysWithTasks) : 0;
}

// Get weekly stats for current week
export function getWeeklyStats(projects: Project[], currentDate: string) {
  const { start, end } = getWeekBounds(currentDate);
  const avgCompletion = getAverageCompletion(projects, start, end);

  // Find best day of the week
  let bestDay = '';
  let bestCompletion = -1;

  for (let d = new Date(start + 'T00:00:00'); d <= new Date(end + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToLocal(d);
    const completion = getCompletionForDate(projects, dateStr);
    const tasksCount = getTasksForDate(projects, dateStr).length;

    if (tasksCount > 0 && completion > bestCompletion) {
      bestCompletion = completion;
      bestDay = d.toLocaleDateString('en-US', { weekday: 'long' });
    }
  }

  return {
    avgCompletion,
    bestDay: bestDay || 'None',
    bestCompletion,
  };
}

// Compare current week to previous week
export function compareWeeks(projects: Project[], currentDate: string): { difference: number; direction: 'up' | 'down' | 'same' } {
  const currentWeek = getWeekBounds(currentDate);

  // Get previous week bounds
  const prevWeekEnd = new Date(currentWeek.start + 'T00:00:00');
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekEnd.getDate() - 6);

  const currentAvg = getAverageCompletion(projects, currentWeek.start, currentWeek.end);
  const prevAvg = getAverageCompletion(
    projects,
    formatDateToLocal(prevWeekStart),
    formatDateToLocal(prevWeekEnd)
  );

  const difference = currentAvg - prevAvg;

  return {
    difference: Math.abs(difference),
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same',
  };
}

// Get monthly stats
export function getMonthlyStats(projects: Project[], currentDate: string) {
  const date = new Date(currentDate + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const avgCompletion = getAverageCompletion(
    projects,
    formatDateToLocal(startOfMonth),
    formatDateToLocal(endOfMonth)
  );

  // Count total tasks completed this month
  let totalCompleted = 0;
  let totalTasks = 0;

  for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToLocal(d);
    const tasksForDate = getTasksForDate(projects, dateStr);
    const completed = tasksForDate.filter(({ task }) =>
      task.completedDates.includes(dateStr)
    ).length;

    totalCompleted += completed;
    totalTasks += tasksForDate.length;
  }

  return {
    avgCompletion,
    totalCompleted,
    totalTasks,
  };
}

// Get task count for a date range
export function getTaskCountForRange(projects: Project[], startDate: string, endDate: string): { total: number; completed: number } {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  let total = 0;
  let completed = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToLocal(d);
    const tasksForDate = getTasksForDate(projects, dateStr);

    total += tasksForDate.length;
    completed += tasksForDate.filter(({ task }) =>
      task.completedDates.includes(dateStr)
    ).length;
  }

  return { total, completed };
}

// Get completion for a specific date including ALL task types
export function getAllTasksCompletionForDate(
  projects: Project[],
  recurringTasks: RecurringTask[],
  oneOffTasks: OneOffTask[],
  habits: Habit[],
  date: string
): { total: number; completed: number; percentage: number } {
  // Project tasks scheduled for this date
  const scheduledTasks = getTasksForDate(projects, date);
  const carryoverTasks = getCarryoverTasks(projects, date);

  // Recurring tasks due on this date
  const recurringForDate = getRecurringTasksForDate(recurringTasks, date);

  // One-off tasks due on this date
  const oneOffForDate = oneOffTasks.filter(t => t.dueDate === date);

  // All habits (daily habits are always "due")
  const habitsForDate = habits;

  // Calculate totals
  const total = scheduledTasks.length + carryoverTasks.length + recurringForDate.length + oneOffForDate.length + habitsForDate.length;

  // Calculate completed
  const completedScheduled = scheduledTasks.filter(({ task }) => task.completedDates.includes(date)).length;
  const completedCarryover = carryoverTasks.filter(({ task }) => task.completedDates.includes(date)).length;
  const completedRecurring = recurringForDate.filter(t => t.completedDates.includes(date)).length;
  const completedOneOff = oneOffForDate.filter(t => t.completed || t.completedDate === date).length;
  const completedHabits = habitsForDate.filter(h => h.completedDates.includes(date)).length;

  const completed = completedScheduled + completedCarryover + completedRecurring + completedOneOff + completedHabits;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { total, completed, percentage };
}

// Get comprehensive weekly stats including ALL task types
export function getComprehensiveWeeklyStats(
  projects: Project[],
  recurringTasks: RecurringTask[],
  oneOffTasks: OneOffTask[],
  habits: Habit[],
  currentDate: string
) {
  const { start, end } = getWeekBounds(currentDate);

  let totalPercentage = 0;
  let daysWithTasks = 0;
  let bestDay = '';
  let bestCompletion = -1;

  for (let d = new Date(start + 'T00:00:00'); d <= new Date(end + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const dateStr = formatDateToLocal(d);
    const { total, percentage } = getAllTasksCompletionForDate(projects, recurringTasks, oneOffTasks, habits, dateStr);

    if (total > 0) {
      totalPercentage += percentage;
      daysWithTasks++;

      if (percentage > bestCompletion) {
        bestCompletion = percentage;
        bestDay = d.toLocaleDateString('en-US', { weekday: 'long' });
      }
    }
  }

  const avgCompletion = daysWithTasks > 0 ? Math.round(totalPercentage / daysWithTasks) : 0;

  return {
    avgCompletion,
    bestDay: bestDay || 'None',
    bestCompletion: bestCompletion >= 0 ? bestCompletion : 0,
  };
}

// Compare weeks using comprehensive stats
export function compareWeeksComprehensive(
  projects: Project[],
  recurringTasks: RecurringTask[],
  oneOffTasks: OneOffTask[],
  habits: Habit[],
  currentDate: string
): { difference: number; direction: 'up' | 'down' | 'same' } {
  const currentStats = getComprehensiveWeeklyStats(projects, recurringTasks, oneOffTasks, habits, currentDate);

  // Get previous week date
  const prevWeekDate = new Date(currentDate + 'T00:00:00');
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevStats = getComprehensiveWeeklyStats(projects, recurringTasks, oneOffTasks, habits, formatDateToLocal(prevWeekDate));

  const difference = currentStats.avgCompletion - prevStats.avgCompletion;

  return {
    difference: Math.abs(difference),
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same',
  };
}
