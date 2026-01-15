import { type ReactNode, useState, useCallback, useEffect } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  weekStrip: ReactNode;
  header: ReactNode;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  onSidebarWidthChange: (width: number) => void;
}

export function Layout({ sidebar, children, weekStrip, header, sidebarCollapsed, sidebarWidth, onSidebarWidthChange }: LayoutProps) {
  const [isDragging, setIsDragging] = useState(false);
  const effectiveWidth = sidebarCollapsed ? 72 : sidebarWidth;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (sidebarCollapsed) return;
    e.preventDefault();
    setIsDragging(true);
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(450, e.clientX));
      onSidebarWidthChange(newWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, onSidebarWidthChange]);

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Sidebar - Fixed */}
      <aside
        className={`bg-dark-secondary border-r border-dark-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto overflow-x-hidden ${
          isDragging ? '' : 'transition-all duration-300 ease-in-out'
        }`}
        style={{ width: effectiveWidth }}
      >
        {sidebar}
      </aside>

      {/* Resize Handle */}
      {!sidebarCollapsed && (
        <div
          className={`fixed top-0 h-full w-1 cursor-col-resize z-20 hover:bg-accent-blue/50 transition-colors ${
            isDragging ? 'bg-accent-blue' : 'bg-transparent'
          }`}
          style={{ left: effectiveWidth - 2 }}
          onMouseDown={handleMouseDown}
        />
      )}

      {/* Main Content - Offset by sidebar width */}
      <main
        className={`flex-1 min-h-screen flex flex-col ${
          isDragging ? '' : 'transition-all duration-300 ease-in-out'
        }`}
        style={{ marginLeft: effectiveWidth }}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-dark-secondary border-b border-dark-border">
          {header}
        </header>

        {/* Week Strip - Below header */}
        <div className="bg-dark-secondary border-b border-dark-border">
          {weekStrip}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>
      </main>

      {/* Overlay during drag to prevent text selection */}
      {isDragging && (
        <div className="fixed inset-0 z-10 cursor-col-resize" />
      )}
    </div>
  );
}
