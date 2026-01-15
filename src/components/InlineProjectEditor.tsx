import { useState, useEffect, useRef } from 'react';
import type { Project, TaskLink } from '../types';
import { COLORS } from '../types';
import { useApp } from '../context/AppContext';
import { Button, IconButton } from './ui/Button';
import { TaskLinkEditor } from './TaskLinkEditor';
import { generateId } from '../utils/storage';

interface InlineProjectEditorProps {
  project: Project;
  onClose: () => void;
}

export function InlineProjectEditor({ project, onClose }: InlineProjectEditorProps) {
  const { updateProject, deleteProject, archiveProject } = useApp();
  const [title, setTitle] = useState(project.title);
  const [color, setColor] = useState(project.color);
  const [notes, setNotes] = useState(project.notes || '');
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTitle(project.title);
    setColor(project.color);
    setNotes(project.notes || '');
  }, [project]);

  useEffect(() => {
    if (isEditingNotes && notesRef.current) {
      notesRef.current.focus();
      notesRef.current.selectionStart = notesRef.current.value.length;
    }
  }, [isEditingNotes]);

  const handleSave = () => {
    if (title.trim()) {
      updateProject({
        ...project,
        title: title.trim(),
        color,
        notes: notes.trim() || undefined,
      });
    }
  };

  const handleTitleBlur = () => {
    if (title.trim() && title.trim() !== project.title) {
      handleSave();
    }
  };

  const handleNotesBlur = () => {
    setIsEditingNotes(false);
    if (notes.trim() !== (project.notes || '')) {
      handleSave();
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    updateProject({
      ...project,
      color: newColor,
    });
  };

  const handleDelete = () => {
    if (confirm('Delete this project and all its tasks?')) {
      deleteProject(project.id);
      onClose();
    }
  };

  const handleArchive = () => {
    if (confirm('Archive this project? You can restore it later.')) {
      archiveProject(project.id);
      onClose();
    }
  };

  // Project link handlers
  const handleAddLink = (link: TaskLink) => {
    const newLink: TaskLink = {
      id: generateId(),
      title: link.title,
      url: link.url,
    };
    updateProject({
      ...project,
      links: [...(project.links || []), newLink],
    });
  };

  const handleUpdateLink = (link: TaskLink) => {
    updateProject({
      ...project,
      links: (project.links || []).map((l) => (l.id === link.id ? link : l)),
    });
  };

  const handleDeleteLink = (linkId: string) => {
    updateProject({
      ...project,
      links: (project.links || []).filter((l) => l.id !== linkId),
    });
  };

  return (
    <div className="fixed right-0 top-0 bottom-0 w-[420px] bg-dark-secondary border-l border-dark-border z-[60] overflow-y-auto shadow-xl">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-semibold text-dark-text-secondary uppercase tracking-wide">
            Edit Project
          </h2>
          <IconButton variant="ghost" size="sm" label="Close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Color indicator bar */}
        <div
          className="h-1.5 rounded-full mb-5"
          style={{ backgroundColor: color }}
        />

        <div className="space-y-5">
          {/* Title - Editable inline */}
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              placeholder="Project title..."
              className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50"
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
              Color
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorChange(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-offset-dark-secondary ring-white/50 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Notes - Click to edit inline */}
          <div>
            <label className="block text-[12px] font-medium text-dark-text-secondary mb-1.5">
              Notes
            </label>
            {isEditingNotes ? (
              <textarea
                ref={notesRef}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setIsEditingNotes(false);
                  } else if (e.key === 'Tab') {
                    e.preventDefault();
                    const start = e.currentTarget.selectionStart;
                    const end = e.currentTarget.selectionEnd;
                    const newValue = notes.substring(0, start) + '\t' + notes.substring(end);
                    setNotes(newValue);
                    // Set cursor position after the tab
                    setTimeout(() => {
                      if (notesRef.current) {
                        notesRef.current.selectionStart = notesRef.current.selectionEnd = start + 1;
                      }
                    }, 0);
                  }
                }}
                placeholder="Add notes, context, or details..."
                rows={5}
                className="w-full px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/50 resize-none"
              />
            ) : (
              <div
                onClick={() => setIsEditingNotes(true)}
                className="w-full min-h-[100px] px-3.5 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg cursor-text hover:border-dark-hover"
              >
                {notes ? (
                  <p className="text-dark-text-primary whitespace-pre-wrap">{notes}</p>
                ) : (
                  <p className="text-dark-text-muted">Click to add notes...</p>
                )}
              </div>
            )}
          </div>

          {/* Project Links */}
          <TaskLinkEditor
            links={project.links || []}
            onAddLink={handleAddLink}
            onUpdateLink={handleUpdateLink}
            onDeleteLink={handleDeleteLink}
            title="Project Links"
          />

          {/* Stats */}
          <div className="bg-dark-tertiary rounded-lg p-4">
            <div className="flex items-center justify-between text-[13px]">
              <span className="text-dark-text-muted">Total Tasks</span>
              <span className="text-dark-text-primary font-mono">{project.tasks.length}</span>
            </div>
            <div className="flex items-center justify-between text-[13px] mt-2">
              <span className="text-dark-text-muted">Created</span>
              <span className="text-dark-text-primary font-mono">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
              Done
            </Button>
            <IconButton variant="secondary" size="md" label="Archive project" onClick={handleArchive}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </IconButton>
            <IconButton variant="danger" size="md" label="Delete project" onClick={handleDelete}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </IconButton>
          </div>
        </div>
      </div>
    </div>
  );
}
