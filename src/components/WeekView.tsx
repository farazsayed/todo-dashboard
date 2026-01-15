import { useApp } from '../context/AppContext';
import { getTasksForDate, getRecurringTasksForDate, getTodayISO, formatDateToLocal } from '../utils/storage';

export function WeekView() {
  const {
    state,
    setSelectedDate,
    toggleTaskCompletion,
    dispatch,
    incrementTaskCounter,
    decrementTaskCounter,
    incrementRecurringTaskCounter,
    decrementRecurringTaskCounter,
    incrementOneOffTaskCounter,
    decrementOneOffTaskCounter,
  } = useApp();
  const { selectedDate, projects, recurringTasks, oneOffTasks, habits } = state;
  const today = getTodayISO();

  // Get the week containing the selected date (Monday to Sunday)
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const dayOfWeek = selectedDateObj.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(selectedDateObj);
    date.setDate(selectedDateObj.getDate() + mondayOffset + i);
    return formatDateToLocal(date);
  });

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleRecurringTask = (taskId: string, date: string) => {
    const task = recurringTasks.find(t => t.id === taskId);
    if (!task) return;

    const isCompleted = task.completedDates.includes(date);
    dispatch({
      type: 'UPDATE_RECURRING_TASK',
      payload: {
        ...task,
        completedDates: isCompleted
          ? task.completedDates.filter(d => d !== date)
          : [...task.completedDates, date]
      }
    });
  };

  const toggleHabit = (habitId: string, date: string) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const isCompleted = habit.completedDates.includes(date);
    dispatch({
      type: 'UPDATE_HABIT',
      payload: {
        ...habit,
        completedDates: isCompleted
          ? habit.completedDates.filter(d => d !== date)
          : [...habit.completedDates, date]
      }
    });
  };

  const toggleOneOffTask = (taskId: string) => {
    const task = oneOffTasks.find(t => t.id === taskId);
    if (!task) return;

    dispatch({
      type: 'UPDATE_ONE_OFF_TASK',
      payload: {
        ...task,
        completed: !task.completed,
        completedDate: !task.completed ? selectedDate : undefined
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Week Header */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((dateStr, index) => {
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          const dayNum = new Date(dateStr + 'T00:00:00').getDate();

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                isSelected
                  ? 'bg-accent-blue shadow-lg'
                  : isToday
                  ? 'bg-dark-tertiary border-2 border-accent-blue/50'
                  : 'bg-dark-secondary hover:bg-dark-tertiary'
              }`}
            >
              <span className={`text-[11px] font-semibold uppercase ${
                isSelected ? 'text-dark-primary' : isToday ? 'text-accent-blue' : 'text-dark-text-muted'
              }`}>
                {dayLabels[index]}
              </span>
              <span className={`text-[18px] font-bold ${
                isSelected ? 'text-dark-primary' : 'text-dark-text-primary'
              }`}>
                {dayNum}
              </span>
            </button>
          );
        })}
      </div>

      {/* Week Tasks Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((dateStr) => {
          const tasksForDay = getTasksForDate(projects, dateStr);
          const recurringForDay = getRecurringTasksForDate(recurringTasks, dateStr);
          const oneOffForDay = oneOffTasks.filter(t => t.dueDate === dateStr && !t.completed);
          const isFuture = dateStr > today;

          return (
            <div
              key={dateStr}
              className="min-h-[200px] bg-dark-secondary rounded-xl p-3 space-y-2"
            >
              {/* Project Tasks */}
              {tasksForDay.map(({ task, project }) => {
                const isCompleted = task.completedDates.includes(dateStr);
                const hasCounter = task.targetCount !== undefined;
                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-1 p-2 rounded-lg text-[11px] ${
                      isCompleted ? 'opacity-50' : ''
                    }`}
                    style={{ backgroundColor: `${project.color}20` }}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleTaskCompletion(project.id, task.id, dateStr)}
                        disabled={isFuture}
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      />
                      <span className={`leading-tight ${isCompleted ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'}`}>
                        {task.title}
                      </span>
                    </div>
                    {hasCounter && (
                      <div className="flex items-center gap-1 ml-5">
                        <button
                          onClick={() => decrementTaskCounter(project.id, task.id)}
                          disabled={(task.currentCount || 0) <= 0}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">−</span>
                        </button>
                        <span className="text-[9px] font-mono text-accent-green">
                          {task.currentCount || 0}/{task.targetCount}
                        </span>
                        <button
                          onClick={() => incrementTaskCounter(project.id, task.id)}
                          disabled={(task.currentCount || 0) >= (task.targetCount || 0)}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">+</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Recurring Tasks */}
              {recurringForDay.map(task => {
                const isCompleted = task.completedDates.includes(dateStr);
                const hasCounter = task.targetCount !== undefined;
                return (
                  <div
                    key={task.id}
                    className={`flex flex-col gap-1 p-2 rounded-lg text-[11px] ${
                      isCompleted ? 'opacity-50' : ''
                    }`}
                    style={{ backgroundColor: `${task.color}20` }}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        onChange={() => toggleRecurringTask(task.id, dateStr)}
                        disabled={isFuture}
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      />
                      <span className={`leading-tight flex-1 ${isCompleted ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'}`}>
                        {task.title}
                      </span>
                      <span className="text-dark-text-muted flex-shrink-0">🔄</span>
                    </div>
                    {hasCounter && (
                      <div className="flex items-center gap-1 ml-5">
                        <button
                          onClick={() => decrementRecurringTaskCounter(task.id)}
                          disabled={(task.currentCount || 0) <= 0}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">−</span>
                        </button>
                        <span className="text-[9px] font-mono text-accent-green">
                          {task.currentCount || 0}/{task.targetCount}
                        </span>
                        <button
                          onClick={() => incrementRecurringTaskCounter(task.id)}
                          disabled={(task.currentCount || 0) >= (task.targetCount || 0)}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">+</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* One-Off Tasks */}
              {oneOffForDay.map(task => {
                const hasCounter = task.targetCount !== undefined;
                return (
                  <div
                    key={task.id}
                    className="flex flex-col gap-1 p-2 rounded-lg text-[11px] bg-dark-tertiary"
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleOneOffTask(task.id)}
                        disabled={isFuture}
                        className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                      />
                      <span className={`leading-tight flex-1 ${task.completed ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'}`}>
                        {task.title}
                      </span>
                      <span className="text-dark-text-muted flex-shrink-0">⚡</span>
                    </div>
                    {hasCounter && (
                      <div className="flex items-center gap-1 ml-5">
                        <button
                          onClick={() => decrementOneOffTaskCounter(task.id)}
                          disabled={(task.currentCount || 0) <= 0}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">−</span>
                        </button>
                        <span className="text-[9px] font-mono text-accent-green">
                          {task.currentCount || 0}/{task.targetCount}
                        </span>
                        <button
                          onClick={() => incrementOneOffTaskCounter(task.id)}
                          disabled={(task.currentCount || 0) >= (task.targetCount || 0)}
                          className="w-4 h-4 flex items-center justify-center text-dark-text-muted hover:text-dark-text-primary rounded disabled:opacity-30"
                        >
                          <span className="text-[10px]">+</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Habits */}
              {habits.map(habit => {
                const isCompleted = habit.completedDates.includes(dateStr);
                return (
                  <div
                    key={habit.id}
                    className={`flex items-start gap-2 p-2 rounded-lg text-[11px] ${
                      isCompleted ? 'opacity-50' : ''
                    }`}
                    style={{ backgroundColor: `${habit.color}20` }}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleHabit(habit.id, dateStr)}
                      disabled={isFuture}
                      className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
                    />
                    <span className={`leading-tight flex-1 ${isCompleted ? 'line-through text-dark-text-muted' : 'text-dark-text-primary'}`}>
                      {habit.title}
                    </span>
                    <span className="text-dark-text-muted flex-shrink-0">✓</span>
                  </div>
                );
              })}

              {/* Empty state */}
              {tasksForDay.length === 0 && recurringForDay.length === 0 && oneOffForDay.length === 0 && habits.length === 0 && (
                <div className="text-[11px] text-dark-text-muted text-center py-4">
                  No tasks
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
