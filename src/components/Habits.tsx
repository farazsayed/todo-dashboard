import type { Habit } from '../types';
import { useApp } from '../context/AppContext';
import { updateHabitStreaks } from '../utils/storage';

interface HabitsProps {
  onSelectHabit: (habit: Habit) => void;
  onNewHabit: () => void;
}

export function Habits({ onSelectHabit, onNewHabit }: HabitsProps) {
  const { state, dispatch } = useApp();
  const { selectedDate, habits } = state;

  const toggleCompletion = (habit: Habit) => {
    const isCompleted = habit.completedDates.includes(selectedDate);
    const updatedCompletedDates = isCompleted
      ? habit.completedDates.filter(d => d !== selectedDate)
      : [...habit.completedDates, selectedDate];

    const updatedHabit = updateHabitStreaks(
      {
        ...habit,
        completedDates: updatedCompletedDates,
      },
      selectedDate
    );

    dispatch({ type: 'UPDATE_HABIT', payload: updatedHabit });
  };

  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between w-full">
          <span>Habits</span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 normal-case font-normal">streak</span>
            <button
              onClick={onNewHabit}
              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 font-medium normal-case"
            >
              + New
            </button>
          </div>
        </h2>
      </div>

      {habits.length === 0 ? (
        <p className="text-sm text-gray-400">No habits tracked yet</p>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => {
            const isCompleted = habit.completedDates.includes(selectedDate);
            const updatedHabit = updateHabitStreaks(habit, selectedDate);

            return (
              <div key={habit.id} className="flex items-center gap-2 group">
                <input
                  type="checkbox"
                  checked={isCompleted}
                  onChange={() => toggleCompletion(habit)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: habit.color }}
                />
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm ${
                      isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                    }`}
                  >
                    {habit.title}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: habit.color }}
                    />
                    <span className="text-xs text-gray-500">
                      {habit.frequency === 'daily' ? 'Daily' : `${habit.targetCount}x/week`}
                    </span>
                  </div>
                </div>

                {/* Streak display */}
                <div className="flex items-center gap-1">
                  {updatedHabit.currentStreak > 0 && (
                    <span className="text-sm font-medium text-orange-500">
                      🔥 {updatedHabit.currentStreak}
                    </span>
                  )}
                  {updatedHabit.currentStreak === 0 && updatedHabit.bestStreak > 0 && (
                    <span className="text-xs text-gray-400">
                      Best: {updatedHabit.bestStreak}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => onSelectHabit(habit)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
                  title="Edit habit"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
