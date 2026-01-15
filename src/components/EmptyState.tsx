interface EmptyStateProps {
  type: 'tasks' | 'projects' | 'habits' | 'completed';
  message?: string;
}

export function EmptyState({ type, message }: EmptyStateProps) {
  const config = {
    tasks: {
      icon: TasksIllustration,
      title: 'All caught up!',
      subtitle: message || 'No tasks scheduled for today. Enjoy your free time!',
    },
    projects: {
      icon: ProjectsIllustration,
      title: 'Create your first project',
      subtitle: message || 'Projects help you organize tasks into bigger efforts.',
    },
    habits: {
      icon: HabitsIllustration,
      title: 'Build great habits',
      subtitle: message || 'Track daily or weekly habits to build consistency.',
    },
    completed: {
      icon: CompletedIllustration,
      title: 'Amazing work!',
      subtitle: message || "You've completed all your tasks. Time to celebrate!",
    },
  };

  const { icon: Icon, title, subtitle } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-32 h-32 mb-6 text-dark-text-muted opacity-50">
        <Icon />
      </div>
      <h3 className="text-lg font-semibold text-dark-text-primary mb-2">{title}</h3>
      <p className="text-[14px] text-dark-text-muted max-w-xs">{subtitle}</p>
    </div>
  );
}

function TasksIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="2" strokeDasharray="8 4" />
      <path
        d="M40 60L55 75L85 45"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-green"
      />
      <circle cx="95" cy="25" r="8" fill="currentColor" className="text-accent-blue opacity-30" />
      <circle cx="20" cy="85" r="5" fill="currentColor" className="text-accent-purple opacity-30" />
    </svg>
  );
}

function ProjectsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="15" stroke="currentColor" strokeWidth="2" />
      <circle cx="60" cy="60" r="5" fill="currentColor" className="text-accent-orange" />
      <path
        d="M60 20V10M60 110V100M20 60H10M110 60H100"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function HabitsIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="20" y="70" width="15" height="30" rx="2" fill="currentColor" className="text-accent-blue opacity-40" />
      <rect x="40" y="55" width="15" height="45" rx="2" fill="currentColor" className="text-accent-green opacity-50" />
      <rect x="60" y="40" width="15" height="60" rx="2" fill="currentColor" className="text-accent-purple opacity-60" />
      <rect x="80" y="25" width="15" height="75" rx="2" fill="currentColor" className="text-accent-orange opacity-70" />
      <path
        d="M15 100H105"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M27 65L52 50L72 35L87 20"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="4 4"
        className="text-streak-fire"
      />
    </svg>
  );
}

function CompletedIllustration() {
  return (
    <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="60" cy="60" r="45" stroke="currentColor" strokeWidth="2" className="text-accent-green" />
      <path
        d="M35 60L52 77L85 44"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-accent-green"
      />
      {/* Confetti */}
      <circle cx="25" cy="30" r="4" fill="currentColor" className="text-accent-blue" />
      <circle cx="95" cy="35" r="3" fill="currentColor" className="text-accent-purple" />
      <circle cx="90" cy="90" r="4" fill="currentColor" className="text-accent-orange" />
      <circle cx="30" cy="95" r="3" fill="currentColor" className="text-accent-pink" />
      <rect x="18" y="55" width="6" height="6" rx="1" fill="currentColor" className="text-accent-yellow" transform="rotate(45 21 58)" />
      <rect x="96" cy="65" width="5" height="5" rx="1" fill="currentColor" className="text-accent-green" transform="rotate(30 98 67)" />
    </svg>
  );
}
