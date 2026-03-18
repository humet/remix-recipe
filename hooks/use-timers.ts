'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface Timer {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  endsAt: number // wall-clock timestamp (ms) when timer should complete
  pausedRemaining?: number // seconds left when paused (to resume from)
  isRunning: boolean
  isComplete: boolean
}

// Create beep sound using Web Audio API
function createBeepSound(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.frequency.value = 880 // A5 note
  oscillator.type = 'sine'

  const now = audioContext.currentTime
  gainNode.gain.setValueAtTime(0, now)

  // Three beeps
  for (let i = 0; i < 3; i++) {
    const beepStart = now + i * 0.35
    gainNode.gain.linearRampToValueAtTime(0.5, beepStart + 0.02)
    gainNode.gain.linearRampToValueAtTime(0.5, beepStart + 0.18)
    gainNode.gain.linearRampToValueAtTime(0, beepStart + 0.2)
  }

  oscillator.start(now)
  oscillator.stop(now + 1.1)
}

// --- Push notification helpers ---

function schedulePush(timerId: string, label: string, seconds: number, subscription: PushSubscription | null) {
  if (!subscription) return
  const fireAt = new Date(Date.now() + seconds * 1000).toISOString()
  fetch('/api/timer-push/schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timerId, label, fireAt, subscription: subscription.toJSON() }),
  }).catch((err) => console.error('Failed to schedule push:', err))
}

function cancelPush(timerId: string) {
  fetch('/api/timer-push/cancel', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ timerId }),
  }).catch((err) => console.error('Failed to cancel push:', err))
}

