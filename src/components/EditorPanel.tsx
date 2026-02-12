import type { Project, RecurringTask, Habit, OneOffTask } from '../types';
import { ProjectEditor } from './ProjectEditor';
import { TaskEditor } from './TaskEditor';
import { RecurringTaskEditor } from './RecurringTaskEditor';
import { HabitEditor } from './HabitEditor';
import { OneOffTaskEditor } from './OneOffTaskEditor';

interface EditorPanelProps {
  selectedProject: Project | null | undefined;
  selectedTask: { projectId: string; taskId: string } | null;
  selectedRecurringTask: RecurringTask | null | undefined;
  selectedHabit: Habit | null | undefined;
  selectedOneOffTask: OneOffTask | null;
  onClose: () => void;
}

export function EditorPanel({
  selectedProject,
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

      {/* Panel - Full screen on mobile, 380px on desktop */}
      <div className="fixed inset-0 md:inset-auto md:top-0 md:right-0 md:h-full md:w-[380px] bg-dark-secondary md:border-l border-dark-border z-50 overflow-y-auto animate-slide-in">
        {selectedTask ? (
          <TaskEditor
            projectId={selectedTask.projectId}
            taskId={selectedTask.taskId}
            onClose={onClose}
          />
        ) : selectedProject !== undefined ? (
          <ProjectEditor project={selectedProject} onClose={onClose} />
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
