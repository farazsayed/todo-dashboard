import { useApp } from '../context/AppContext';
import {
  getWeeklyStats,
  getMonthlyStats,
  compareWeeks,
} from '../utils/stats';
import { countAllTasks, countCompletedTasks, formatDateToLocal, getTasksForDate, getCarryoverTasks, getRecurringTasksForDate } from '../utils/storage';

export function StatsView() {
  const { state } = useApp();
  const { projects, habits, recurringTasks, oneOffTasks, selectedDate } = state;

  const weeklyStats = getWeeklyStats(projects, selectedDate);
  const monthlyStats = getMonthlyStats(projects, selectedDate);
  const weekComparison = compareWeeks(projects, selectedDate);

  // Calculate habit stats
  const habitStats = habits.map(habit => {
    const completedCount = habit.completedDates.length;
    return {
      title: habit.title,
      streak: habit.currentStreak,
      bestStreak: habit.bestStreak,
      completedCount,
    };
  });

  // Get last 7 days completion - including all task types
  const last7Days: { date: string; dayName: string; completion: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - i);
    const dateStr = formatDateToLocal(d);

    // Get all tasks for this date (same logic as MainContent)
    const scheduledTasks = getTasksForDate(projects, dateStr);
    const carryoverTasks = getCarryoverTasks(projects, dateStr);
    const recurringTasksForDate = getRecurringTasksForDate(recurringTasks, dateStr);
    const todayOneOff = oneOffTasks.filter(t => t.dueDate === dateStr);
    const habitsForDate = habits;

    // Calculate total and completed
    const totalCount = scheduledTasks.length + carryoverTasks.length + recurringTasksForDate.length + todayOneOff.length + habitsForDate.length;

    const completedCount = [
      ...scheduledTasks.filter(({ task }) => task.completedDates.includes(dateStr)),
      ...carryoverTasks.filter(({ task }) => task.completedDates.includes(dateStr)),
      ...recurringTasksForDate.filter(t => t.completedDates.includes(dateStr)),
      ...todayOneOff.filter(t => t.completed || t.completedDate === dateStr),
      ...habitsForDate.filter(h => h.completedDates.includes(dateStr)),
    ].length;

    const completion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    last7Days.push({
      date: dateStr,
      dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
      completion,
    });
  }

  // Project progress stats
  const projectStats = projects.map(project => {
    const total = countAllTasks(project.tasks);
    const completed = countCompletedTasks(project.tasks);
    return {
      title: project.title,
      color: project.color,
      total,
      completed,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  });

  const currentMonth = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-dark-text-primary mb-6">Statistics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {/* Weekly Avg */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-4">
          <div className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            Weekly Average
          </div>
          <div className="text-3xl font-bold text-dark-text-primary mb-1">
            {weeklyStats.avgCompletion}%
          </div>
          <div className={`text-[12px] flex items-center gap-1 ${
            weekComparison.direction === 'up' ? 'text-accent-green' :
            weekComparison.direction === 'down' ? 'text-red-400' : 'text-dark-text-muted'
          }`}>
            {weekComparison.direction === 'up' && '↑'}
            {weekComparison.direction === 'down' && '↓'}
            {weekComparison.difference}% vs last week
          </div>
        </div>

        {/* Monthly Tasks */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-4">
          <div className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            {currentMonth}
          </div>
          <div className="text-3xl font-bold text-dark-text-primary mb-1">
            {monthlyStats.totalCompleted}/{monthlyStats.totalTasks}
          </div>
          <div className="text-[12px] text-dark-text-muted">
            tasks completed
          </div>
        </div>

        {/* Best Day */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-4">
          <div className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            Best Day This Week
          </div>
          <div className="text-3xl font-bold text-dark-text-primary mb-1">
            {weeklyStats.bestDay}
          </div>
          <div className="text-[12px] text-dark-text-muted">
            {weeklyStats.bestCompletion}% completion
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-4">
          <div className="text-[12px] text-dark-text-muted uppercase tracking-wide mb-2">
            Active Projects
          </div>
          <div className="text-3xl font-bold text-dark-text-primary mb-1">
            {projects.length}
          </div>
          <div className="text-[12px] text-dark-text-muted">
            {recurringTasks.length} recurring tasks
          </div>
        </div>
      </div>

      {/* Last 7 Days Chart */}
      <div className="bg-dark-secondary border border-dark-border rounded-xl p-5 mb-6">
        <h2 className="text-[14px] font-semibold text-dark-text-primary mb-4">
          Last 7 Days Completion
        </h2>
        <div className="flex items-end justify-between gap-3">
          {last7Days.map(({ date, dayName, completion }) => (
            <div key={date} className="flex-1 flex flex-col items-center">
              {/* Bar container with fixed height */}
              <div className="w-full h-32 flex items-end justify-center">
                <div
                  className="w-full max-w-[40px] bg-accent-blue rounded-t transition-all"
                  style={{ height: `${Math.max(completion, 4)}%` }}
                />
              </div>
              <div className="text-[11px] text-dark-text-muted mt-2">{dayName}</div>
              <div className="text-[10px] text-dark-text-primary font-mono">{completion}%</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Progress */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-dark-text-primary mb-4">
            Project Progress
          </h2>
          {projectStats.length === 0 ? (
            <p className="text-[13px] text-dark-text-muted">No projects yet</p>
          ) : (
            <div className="space-y-4">
              {projectStats.map((project, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-[13px] text-dark-text-primary">{project.title}</span>
                    </div>
                    <span className="text-[12px] text-dark-text-muted font-mono">
                      {project.completed}/{project.total}
                    </span>
                  </div>
                  <div className="h-2 bg-dark-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habit Streaks */}
        <div className="bg-dark-secondary border border-dark-border rounded-xl p-5">
          <h2 className="text-[14px] font-semibold text-dark-text-primary mb-4">
            Habit Streaks
          </h2>
          {habitStats.length === 0 ? (
            <p className="text-[13px] text-dark-text-muted">No habits yet</p>
          ) : (
            <div className="space-y-3">
              {habitStats.map((habit, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-dark-tertiary rounded-lg"
                >
                  <span className="text-[13px] text-dark-text-primary">{habit.title}</span>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[12px] text-dark-text-muted">Current</div>
                      <div className="text-[14px] font-semibold text-streak-fire flex items-center gap-1">
                        🔥 {habit.streak}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-dark-text-muted">Best</div>
                      <div className="text-[14px] font-semibold text-accent-green">
                        {habit.bestStreak}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[12px] text-dark-text-muted">Total</div>
                      <div className="text-[14px] font-semibold text-dark-text-primary">
                        {habit.completedCount}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Summary */}
      <div className="bg-dark-secondary border border-dark-border rounded-xl p-5 mt-6">
        <h2 className="text-[14px] font-semibold text-dark-text-primary mb-4">
          This Week Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-dark-tertiary rounded-lg">
            <div className="text-2xl font-bold text-dark-text-primary">{monthlyStats.avgCompletion}%</div>
            <div className="text-[11px] text-dark-text-muted">Avg Completion</div>
          </div>
          <div className="text-center p-3 bg-dark-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent-green">{projects.reduce((sum, p) => sum + countCompletedTasks(p.tasks), 0)}</div>
            <div className="text-[11px] text-dark-text-muted">Tasks Done</div>
          </div>
          <div className="text-center p-3 bg-dark-tertiary rounded-lg">
            <div className="text-2xl font-bold text-accent-blue">{habits.filter(h => h.currentStreak > 0).length}</div>
            <div className="text-[11px] text-dark-text-muted">Active Streaks</div>
          </div>
          <div className="text-center p-3 bg-dark-tertiary rounded-lg">
            <div className="text-2xl font-bold text-purple-400">{recurringTasks.length}</div>
            <div className="text-[11px] text-dark-text-muted">Recurring Tasks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
