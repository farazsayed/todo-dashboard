import { useState, useRef } from 'react';
import type { Project, Task } from '../types';
import { useApp } from '../context/AppContext';

interface ProjectCardProps {
  project: Project;
  onSelectProject: (project: Project) => void;
  onSelectTask: (projectId: string, taskId: string) => void;
}

export function ProjectCard({ project, onSelectProject, onSelectTask }: ProjectCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { state, addTask, toggleTaskCompletion, scheduleTaskForDate, unscheduleTaskFromDate, reorderTasks } = useApp();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { selectedDate } = state;

  // Drag-and-drop state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTaskId(task.id);
    dragNodeRef.current = e.target as HTMLDivElement;
    dragNodeRef.current.style.opacity = '0.5';
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) {
      dragNodeRef.current.style.opacity = '1';
    }
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    dragNodeRef.current = null;
  };

  const handleDragOver = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    if (draggedTaskId === taskId) return;
    setDragOverTaskId(taskId);
  };

  const handleDragLeave = () => {
    setDragOverTaskId(null);
  };

  const handleDrop = (e: React.DragEvent, targetTaskId: string) => {
    e.preventDefault();
    if (!draggedTaskId || draggedTaskId === targetTaskId) return;

    const tasks = [...project.tasks];
    const draggedIndex = tasks.findIndex(t => t.id === draggedTaskId);
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    // Remove dragged task and insert at target position
    const [draggedTask] = tasks.splice(draggedIndex, 1);
    tasks.splice(targetIndex, 0, draggedTask);

    reorderTasks(project.id, tasks);
    setDragOverTaskId(null);
  };

  const completedTasks = project.tasks.filter(t => t.completed).length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      addTask(project.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  return (
    <div
      className="border rounded-lg overflow-hidden transition-shadow duration-200 hover:shadow-md"
      style={{ borderLeftColor: project.color, borderLeftWidth: '4px' }}
    >
      {/* Project Header */}
      <div className="bg-white p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 flex-1 text-left group"
          >
            <span className={`text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </span>
            <h3 className="font-medium text-gray-900 group-hover:text-gray-700 transition-colors">{project.title}</h3>
          </button>
          <button
            onClick={() => onSelectProject(project)}
            className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
            title="Edit project"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-500">{completedTasks}/{totalTasks} tasks</span>
            <span className="text-gray-400">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                backgroundColor: project.color
              }}
            />
          </div>
        </div>
      </div>

      {/* Expanded Task List */}
      <div
        className={`border-t bg-gray-50 overflow-hidden transition-all duration-300 ease-in-out ${
          isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="p-4 space-y-2">
          {project.tasks.map(task => {
            const isScheduled = task.scheduledDates.includes(selectedDate);
            const isDragOver = dragOverTaskId === task.id;

            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, task.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, task.id)}
                className={`flex items-center gap-2 group cursor-grab active:cursor-grabbing p-1 -mx-1 rounded transition-colors ${
                  isDragOver ? 'bg-blue-100 border-t-2 border-blue-400' : ''
                }`}
              >
                {/* Drag handle */}
                <span className="text-gray-300 hover:text-gray-500 cursor-grab">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 6h2v2H8V6zm6 0h2v2h-2V6zM8 11h2v2H8v-2zm6 0h2v2h-2v-2zm-6 5h2v2H8v-2zm6 0h2v2h-2v-2z" />
                  </svg>
                </span>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => toggleTaskCompletion(project.id, task.id, selectedDate)}
                  className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                  style={{ accentColor: project.color }}
                />
                <span
                  className={`flex-1 text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-700'}`}
                >
                  {task.title}
                </span>

                {/* Schedule/Unschedule button */}
                {isScheduled ? (
                  <button
                    onClick={() => unscheduleTaskFromDate(project.id, task.id, selectedDate)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-opacity"
                    title="Remove from this day"
                  >
                    Scheduled
                  </button>
                ) : (
                  <button
                    onClick={() => scheduleTaskForDate(project.id, task.id, selectedDate)}
                    className="opacity-0 group-hover:opacity-100 px-2 py-0.5 text-xs border border-gray-300 text-gray-600 rounded hover:bg-gray-100 transition-opacity"
                    title="Add to this day"
                  >
                    + Schedule
                  </button>
                )}

                <button
                  onClick={() => onSelectTask(project.id, task.id)}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 p-1 transition-opacity"
                  title="Edit task"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
              </div>
            );
          })}

          {/* Add Task Form */}
          {isAddingTask ? (
            <form onSubmit={handleAddTask} className="mt-3">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                autoFocus
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTask(false);
                    setNewTaskTitle('');
                  }}
                  className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTask(true)}
              className="w-full mt-2 px-3 py-2 text-sm text-gray-600 border border-dashed border-gray-300 rounded hover:border-gray-400 hover:text-gray-700"
            >
              + Add Task
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
