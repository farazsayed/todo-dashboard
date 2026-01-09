import { useState } from 'react';
import type { TaskLink } from '../types';
import { generateId } from '../utils/storage';

interface TaskLinkEditorProps {
  links: TaskLink[];
  onAddLink: (link: TaskLink) => void;
  onUpdateLink: (link: TaskLink) => void;
  onDeleteLink: (linkId: string) => void;
}

export function TaskLinkEditor({
  links,
  onAddLink,
  onUpdateLink,
  onDeleteLink,
}: TaskLinkEditorProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');

  const handleAdd = () => {
    if (newTitle.trim() && newUrl.trim()) {
      onAddLink({
        id: generateId(),
        title: newTitle.trim(),
        url: newUrl.trim(),
      });
      setNewTitle('');
      setNewUrl('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
      setNewUrl('');
    }
  };

  const startEditing = (link: TaskLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const handleUpdate = () => {
    if (editingId && editTitle.trim() && editUrl.trim()) {
      onUpdateLink({
        id: editingId,
        title: editTitle.trim(),
        url: editUrl.trim(),
      });
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleUpdate();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditTitle('');
      setEditUrl('');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[12px] font-medium text-dark-text-secondary mb-2">
        Resources / Links
      </label>

      {/* Existing links */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id}>
              {editingId === link.id ? (
                <div className="space-y-2 p-2 bg-dark-tertiary rounded-lg">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    placeholder="Link title..."
                    autoFocus
                    className="w-full px-3 py-1.5 text-[13px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                  />
                  <input
                    type="url"
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 text-[13px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpdate}
                      className="px-3 py-1 text-[12px] bg-accent-green text-dark-primary rounded hover:bg-accent-green/90"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-[12px] text-dark-text-muted hover:text-dark-text-primary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 bg-dark-tertiary rounded-lg group">
                  <svg className="w-4 h-4 text-accent-blue flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[13px] text-accent-blue hover:underline truncate block"
                    >
                      {link.title}
                    </a>
                    <div className="text-[11px] text-dark-text-muted truncate">
                      {link.url}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => startEditing(link)}
                    className="p-1 text-dark-text-muted hover:text-dark-text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteLink(link.id)}
                    className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new link */}
      {isAdding ? (
        <div className="space-y-2 p-2 border border-dashed border-dark-border rounded-lg">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Link title (e.g., Documentation)"
            autoFocus
            className="w-full px-3 py-1.5 text-[13px] bg-dark-tertiary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://..."
            className="w-full px-3 py-1.5 text-[13px] bg-dark-tertiary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newUrl.trim()}
              className="px-3 py-1 text-[12px] bg-accent-green text-dark-primary rounded hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Link
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setNewTitle('');
                setNewUrl('');
              }}
              className="px-3 py-1 text-[12px] text-dark-text-muted hover:text-dark-text-primary"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 text-[12px] text-dark-text-muted hover:text-dark-text-primary border border-dashed border-dark-border rounded-lg hover:bg-dark-tertiary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Resource Link
        </button>
      )}
    </div>
  );
}
