import { useState, useEffect, useCallback, useRef } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { MainContent } from './components/MainContent';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { GoalsView } from './components/GoalsView';
import { StatsView } from './components/StatsView';
import { WeekStrip } from './components/WeekStrip';
import { QuickAddModal } from './components/QuickAddModal';
import { TaskSchedulerModal } from './components/TaskSchedulerModal';
import { EditorPanel } from './components/EditorPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getUserLocation, getWeatherData, type WeatherData } from './utils/weather';
import type { Goal, RecurringTask, Habit, OneOffTask } from './types';

function AppContent() {
  const { state } = useApp();
  const [selectedGoal, setSelectedGoal] = useState<Goal | null | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<{ goalId: string; taskId: string } | null>(null);
  const [selectedRecurringTask, setSelectedRecurringTask] = useState<RecurringTask | null | undefined>(undefined);
  const [selectedHabit, setSelectedHabit] = useState<Habit | null | undefined>(undefined);
  const [selectedOneOffTask, setSelectedOneOffTask] = useState<OneOffTask | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [goalsViewOpen, setGoalsViewOpen] = useState(false);
  const [taskSchedulerOpen, setTaskSchedulerOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  const quickAddInputRef = useRef<HTMLInputElement>(null);

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

  const handleSelectGoal = (goal: Goal | null) => {
    setSelectedGoal(goal);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectTask = (goalId: string, taskId: string) => {
    setSelectedTask({ goalId, taskId });
    setSelectedGoal(undefined);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectRecurringTask = (task: RecurringTask | null) => {
    setSelectedRecurringTask(task);
    setSelectedGoal(undefined);
    setSelectedTask(null);
    setSelectedHabit(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectHabit = (habit: Habit | null) => {
    setSelectedHabit(habit);
    setSelectedGoal(undefined);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedOneOffTask(null);
  };

  const handleSelectOneOffTask = (task: OneOffTask) => {
    setSelectedOneOffTask(task);
    setSelectedGoal(undefined);
    setSelectedTask(null);
    setSelectedRecurringTask(undefined);
    setSelectedHabit(undefined);
  };

  const handleCloseEditor = () => {
    setSelectedGoal(undefined);
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

  const handleExpandGoals = useCallback(() => {
    setGoalsViewOpen(true);
  }, []);

  const handleCloseGoalsView = useCallback(() => {
    setGoalsViewOpen(false);
  }, []);

  const handleOpenTaskScheduler = useCallback(() => {
    setTaskSchedulerOpen(true);
  }, []);

  const handleCloseTaskScheduler = useCallback(() => {
    setTaskSchedulerOpen(false);
  }, []);

  // Check if any editor is open
  const hasEditorOpen = selectedGoal !== undefined ||
    selectedTask !== null ||
    selectedRecurringTask !== undefined ||
    selectedHabit !== undefined ||
    selectedOneOffTask !== null;

  return (
    <>
      <Layout
        sidebarCollapsed={sidebarCollapsed}
        sidebar={
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            onSelectGoal={handleSelectGoal}
            onSelectTask={handleSelectTask}
            onSelectRecurringTask={handleSelectRecurringTask}
            onSelectHabit={handleSelectHabit}
            onQuickAddTask={handleQuickAdd}
            onExpandGoals={handleExpandGoals}
            onScheduleTask={handleOpenTaskScheduler}
            weather={weather}
          />
        }
        header={<Header />}
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
          selectedGoal={selectedGoal}
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

      {/* Goals Full Page View */}
      {goalsViewOpen && (
        <GoalsView
          onSelectGoal={handleSelectGoal}
          onSelectTask={handleSelectTask}
          onClose={handleCloseGoalsView}
        />
      )}

      {/* Task Scheduler Modal */}
      {taskSchedulerOpen && (
        <TaskSchedulerModal onClose={handleCloseTaskScheduler} />
      )}
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
