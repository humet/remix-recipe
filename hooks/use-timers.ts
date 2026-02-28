'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface Timer {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
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

export function useTimers() {
  const [timers, setTimers] = useState<Timer[]>([])
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context on client side
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])
  
  // Request wake lock when timers are running
  useEffect(() => {
    const requestWakeLock = async () => {
      if ('wakeLock' in navigator && timers.some(t => t.isRunning)) {
        try {
          await (navigator as any).wakeLock.request('screen')
        } catch (err) {
          // Wake lock not available
        }
      }
    }
    requestWakeLock()
  }, [timers])

  // Main timer tick
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    const hasRunningTimers = timers.some(t => t.isRunning && !t.isComplete)
    
    if (hasRunningTimers) {
      intervalRef.current = setInterval(() => {
        setTimers(prev => prev.map(timer => {
          if (!timer.isRunning || timer.isComplete) return timer
          
          const newRemaining = timer.remainingSeconds - 1
          
          if (newRemaining <= 0) {
            // Timer complete - play sound and notify
            playAlert(timer.label)
            return { ...timer, remainingSeconds: 0, isComplete: true, isRunning: false }
          }
          
          return { ...timer, remainingSeconds: newRemaining }
        }))
      }, 1000)
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [timers])

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
        icon: '/icon.svg',
        tag: 'timer-alert',
      })
    }
  }, [])

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

  const addTimer = useCallback((label: string, timeString: string) => {
    const seconds = parseTimeString(timeString)
    if (seconds <= 0) return null

    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTimer: Timer = {
      id,
      label,
      totalSeconds: seconds,
      remainingSeconds: seconds,
      isRunning: true,
      isComplete: false,
    }

    setTimers(prev => [...prev, newTimer])
    return id
  }, [])

  const pauseTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, isRunning: false } : t
    ))
  }, [])

  const resumeTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id && !t.isComplete ? { ...t, isRunning: true } : t
    ))
  }, [])

  const removeTimer = useCallback((id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id))
  }, [])

  const clearCompletedTimers = useCallback(() => {
    setTimers(prev => prev.filter(t => !t.isComplete))
  }, [])

  const resetTimer = useCallback((id: string) => {
    setTimers(prev => prev.map(t => 
      t.id === id ? { ...t, remainingSeconds: t.totalSeconds, isComplete: false, isRunning: true } : t
    ))
  }, [])

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
