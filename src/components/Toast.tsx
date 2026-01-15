import { useState, useEffect, useCallback } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'undo';
  undoAction?: () => void;
  duration?: number;
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: string) => void;
}

export function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2">
      {messages.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);
  const duration = toast.duration || 5000;

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => onDismiss(toast.id), 300);
  }, [toast.id, onDismiss]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, duration);
    return () => clearTimeout(timer);
  }, [duration, handleDismiss]);

  const bgColor = {
    info: 'bg-dark-secondary',
    success: 'bg-accent-green/20',
    error: 'bg-red-500/20',
    undo: 'bg-dark-secondary',
  }[toast.type];

  const borderColor = {
    info: 'border-dark-border',
    success: 'border-accent-green/30',
    error: 'border-red-500/30',
    undo: 'border-accent-blue/30',
  }[toast.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${bgColor} ${borderColor} ${
        isExiting ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      <span className="text-[13px] text-dark-text-primary">{toast.message}</span>
      {toast.type === 'undo' && toast.undoAction && (
        <button
          onClick={() => {
            toast.undoAction?.();
            handleDismiss();
          }}
          className="px-3 py-1 text-[12px] font-medium text-accent-blue hover:bg-accent-blue/10 rounded transition-colors"
        >
          Undo
        </button>
      )}
      <button
        onClick={handleDismiss}
        className="ml-2 text-dark-text-muted hover:text-dark-text-secondary transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// Hook to manage toast messages
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setMessages((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const dismissToast = useCallback((id: string) => {
    setMessages((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showUndo = useCallback((message: string, undoAction: () => void) => {
    return addToast({ message, type: 'undo', undoAction });
  }, [addToast]);

  return { messages, addToast, dismissToast, showUndo };
}
