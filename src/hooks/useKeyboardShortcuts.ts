import { useEffect, useCallback } from 'react';

interface KeyboardShortcutsConfig {
  onNavigatePrev: () => void;
  onNavigateNext: () => void;
  onGoToToday: () => void;
  onToggleSidebar?: () => void;
  onCloseSidebar?: () => void;
  onQuickAdd?: () => void;
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  const {
    onNavigatePrev,
    onNavigateNext,
    onGoToToday,
    onToggleSidebar,
    onCloseSidebar,
    onQuickAdd,
  } = config;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in an input
    const target = e.target as HTMLElement;
    const isInputFocused =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable;

    // Escape should always work to close things
    if (e.key === 'Escape') {
      onCloseSidebar?.();
      return;
    }

    // Other shortcuts only work when not typing
    if (isInputFocused) return;

    // Navigation shortcuts
    if (e.key === 'ArrowLeft' || e.key === 'h') {
      e.preventDefault();
      onNavigatePrev();
    }

    if (e.key === 'ArrowRight' || e.key === 'l') {
      e.preventDefault();
      onNavigateNext();
    }

    // Go to today
    if (e.key === 't') {
      e.preventDefault();
      onGoToToday();
    }

    // Toggle sidebar (s key)
    if (e.key === 's' && onToggleSidebar) {
      e.preventDefault();
      onToggleSidebar();
    }

    // Quick add (n key or Cmd/Ctrl + N)
    if (e.key === 'n') {
      e.preventDefault();
      onQuickAdd?.();
    }

    // Keyboard shortcut help (? key)
    if (e.key === '?') {
      e.preventDefault();
      showShortcutHelp();
    }
  }, [onNavigatePrev, onNavigateNext, onGoToToday, onToggleSidebar, onCloseSidebar, onQuickAdd]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

function showShortcutHelp() {
  // Create a simple alert for now - could be enhanced to a modal
  alert(`Keyboard Shortcuts:

Navigation:
  ←/h     Previous day
  →/l     Next day
  t       Go to today

Actions:
  n       Quick add task
  s       Toggle sidebar
  Escape  Close editor/sidebar
  ?       Show this help`);
}
