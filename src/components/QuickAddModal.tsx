import { useState, useEffect, type RefObject } from 'react';
import { useApp } from '../context/AppContext';
import { generateId, getTodayISO } from '../utils/storage';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputRef: RefObject<HTMLInputElement | null>;
}

export function QuickAddModal({ isOpen, onClose, inputRef }: QuickAddModalProps) {
  const [title, setTitle] = useState('');
  const { dispatch } = useApp();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, inputRef]);

  useEffect(() => {
    if (!isOpen) {
      setTitle('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    dispatch({
      type: 'ADD_ONE_OFF_TASK',
      payload: {
        id: generateId(),
        title: title.trim(),
        completed: false,
        dueDate: getTodayISO(),
      },
    });

    setTitle('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-secondary rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-dark-border">
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-9 h-9 bg-accent-green/20 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a quick task... (press Enter to save)"
                className="flex-1 text-[16px] bg-transparent border-none outline-none text-dark-text-primary placeholder-dark-text-muted"
                autoFocus
              />
            </div>
          </div>

          <div className="px-4 py-3 bg-dark-tertiary flex items-center justify-between border-t border-dark-border">
            <div className="text-[12px] text-dark-text-muted">
              Press <kbd className="px-1.5 py-0.5 bg-dark-secondary rounded text-[11px] font-mono text-dark-text-secondary">Enter</kbd> to save,{' '}
              <kbd className="px-1.5 py-0.5 bg-dark-secondary rounded text-[11px] font-mono text-dark-text-secondary">Esc</kbd> to cancel
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-[13px] text-dark-text-secondary hover:text-dark-text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-1.5 text-[13px] bg-accent-green text-dark-primary rounded-lg hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                Add Task
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
