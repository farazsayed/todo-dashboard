import { useState, useEffect } from 'react';

export function TimezoneTool() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [centralInput, setCentralInput] = useState('');
  const [convertedTimes, setConvertedTimes] = useState<{ east: string; west: string } | null>(null);
  const [showConverter, setShowConverter] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format time for a specific timezone
  const formatTimeForZone = (date: Date, timeZone: string): string => {
    return date.toLocaleTimeString('en-US', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const eastTime = formatTimeForZone(currentTime, 'America/New_York');
  const westTime = formatTimeForZone(currentTime, 'America/Los_Angeles');

  // Convert Central time input to East/West
  const handleConvert = () => {
    if (!centralInput.trim()) {
      setConvertedTimes(null);
      return;
    }

    // Parse the input time (expecting HH:MM format, 12-hour or 24-hour)
    let hours: number;
    let minutes: number;
    let isPM = false;

    // Try to parse various formats
    const input = centralInput.trim().toLowerCase();

    // Check for AM/PM
    if (input.includes('am') || input.includes('pm')) {
      isPM = input.includes('pm');
      const timeStr = input.replace(/[ap]m/i, '').trim();
      const parts = timeStr.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1] || '0', 10);

      // Convert to 24-hour
      if (isPM && hours !== 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      // 24-hour format
      const parts = input.split(':');
      hours = parseInt(parts[0], 10);
      minutes = parseInt(parts[1] || '0', 10);
    }

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setConvertedTimes(null);
      return;
    }

    // Central is UTC-6 (CST) or UTC-5 (CDT)
    // East is UTC-5 (EST) or UTC-4 (EDT) - 1 hour ahead of Central
    // West is UTC-8 (PST) or UTC-7 (PDT) - 2 hours behind Central

    const eastHours = hours + 1;
    const westHours = hours - 2;

    const formatConverted = (h: number, m: number): string => {
      let adjustedHours = h;
      if (adjustedHours >= 24) adjustedHours -= 24;
      if (adjustedHours < 0) adjustedHours += 24;

      const period = adjustedHours >= 12 ? 'PM' : 'AM';
      const displayHours = adjustedHours > 12 ? adjustedHours - 12 : (adjustedHours === 0 ? 12 : adjustedHours);
      return `${displayHours}:${m.toString().padStart(2, '0')} ${period}`;
    };

    setConvertedTimes({
      east: formatConverted(eastHours, minutes),
      west: formatConverted(westHours, minutes),
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConvert();
    }
  };

  return (
    <div className="p-4 border-t border-dark-border">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-dark-text-muted mb-3">
        Time Zones
      </div>

      {/* Current times */}
      <div className="space-y-2 mb-3">
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-dark-text-secondary">East Coast</span>
          <span className="text-[13px] text-dark-text-primary font-mono">{eastTime}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[12px] text-dark-text-secondary">West Coast</span>
          <span className="text-[13px] text-dark-text-primary font-mono">{westTime}</span>
        </div>
      </div>

      {/* Converter toggle */}
      <button
        onClick={() => setShowConverter(!showConverter)}
        className="w-full flex items-center justify-between px-2 py-1.5 text-[11px] text-dark-text-muted hover:text-dark-text-primary rounded hover:bg-dark-tertiary"
      >
        <span>Convert Central Time</span>
        <svg
          className={`w-3 h-3 transition-transform ${showConverter ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Converter */}
      {showConverter && (
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={centralInput}
              onChange={(e) => setCentralInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., 2:30 PM"
              className="flex-1 px-2 py-1.5 text-[12px] bg-dark-tertiary border border-dark-border rounded text-dark-text-primary placeholder-dark-text-muted focus:outline-none focus:border-accent-blue"
            />
            <button
              onClick={handleConvert}
              className="px-2 py-1.5 text-[11px] bg-accent-blue text-white rounded hover:bg-accent-blue/90"
            >
              Convert
            </button>
          </div>

          {convertedTimes && (
            <div className="bg-dark-tertiary rounded p-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-dark-text-muted">East Coast:</span>
                <span className="text-dark-text-primary font-mono">{convertedTimes.east}</span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-dark-text-muted">West Coast:</span>
                <span className="text-dark-text-primary font-mono">{convertedTimes.west}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
