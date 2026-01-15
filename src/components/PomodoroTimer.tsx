import { useState, useEffect, useRef } from 'react';

type TimerMode = 'work' | 'break';

export function PomodoroTimer() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [workDuration, setWorkDuration] = useState(45);
  const [breakDuration, setBreakDuration] = useState(15);
  const [seconds, setSeconds] = useState(45 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [autoLoop, setAutoLoop] = useState(true);
  const [youtubeAlarmUrl, setYoutubeAlarmUrl] = useState('');
  const intervalRef = useRef<number | null>(null);
  const hasTriggeredAlarm = useRef(false);

  // Timer countdown effect
  useEffect(() => {
    if (isRunning && seconds > 0) {
      hasTriggeredAlarm.current = false; // Reset alarm trigger flag
      intervalRef.current = window.setInterval(() => {
        setSeconds((prev) => Math.max(0, prev - 1));
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Handle timer completion - separate effect to avoid issues
  useEffect(() => {
    if (seconds === 0 && isRunning && !hasTriggeredAlarm.current) {
      hasTriggeredAlarm.current = true;

      // Open YouTube URL or play default alarm
      if (youtubeAlarmUrl.trim()) {
        window.open(youtubeAlarmUrl, '_blank');
      } else {
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBRV71fDTgjMGHm7A7+OZUQ4PVqzn77BdGQg+ltryxnIjBBqAzPLaizsIFG+67OihUBAMUqnk8LSfGwk3kcXzz4AuBSJ7xfDckz4JGGi76+qaUxEPV6zj8LNiGgk7m9byw3EiBxyByvLaiz4IFnO/8+KcTwwNVKfi8Lhhpg==');
          audio.play();
        } catch (e) {
          // Silent fail
        }
      }

      // Handle mode switch
      if (autoLoop) {
        if (mode === 'work') {
          setMode('break');
          setSeconds(breakDuration * 60);
        } else {
          setMode('work');
          setSeconds(workDuration * 60);
        }
      } else {
        setIsRunning(false);
        if (mode === 'work') {
          setMode('break');
          setSeconds(breakDuration * 60);
        } else {
          setMode('work');
          setSeconds(workDuration * 60);
        }
      }
    }
  }, [seconds, isRunning, youtubeAlarmUrl, autoLoop, mode, workDuration, breakDuration]);

  const handleToggle = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    hasTriggeredAlarm.current = false;
    setSeconds(mode === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsRunning(false);
      hasTriggeredAlarm.current = false;
      setSeconds(mode === 'work' ? workDuration * 60 : breakDuration * 60);
    }
    setIsEditing(!isEditing);
  };

  const formatTime = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isEditing) {
    return (
      <div className="bg-dark-tertiary rounded-lg p-3 mt-1">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-dark-text-muted">Work (mins)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={workDuration}
              onChange={(e) => setWorkDuration(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-[12px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-dark-text-muted">Break (mins)</label>
            <input
              type="number"
              min="1"
              max="30"
              value={breakDuration}
              onChange={(e) => setBreakDuration(parseInt(e.target.value) || 1)}
              className="w-16 px-2 py-1 text-[12px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary focus:outline-none focus:border-accent-blue"
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-[11px] text-dark-text-muted">Auto-loop</label>
            <input
              type="checkbox"
              checked={autoLoop}
              onChange={(e) => setAutoLoop(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          <div className="pt-2 border-t border-dark-border">
            <label className="text-[11px] text-dark-text-muted mb-1.5 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
              YouTube Alarm (Optional)
            </label>
            <input
              type="url"
              value={youtubeAlarmUrl}
              onChange={(e) => setYoutubeAlarmUrl(e.target.value)}
              placeholder="Paste YouTube URL..."
              className="w-full px-2 py-1.5 text-[11px] bg-dark-secondary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
            />
            <p className="text-[10px] text-dark-text-muted mt-1">
              Opens video when timer ends
            </p>
          </div>
          <button
            onClick={handleEditToggle}
            className="w-full px-3 py-1.5 bg-accent-blue text-dark-primary rounded text-[12px] font-medium hover:bg-accent-blue/90"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <button
        onClick={handleToggle}
        onContextMenu={(e) => {
          e.preventDefault();
          handleReset();
        }}
        className="flex-1 flex items-center gap-2 px-3 py-2 bg-dark-tertiary rounded-lg text-dark-text-secondary font-mono text-[13px] hover:bg-dark-hover hover:text-dark-text-primary"
        title="Click to start/pause, right-click to reset"
      >
        <span>{isRunning ? '⏸' : '▶'}</span>
        <span className={isRunning ? (mode === 'work' ? 'text-accent-blue' : 'text-accent-green') : ''}>
          {formatTime(seconds)}
        </span>
        {mode === 'break' && <span className="text-accent-green text-[11px]">Break</span>}
        <span className="flex items-center gap-1 ml-auto">
          {youtubeAlarmUrl && (
            <span title="YouTube alarm set">
              <svg className="w-3.5 h-3.5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/>
              </svg>
            </span>
          )}
          {autoLoop && <span className="text-[10px] text-dark-text-muted">🔁</span>}
        </span>
      </button>
      <button
        onClick={handleEditToggle}
        className="w-8 h-8 flex items-center justify-center bg-dark-tertiary rounded-lg text-dark-text-muted hover:text-dark-text-primary hover:bg-dark-hover"
        title="Edit timer"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>
    </div>
  );
}
