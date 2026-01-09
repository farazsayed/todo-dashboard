import type { ReactNode } from 'react';

interface LayoutProps {
  sidebar: ReactNode;
  children: ReactNode;
  weekStrip: ReactNode;
  header: ReactNode;
  sidebarCollapsed: boolean;
}

export function Layout({ sidebar, children, weekStrip, header, sidebarCollapsed }: LayoutProps) {
  const sidebarWidth = sidebarCollapsed ? 72 : 280;

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Sidebar - Fixed */}
      <aside
        className="bg-dark-secondary border-r border-dark-border flex flex-col h-screen fixed left-0 top-0 overflow-y-auto overflow-x-hidden transition-all duration-300 ease-in-out"
        style={{ width: sidebarWidth }}
      >
        {sidebar}
      </aside>

      {/* Main Content - Offset by sidebar width */}
      <main
        className="flex-1 min-h-screen flex flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-dark-secondary border-b border-dark-border">
          {header}
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </div>

        {/* Week Strip - Fixed to bottom */}
        <div className="bg-dark-secondary border-t border-dark-border">
          {weekStrip}
        </div>
      </main>
    </div>
  );
}
