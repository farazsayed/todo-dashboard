import type { Goal } from '../types';
import { getTasksForDate } from './storage';

// Get start and end dates for a week (Sunday to Saturday)
export function getWeekBounds(dateStr: string): { start: string; end: string } {
  const date = new Date(dateStr + 'T00:00:00');
  const dayOfWeek = date.getDay();

  const startOfWeek = new Date(date);
  startOfWeek.setDate(date.getDate() - dayOfWeek);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);

  return {
    start: startOfWeek.toISOString().split('T')[0],
    end: endOfWeek.toISOString().split('T')[0],
  };
}

// Get completion percentage for a specific date
export function getCompletionForDate(goals: Goal[], date: string): number {
  const tasksForDate = getTasksForDate(goals, date);
  if (tasksForDate.length === 0) return 0;

  const completed = tasksForDate.filter(({ task }) =>
    task.completedDates.includes(date)
  ).length;

  return Math.round((completed / tasksForDate.length) * 100);
}

// Calculate average completion for a date range
export function getAverageCompletion(goals: Goal[], startDate: string, endDate: string): number {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  let totalCompletion = 0;
  let daysWithTasks = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const tasksForDate = getTasksForDate(goals, dateStr);

    if (tasksForDate.length > 0) {
      totalCompletion += getCompletionForDate(goals, dateStr);
      daysWithTasks++;
    }
  }

  return daysWithTasks > 0 ? Math.round(totalCompletion / daysWithTasks) : 0;
}

// Get weekly stats for current week
export function getWeeklyStats(goals: Goal[], currentDate: string) {
  const { start, end } = getWeekBounds(currentDate);
  const avgCompletion = getAverageCompletion(goals, start, end);

  // Find best day of the week
  let bestDay = '';
  let bestCompletion = -1;

  for (let d = new Date(start + 'T00:00:00'); d <= new Date(end + 'T00:00:00'); d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const completion = getCompletionForDate(goals, dateStr);
    const tasksCount = getTasksForDate(goals, dateStr).length;

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
export function compareWeeks(goals: Goal[], currentDate: string): { difference: number; direction: 'up' | 'down' | 'same' } {
  const currentWeek = getWeekBounds(currentDate);

  // Get previous week bounds
  const prevWeekEnd = new Date(currentWeek.start + 'T00:00:00');
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);
  const prevWeekStart = new Date(prevWeekEnd);
  prevWeekStart.setDate(prevWeekEnd.getDate() - 6);

  const currentAvg = getAverageCompletion(goals, currentWeek.start, currentWeek.end);
  const prevAvg = getAverageCompletion(
    goals,
    prevWeekStart.toISOString().split('T')[0],
    prevWeekEnd.toISOString().split('T')[0]
  );

  const difference = currentAvg - prevAvg;

  return {
    difference: Math.abs(difference),
    direction: difference > 0 ? 'up' : difference < 0 ? 'down' : 'same',
  };
}

// Get monthly stats
export function getMonthlyStats(goals: Goal[], currentDate: string) {
  const date = new Date(currentDate + 'T00:00:00');
  const year = date.getFullYear();
  const month = date.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0);

  const avgCompletion = getAverageCompletion(
    goals,
    startOfMonth.toISOString().split('T')[0],
    endOfMonth.toISOString().split('T')[0]
  );

  // Count total tasks completed this month
  let totalCompleted = 0;
  let totalTasks = 0;

  for (let d = new Date(startOfMonth); d <= endOfMonth; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const tasksForDate = getTasksForDate(goals, dateStr);
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
export function getTaskCountForRange(goals: Goal[], startDate: string, endDate: string): { total: number; completed: number } {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');

  let total = 0;
  let completed = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const tasksForDate = getTasksForDate(goals, dateStr);

    total += tasksForDate.length;
    completed += tasksForDate.filter(({ task }) =>
      task.completedDates.includes(dateStr)
    ).length;
  }

  return { total, completed };
}