export function useTimers(pushSubscription?: PushSubscription | null) {
  const [timers, setTimers] = useState<Timer[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)
  const playAlertRef = useRef<(label: string) => void>(() => {})

  const hasRunningTimers = timers.some(t => t.isRunning && !t.isComplete)

  // Wake lock management
  useEffect(() => {
    const requestWakeLock = async () => {
      if (!('wakeLock' in navigator)) return
      if (hasRunningTimers && !wakeLockRef.current) {
        try {
          const sentinel = await navigator.wakeLock.request('screen')
          wakeLockRef.current = sentinel
          sentinel.addEventListener('release', () => {
            wakeLockRef.current = null
          })
        } catch {
          // Wake lock not available
        }
      } else if (!hasRunningTimers && wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }

    requestWakeLock()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && hasRunningTimers && !wakeLockRef.current) {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (!hasRunningTimers && wakeLockRef.current) {
        wakeLockRef.current.release()
        wakeLockRef.current = null
      }
    }
  }, [hasRunningTimers])

  // Wall-clock tick function — self-contained, no stale closures
  const tick = useCallback(() => {
    setTimers(prev => {
      let changed = false
      const next = prev.map(timer => {
        if (!timer.isRunning || timer.isComplete) return timer

        const newRemaining = Math.round((timer.endsAt - Date.now()) / 1000)

        if (newRemaining <= 0) {
          changed = true
          playAlertRef.current(timer.label)
          cancelPush(timer.id)
          return { ...timer, remainingSeconds: 0, isComplete: true, isRunning: false }
        }

        if (newRemaining !== timer.remainingSeconds) {
          changed = true
          return { ...timer, remainingSeconds: newRemaining }
        }

        return timer
      })
      // Return same reference if nothing changed — prevents unnecessary re-renders
      return changed ? next : prev
    })
  }, [])

  // Start/stop interval only when running state changes (not every tick)
  useEffect(() => {
    if (hasRunningTimers) {
      // Tick immediately to sync, then every second
      tick()
      intervalRef.current = setInterval(tick, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [hasRunningTimers, tick])

  // Re-sync immediately when app comes back to foreground
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        tick()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [tick])

  const playAlert = useCallback((label: string) => {
    // Play sound using Web Audio API
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      createBeepSound(audioContextRef.current)
    } catch (err) {
      // Audio not available
    }

    // Vibrate if supported
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 200])
    }

    // Send notification if permitted and page is not visible
    if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
      new Notification('Timer Complete', {
        body: `${label} is done!`,
        icon: '/web-app-manifest-192x192.png',
        tag: 'timer-alert',
      })
    }
  }, [])
  playAlertRef.current = playAlert

  const parseTimeString = (timeStr: string): number => {
    // Parse various time formats: "5 minutes", "5-7 minutes", "1 hour", "30 seconds", "1h 30m"
    const lower = timeStr.toLowerCase()
    let totalSeconds = 0

    // Handle range (take the first/lower value)
    const rangeMatch = lower.match(/(\d+)\s*-\s*\d+/)
    const singleMatch = lower.match(/(\d+)/)

    const mainNumber = rangeMatch ? parseInt(rangeMatch[1]) : (singleMatch ? parseInt(singleMatch[1]) : 0)

    if (lower.includes('hour') || lower.includes('hr') || lower.includes('h')) {
      totalSeconds += mainNumber * 3600
      // Check for additional minutes
      const minMatch = lower.match(/(\d+)\s*(?:min|m(?!onth))/i)
      if (minMatch) {
        totalSeconds += parseInt(minMatch[1]) * 60
      }
    } else if (lower.includes('min') || lower.includes('m')) {
      totalSeconds = mainNumber * 60
    } else if (lower.includes('sec') || lower.includes('s')) {
      totalSeconds = mainNumber
    } else {
      // Default to minutes if no unit specified
      totalSeconds = mainNumber * 60
    }

    return totalSeconds
  }

  const addTimer = useCallback((label: string, timeString: string, subscriptionOverride?: PushSubscription | null) => {
    const seconds = parseTimeString(timeString)
    if (seconds <= 0) return null

    // Request notification permission on first timer start (higher grant rate)
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTimer: Timer = {
      id,
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      endsAt: Date.now() + seconds * 1000,
      isRunning: true,
      isComplete: false,
    }

    setTimers(prev => [...prev, newTimer])

    // Schedule push notification — prefer override (from fresh subscribe) over stale closure value
    const sub = subscriptionOverride ?? pushSubscription ?? null
    schedulePush(id, label, seconds, sub)

    return id
  }, [pushSubscription])

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t
      const remaining = Math.max(0, Math.round((t.endsAt - Date.now()) / 1000))
      return { ...t, isRunning: false, remainingSeconds: remaining, pausedRemaining: remaining }
    }))
    cancelPush(id)
  }, [])

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev => {
      const updated = prev.map(t => {
        if (t.id !== id || t.isComplete) return t
        const remaining = t.pausedRemaining ?? t.remainingSeconds
        return { ...t, isRunning: true, endsAt: Date.now() + remaining * 1000, pausedRemaining: undefined }
      })
      const timer = updated.find(t => t.id === id)
      if (timer && timer.isRunning) {
        schedulePush(id, timer.label, timer.remainingSeconds, pushSubscription ?? null)
      }
      return updated
    })
  }, [pushSubscription])

  const removeTimer = useCallback((id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id))
    cancelPush(id)
  }, [])

  const clearCompletedTimers = useCallback(() => {
    // Cancel pushes for completed timers (likely already cancelled, but be safe)
    timers.filter(t => t.isComplete).forEach(t => cancelPush(t.id))
    setTimers(prev => prev.filter(t => !t.isComplete))
  }, [timers])

  const resetTimer = useCallback((id: string) => {
    setTimers(prev => {
      const updated = prev.map(t =>
        t.id === id ? { ...t, remainingSeconds: t.totalSeconds, endsAt: Date.now() + t.totalSeconds * 1000, isComplete: false, isRunning: true, pausedRemaining: undefined } : t
      )
      const timer = updated.find(t => t.id === id)
      if (timer) {
        schedulePush(id, timer.label, timer.totalSeconds, pushSubscription ?? null)
      }
      return updated
    })
  }, [pushSubscription])

  return {
    timers,
    addTimer,
    pauseTimer,
    resumeTimer,
    removeTimer,
    clearCompletedTimers,
    resetTimer,
    activeCount: timers.filter(t => t.isRunning && !t.isComplete).length,
    completedCount: timers.filter(t => t.isComplete).length,
  }
}

export function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
