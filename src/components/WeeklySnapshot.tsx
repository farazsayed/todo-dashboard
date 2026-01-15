import { useApp } from '../context/AppContext';
import { getWeeklyStats, compareWeeks } from '../utils/stats';

export function WeeklySnapshot() {
  const { state } = useApp();
  const { projects, selectedDate } = state;

  const weeklyStats = getWeeklyStats(projects, selectedDate);
  const comparison = compareWeeks(projects, selectedDate);

  return (
    <div className="p-4 flex-1 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        Weekly Snapshot
      </h2>

      <div className="space-y-3 text-sm">
        {/* Average completion */}
        <div>
          <span className="text-gray-500">Avg completion:</span>
          <span className="ml-2 font-semibold text-gray-900">
            {weeklyStats.avgCompletion}%
          </span>
        </div>

        {/* Comparison to last week */}
        <div>
          <span className="text-gray-500">vs last week:</span>
          <span className={`ml-2 font-semibold ${
            comparison.direction === 'up' ? 'text-green-600' :
            comparison.direction === 'down' ? 'text-red-600' :
            'text-gray-600'
          }`}>
            {comparison.direction === 'up' && '↑ '}
            {comparison.direction === 'down' && '↓ '}
            {comparison.direction === 'same' && '→ '}
            {comparison.difference}%
          </span>
        </div>

        {/* Best day */}
        <div>
          <span className="text-gray-500">Best day:</span>
          <span className="ml-2 font-semibold text-gray-900">
            {weeklyStats.bestDay}
          </span>
          {weeklyStats.bestCompletion >= 0 && (
            <span className="ml-1 text-xs text-gray-500">
              ({weeklyStats.bestCompletion}%)
            </span>
          )}
        </div>

        {/* Motivational message */}
        {weeklyStats.avgCompletion >= 80 && (
          <div className="mt-4 p-2 bg-green-50 border border-green-200 rounded text-xs text-green-700">
            🎉 Excellent week! Keep it up!
          </div>
        )}
        {weeklyStats.avgCompletion >= 50 && weeklyStats.avgCompletion < 80 && (
          <div className="mt-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
            💪 Good progress! You're on track.
          </div>
        )}
        {weeklyStats.avgCompletion > 0 && weeklyStats.avgCompletion < 50 && (
          <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-700">
            📈 Let's boost those numbers!
          </div>
        )}
      </div>
    </div>
  );
}
