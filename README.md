# Todo Dashboard

A modern, feature-rich productivity dashboard built with React, TypeScript, and Tailwind CSS. Designed for daily task management with support for goals, recurring tasks, habits, and one-off tasks.

![Dark Theme](https://img.shields.io/badge/theme-dark-1a1a2e)
![React](https://img.shields.io/badge/React-18-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8)

## Features

### Task Management
- **Goals** - Long-term projects with nested subtasks (up to 3 levels deep)
- **Recurring Tasks** - Daily, weekly, or custom schedules
- **Habits** - Track daily habits with streak counters
- **One-Off Tasks** - Quick tasks for the current day

### Goals System
- Nested subtasks for breaking down complex projects
- Multiple resource links per task (documentation, references, etc.)
- Quick "Add to Today" button for scheduling tasks
- Task scheduler modal for planning future days
- Collapsible checklist view with search/filter
- Progress tracking with visual indicators
- Inline task editor (edit without leaving Goals view)

### Views
- **Day View** - Focus on today's tasks across all categories
- **Week View** - Weekly overview with task distribution
- **Month View** - Monthly calendar with task indicators
- **Stats View** - Analytics dashboard with:
  - Weekly/monthly completion rates
  - 7-day completion chart
  - Goal progress breakdown
  - Habit streak tracking

### Productivity Tools
- **Pomodoro Timer** - Built-in focus timer
- **Timezone Tool** - East/West coast times with Central time converter
- **Weather Widget** - Current conditions and forecast
- **Time Progress** - Hover tooltip showing day/week/month/year completion

### UI Features
- Dark theme optimized for focus
- Live-updating clock in header
- Collapsible sidebar
- Quick add modal for fast task entry
- Responsive design

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/farazsayed/todo-dashboard.git
cd todo-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
```

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **State Management:** React Context with useReducer
- **Storage:** localStorage (client-side persistence)

## Project Structure

```
src/
├── components/          # React components
│   ├── AddToTodayButton.tsx
│   ├── GoalsView.tsx
│   ├── Header.tsx
│   ├── MainContent.tsx
│   ├── MonthView.tsx
│   ├── PomodoroTimer.tsx
│   ├── QuickAddModal.tsx
│   ├── Sidebar.tsx
│   ├── StatsView.tsx
│   ├── SubtaskList.tsx
│   ├── TaskEditor.tsx
│   ├── TaskLinkEditor.tsx
│   ├── TaskSchedulerModal.tsx
│   ├── TimezoneTool.tsx
│   ├── WeekView.tsx
│   └── ...
├── context/             # React Context providers
│   └── AppContext.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
├── utils/               # Utility functions
│   ├── stats.ts
│   ├── storage.ts
│   └── weather.ts
└── App.tsx              # Main application component
```

## Data Model

### Goal
- Title, color, notes
- Tasks (with nested subtasks)
- Progress tracking

### Task
- Title, notes
- Scheduled dates & completed dates
- Resource links (title + URL pairs)
- Nested subtasks (recursive)

### Recurring Task
- Title with recurrence pattern
- Days of week or interval
- Quick link support

### Habit
- Title
- Current streak & best streak
- Completion history

## License

MIT
