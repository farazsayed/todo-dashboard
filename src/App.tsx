import { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { ProjectsView } from './components/ProjectsView';
import { StatsView } from './components/StatsView';
import { WeekStrip } from './components/WeekStrip';
import { QuickAddModal } from './components/QuickAddModal';
import { TaskSchedulerModal } from './components/TaskSchedulerModal';
import { EditorPanel } from './components/EditorPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toast, useToast } from './components/Toast';
import { getUserLocation, getWeatherData, type WeatherData } from './utils/weather';
import type { Project, RecurringTask, Habit, OneOffTask } from './types';

// Hook to detect mobile screen
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}

function AppContent() {
  const { state, dispatch, toggleTheme } = useApp();
  const [selectedProject, setSelectedProject] = useState<Project | null | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<{ projectId: string; taskId: string } | null>(null);
  const [selectedRecurringTask, setSelectedRecurringTask] = useState<RecurringTask | null | undefined>(undefined);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null | undefined>(undefined);
  const [selectedOneOffTask, setSelectedOneOffTask] = useState<OneOffTask | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [projectsViewOpen, setProjectsViewOpen] = useState(false);
  const [taskSchedulerOpen, setTaskSchedulerOpen] = useState(false);
  const isMobile = useIsMobile();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true); // Start collapsed on mobile
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const { messages: toastMessages, dismissToast } = useToast();

  const quickAddInputRef = useRef<HTMLInputElement>(null);

  // Auto-collapse sidebar on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  // Fetch weather data
  useEffect(() => {
    async function fetchWeather() {
      const location = await getUserLocation();
      if (location) {
        const data = await getWeatherData(location);
        if (data) {
          setWeather(data);
        }
      }
    }
    fetchWeather();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // N - Quick add new task
      if (e.key === 'n' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setQuickAddOpen(true);
      }

      // P - Open projects view
      if (e.key === 'p' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        setProjectsViewOpen(true);
      }

      // T - Switch to today/day view
      if (e.key === 't' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW_MODE', payload: 'day' });
      }

      // W - Switch to week view
      if (e.key === 'w' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW_MODE', payload: 'week' });
      }

      // M - Switch to month view
      if (e.key === 'm' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW_MODE', payload: 'month' });
      }

      // S - Switch to stats view
      if (e.key === 's' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        dispatch({ type: 'SET_VIEW_MODE', payload: 'stats' });
      }

      // D - Toggle dark/light theme
      if (e.key === 'd' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        toggleTheme();
      }

      // Escape - Close modals/editors
      if (e.key === 'Escape') {
        if (quickAddOpen) {
          setQuickAddOpen(false);
        } else if (projectsViewOpen) {
          setProjectsViewOpen(false);
        } else if (taskSchedulerOpen) {
          setTaskSchedulerOpen(false);
        } else {
          setSelectedProject(undefined);
          setSelectedTask(null);
          setSelectedRecurringTask(undefined);
          setSelectedHabit(undefined);
          setSelectedOneOffTask(null);
        }
      }

      // ? - Show keyboard shortcuts help (could be implemented as a modal)
      if (e.key === '?') {
        // TODO: Show shortcuts help modal
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [quickAddOpen, projectsViewOpen, taskSchedulerOpen, dispatch, toggleTheme]);

  const handleSelectProject = (project: Project | null) => {
    setSelectedProject(project);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectTask = (projectId: string, taskId: string) => {
    setSelectedTask({ projectId, taskId });
    setSelectedProject(undefined);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectRecurringTask = (task: RecurringTask | null) => {
    setSelectedRecurringTask(task);
    setSelectedProject(undefined);
    setSelectedTask(null);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectHabit = (habit: Habit | null) => {
    setSelectedHabit(habit);
    setSelectedProject(undefined);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectOneOffTask = (task: OneOffTask) => {
    setSelectedOneOffTask(task);
    setSelectedProject(undefined);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
  };

  const handleCloseEditor = () => {
    setSelectedProject(undefined);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleQuickAdd = useCallback(() => {
    setQuickAddOpen(true);
  }, []);

  const handleCloseQuickAdd = useCallback(() => {
    setQuickAddOpen(false);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarCollapsed(true);
    }
  }, [isMobile]);

  const handleSidebarWidthChange = useCallback((width: number) => {
    setSidebarWidth(width);
    localStorage.setItem('sidebar-width', width.toString());
  }, []);

  const handleExpandProjects = useCallback(() => {
    setProjectsViewOpen(true);
  }, []);

  const handleCloseProjectsView = useCallback(() => {
    setProjectsViewOpen(false);
  }, []);

  const handleOpenTaskScheduler = useCallback(() => {
    setTaskSchedulerOpen(true);
  }, []);

  const handleCloseTaskScheduler = useCallback(() => {
    setTaskSchedulerOpen(false);
  }, []);

  // Check if any editor is open
  const hasEditorOpen = selectedProject !== undefined ||
    selectedTask !== null ||
    selectedRecurringTask !== undefined ||
    selectedHabit !== undefined ||
    selectedOneOffTask !== null;

  return (
    <>
      <Layout
        sidebarCollapsed={sidebarCollapsed}
        sidebarWidth={sidebarWidth}
        onSidebarWidthChange={handleSidebarWidthChange}
        isMobile={isMobile}
        onCloseMobileSidebar={closeMobileSidebar}
        sidebar={
          <Sidebar
            collapsed={sidebarCollapsed && !isMobile}
            onToggleCollapse={toggleSidebar}
            onSelectProject={handleSelectProject}
            onSelectRecurringTask={handleSelectRecurringTask}
            onSelectHabit={handleSelectHabit}
            onQuickAddTask={handleQuickAdd}
            onExpandProjects={handleExpandProjects}
            onScheduleTask={handleOpenTaskScheduler}
            weather={weather}
          />
        }
        header={<Header onMenuClick={toggleSidebar} showMenuButton={isMobile} />}
        weekStrip={<WeekStrip />}
      >
        {state.viewMode === 'week' ? (
          <WeekView />
        ) : state.viewMode === 'month' ? (
          <MonthView />
        ) : state.viewMode === 'stats' ? (
          <StatsView />
        ) : (
          <MainContent
            onSelectTask={handleSelectTask}
            onSelectRecurringTask={handleSelectRecurringTask}
            onSelectHabit={handleSelectHabit}
            onSelectOneOffTask={handleSelectOneOffTask}
          />
        )}
      </Layout>

      {/* Editor Panel - Slide in from right */}
      {hasEditorOpen && (
        <EditorPanel
          selectedProject={selectedProject}
          selectedTask={selectedTask}
          selectedRecurringTask={selectedRecurringTask}
          selectedHabit={selectedHabit}
          selectedOneOffTask={selectedOneOffTask}
          onClose={handleCloseEditor}
        />
      )}

      {/* Quick Add Modal */}
      <QuickAddModal
        isOpen={quickAddOpen}
        onClose={handleCloseQuickAdd}
        inputRef={quickAddInputRef}
      />

      {/* Projects Full Page View */}
      {projectsViewOpen && (
        <ProjectsView
          onSelectProject={handleSelectProject}
          onSelectTask={handleSelectTask}
          onClose={handleCloseProjectsView}
        />
      )}

      {/* Task Scheduler Modal */}
      {taskSchedulerOpen && (
        <TaskSchedulerModal onClose={handleCloseTaskScheduler} />
      )}

      {/* Toast notifications */}
      <Toast messages={toastMessages} onDismiss={dismissToast} />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ErrorBoundary>
  );
}

export default App;
