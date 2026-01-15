import { useState, useEffect, useRef } from 'react';
import { IconButton } from './ui/Button';

interface GroceryItem {
  id: string;
  text: string;
  checked: boolean;
}

const GROCERY_LIST_KEY = 'groceryList';

interface GroceryListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GroceryList({ isOpen, onClose }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const isInitialLoadComplete = useRef(false);

  // Load items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(GROCERY_LIST_KEY);
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch {
        setItems([]);
      }
    }
    // Mark initial load as complete after loading
    isInitialLoadComplete.current = true;
  }, []);

  // Save items to localStorage whenever they change (but only after initial load)
  useEffect(() => {
    // Don't save until initial load is complete to avoid overwriting existing data
    if (!isInitialLoadComplete.current) return;
    localStorage.setItem(GROCERY_LIST_KEY, JSON.stringify(items));
  }, [items]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const newItem: GroceryItem = {
        id: generateId(),
        text: newItemText.trim(),
        checked: false,
      };
      setItems([...items, newItem]);
      setNewItemText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddItem();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const toggleItem = (id: string) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const startEditing = (item: GroceryItem) => {
    setEditingId(item.id);
    setEditingText(item.text);
  };

  const saveEdit = () => {
    if (editingId && editingText.trim()) {
      setItems(items.map(item =>
        item.id === editingId ? { ...item, text: editingText.trim() } : item
      ));
    }
    setEditingId(null);
    setEditingText('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
      setEditingText('');
    }
  };

  const clearChecked = () => {
    setItems(items.filter(item => !item.checked));
  };

  const clearAll = () => {
    if (confirm('Clear all items from the grocery list?')) {
      setItems([]);
    }
  };

  const checkedCount = items.filter(item => item.checked).length;
  const uncheckedItems = items.filter(item => !item.checked);
  const checkedItems = items.filter(item => item.checked);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-dark-secondary border border-dark-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-border">
          <div className="flex items-center gap-3">
            <span className="text-xl">🛒</span>
            <h2 className="text-[18px] font-semibold text-dark-text-primary">Grocery List</h2>
            {items.length > 0 && (
              <span className="text-[12px] text-dark-text-muted bg-dark-tertiary px-2 py-0.5 rounded">
                {items.length} items
              </span>
            )}
          </div>
          <IconButton variant="ghost" size="sm" label="Close" onClick={onClose}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </IconButton>
        </div>

        {/* Add item input */}
        <div className="px-5 py-3 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add item..."
              className="flex-1 px-3 py-2.5 text-[14px] bg-dark-tertiary border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:ring-2 focus:ring-accent-green/50"
            />
            <button
              onClick={handleAddItem}
              disabled={!newItemText.trim()}
              className="px-4 py-2.5 bg-accent-green text-dark-primary rounded-lg font-medium text-[14px] hover:bg-accent-green/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {items.length === 0 ? (
            <div className="text-center py-10 text-dark-text-muted">
              <span className="text-3xl block mb-2">🥦</span>
              <p className="text-[14px]">Your grocery list is empty</p>
              <p className="text-[12px] mt-1">Add items above to get started</p>
            </div>
          ) : (
            <div className="space-y-1">
              {/* Unchecked items first */}
              {uncheckedItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-dark-tertiary rounded-lg group"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 flex-shrink-0 accent-accent-green"
                  />
                  {editingId === item.id ? (
                    <input
                      ref={editInputRef}
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={handleEditKeyDown}
                      className="flex-1 bg-dark-tertiary border border-accent-blue/50 rounded px-2 py-0.5 text-[14px] text-dark-text-primary focus:outline-none"
                    />
                  ) : (
                    <span
                      className="flex-1 text-[14px] text-dark-text-primary cursor-pointer"
                      onDoubleClick={() => startEditing(item)}
                      title="Double-click to edit"
                    >
                      {item.text}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}

              {/* Separator if there are checked items */}
              {checkedItems.length > 0 && uncheckedItems.length > 0 && (
                <div className="flex items-center gap-2 py-2 px-2">
                  <div className="flex-1 h-px bg-dark-border" />
                  <span className="text-[11px] text-dark-text-muted uppercase">Checked ({checkedCount})</span>
                  <div className="flex-1 h-px bg-dark-border" />
                </div>
              )}

              {/* Checked items */}
              {checkedItems.map(item => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-dark-tertiary rounded-lg group opacity-60"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={() => toggleItem(item.id)}
                    className="w-4 h-4 flex-shrink-0 accent-accent-green"
                  />
                  <span className="flex-1 text-[14px] text-dark-text-muted line-through">
                    {item.text}
                  </span>
                  <button
                    type="button"
                    onClick={() => deleteItem(item.id)}
                    className="p-1 text-dark-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="px-5 py-3 border-t border-dark-border flex items-center justify-between">
            <button
              onClick={clearChecked}
              disabled={checkedCount === 0}
              className="text-[13px] text-dark-text-muted hover:text-dark-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear checked ({checkedCount})
            </button>
            <button
              onClick={clearAll}
              className="text-[13px] text-red-400 hover:text-red-300"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
