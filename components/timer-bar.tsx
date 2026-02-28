'use client'

import { Timer, formatTime } from '@/hooks/use-timers'
import { Play, Pause, X, RotateCcw, ChevronUp, ChevronDown, Timer as TimerIcon } from 'lucide-react'
import { useState } from 'react'

interface TimerBarProps {
  timers: Timer[]
  addTimer: (label: string, timeString: string) => string | null
  pauseTimer: (id: string) => void
  resumeTimer: (id: string) => void
  removeTimer: (id: string) => void
  resetTimer: (id: string) => void
  clearCompletedTimers: () => void
  activeCount: number
  completedCount: number
}

export function TimerBar({ timers, pauseTimer, resumeTimer, removeTimer, resetTimer }: TimerBarProps) {
  const [expanded, setExpanded] = useState(false)
  
  if (timers.length === 0) return null

  const activeTimers = timers.filter(t => !t.isComplete)
  const completedTimers = timers.filter(t => t.isComplete)
  const hasCompleted = completedTimers.length > 0

  // Get the most urgent timer (lowest remaining time that's still running)
  const urgentTimer = activeTimers
    .filter(t => t.isRunning)
    .sort((a, b) => a.remainingSeconds - b.remainingSeconds)[0]

  return (
    <div className="fixed bottom-24 left-4 right-4 z-40 flex flex-col gap-2">
      {/* Expanded view - all timers */}
      {expanded && (
        <div className="glass-strong rounded-2xl p-3 animate-slide-up max-h-60 overflow-y-auto">
          <div className="flex flex-col gap-2">
            {timers.map(timer => (
              <div 
                key={timer.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  timer.isComplete 
                    ? 'bg-accent/20 animate-pulse' 
                    : 'bg-primary/5'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{timer.label}</p>
                  <p className={`text-2xl font-bold tabular-nums ${
                    timer.isComplete ? 'text-accent' : 
                    timer.remainingSeconds <= 60 ? 'text-destructive' : 'text-primary'
                  }`}>
                    {timer.isComplete ? 'Done!' : formatTime(timer.remainingSeconds)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {timer.isComplete ? (
                    <button
                      onClick={() => resetTimer(timer.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl glass text-foreground"
                      aria-label="Restart timer"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => timer.isRunning ? pauseTimer(timer.id) : resumeTimer(timer.id)}
                      className="h-10 w-10 flex items-center justify-center rounded-xl glass text-foreground"
                      aria-label={timer.isRunning ? 'Pause timer' : 'Resume timer'}
                    >
                      {timer.isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    </button>
                  )}
                  <button
                    onClick={() => removeTimer(timer.id)}
                    className="h-10 w-10 flex items-center justify-center rounded-xl glass text-muted-foreground hover:text-destructive"
                    aria-label="Remove timer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed bar - summary */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`glass-strong rounded-2xl p-3 flex items-center gap-3 w-full text-left ${
          hasCompleted ? 'animate-pulse ring-2 ring-accent' : ''
        }`}
      >
        <div className={`h-10 w-10 flex items-center justify-center rounded-xl ${
          hasCompleted ? 'bg-accent/20' : 'bg-primary/10'
        }`}>
          <TimerIcon className={`h-5 w-5 ${hasCompleted ? 'text-accent' : 'text-primary'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          {hasCompleted ? (
            <p className="text-sm font-semibold text-accent">
              {completedTimers.length} timer{completedTimers.length > 1 ? 's' : ''} done!
            </p>
          ) : urgentTimer ? (
            <>
              <p className="text-xs text-muted-foreground truncate">{urgentTimer.label}</p>
              <p className={`text-lg font-bold tabular-nums ${
                urgentTimer.remainingSeconds <= 60 ? 'text-destructive' : 'text-foreground'
              }`}>
                {formatTime(urgentTimer.remainingSeconds)}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {timers.length} timer{timers.length > 1 ? 's' : ''} paused
            </p>
          )}
        </div>

        {timers.length > 1 && (
          <span className="text-xs text-muted-foreground px-2 py-1 glass rounded-lg">
            {timers.length}
          </span>
        )}
        
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}
