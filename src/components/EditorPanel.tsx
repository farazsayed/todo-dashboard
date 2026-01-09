import type { Goal, RecurringTask, Habit, OneOffTask } from '../types';
import { GoalEditor } from './GoalEditor';
import { TaskEditor } from './TaskEditor';
import { RecurringTaskEditor } from './RecurringTaskEditor';
import { HabitEditor } from './HabitEditor';
import { OneOffTaskEditor } from './OneOffTaskEditor';

interface EditorPanelProps {
  selectedGoal: Goal | null | undefined;
  selectedTask: { goalId: string; taskId: string } | null;
  selectedRecurringTask: RecurringTask | null | undefined;
  selectedHabit: Habit | null | undefined;
  selectedOneOffTask: OneOffTask | null;
  onClose: () => void;
}

export function EditorPanel({
  selectedGoal,
  selectedTask,
  selectedRecurringTask,
  selectedHabit,
  selectedOneOffTask,
  onClose,
}: EditorPanelProps) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[380px] bg-dark-secondary border-l border-dark-border z-50 overflow-y-auto animate-slide-in">
        {selectedTask ? (
          <TaskEditor
            goalId={selectedTask.goalId}
            taskId={selectedTask.taskId}
            onClose={onClose}
          />
        ) : selectedGoal !== undefined ? (
          <GoalEditor goal={selectedGoal} onClose={onClose} />
        ) : selectedRecurringTask !== undefined ? (
          <RecurringTaskEditor task={selectedRecurringTask} onClose={onClose} />
        ) : selectedHabit !== undefined ? (
          <HabitEditor habit={selectedHabit} onClose={onClose} />
        ) : selectedOneOffTask ? (
          <OneOffTaskEditor task={selectedOneOffTask} onClose={onClose} />
        ) : null}
      </div>
    </>
  );
}
