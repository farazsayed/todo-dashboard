import { useState, useEffect } from 'react';
import type { Project } from '../types';
import { COLORS } from '../types';
import { useApp } from '../context/AppContext';

interface ProjectEditorProps {
  project: Project | null;
  onClose: () => void;
}

export function ProjectEditor({ project, onClose }: ProjectEditorProps) {
  const { addProject, updateProject, deleteProject, archiveProject } = useApp();
  const [title, setTitle] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setColor(project.color);
      setNotes(project.notes || '');
    } else {
      setTitle('');
      setColor(COLORS[0]);
      setNotes('');
    }
    setError('');
    setTouched(false);
  }, [project]);

  const validateTitle = (value: string): string => {
    if (!value.trim()) {
      return 'Title is required';
    }
    if (value.trim().length < 2) {
      return 'Title must be at least 2 characters';
    }
    if (value.trim().length > 100) {
      return 'Title must be less than 100 characters';
    }
    return '';
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (touched) {
      setError(validateTitle(value));
    }
  };

  const handleTitleBlur = () => {
    setTouched(true);
    setError(validateTitle(title));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateTitle(title);
    if (validationError) {
      setError(validationError);
      setTouched(true);
      return;
    }

    if (project) {
      updateProject({
        ...project,
        title: title.trim(),
        color,
        notes: notes.trim() || undefined,
      });
    } else {
      addProject(title.trim(), color);
    }
    onClose();
  };

  const handleDelete = () => {
    if (project && confirm('Delete this project and all its tasks?')) {
      deleteProject(project.id);
      onClose();
    }
  };

  const handleArchive = () => {
    if (project && confirm('Archive this project? You can restore it later from archived projects.')) {
      archiveProject(project.id);
      onClose();
    }
  };

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
          {project ? 'Edit Project' : 'New Project'}
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-md text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-tertiary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            onBlur={handleTitleBlur}
            placeholder="Enter project title..."
            autoFocus
            className={`w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 ${
              error && touched
                ? 'border-red-500/50 focus:ring-red-500/50'
                : 'border-dark-border focus:ring-accent-blue/50'
            }`}
          />
          {error && touched && (
            <p className="mt-1.5 text-[12px] text-red-400">{error}</p>
          )}
        </div>

        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
            Color
          </label>
          <div className="flex flex-wrap gap-2.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-8 h-8 rounded-full transition-all ${
                  color === c ? 'ring-2 ring-offset-2 ring-offset-dark-secondary ring-white/50 scale-110' : 'hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes..."
            rows={3}
            className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-none"
          />
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-[14px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 font-medium"
          >
            {project ? 'Save' : 'Create'}
          </button>
          {project && (
            <>
              <button
                type="button"
                onClick={handleArchive}
                className="px-4 py-2.5 text-[14px] bg-dark-tertiary text-dark-text-secondary rounded-lg hover:bg-dark-hover font-medium"
                title="Archive project"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2.5 text-[14px] bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 font-medium"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
}
