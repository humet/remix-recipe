'use client'

import { useEffect, useState } from 'react'
import { ChefHat, Sparkles, Scale, BookOpen } from 'lucide-react'

type ProcessingType = 'analyzing' | 'improving' | 'scaling'

interface ProcessingOverlayProps {
  type: ProcessingType
  isVisible: boolean
}

const processingConfig: Record<ProcessingType, {
  icon: typeof ChefHat
  title: string
  messages: string[]
}> = {
  analyzing: {
    icon: BookOpen,
    title: 'Analyzing Recipe',
    messages: [
      'Reading your recipe...',
      'Identifying ingredients...',
      'Understanding the method...',
      'Finding improvement opportunities...',
      'Crafting suggestions...',
    ],
  },
  improving: {
    icon: Sparkles,
    title: 'Improving Recipe',
    messages: [
      'Applying your improvements...',
      'Enhancing flavors...',
      'Optimizing techniques...',
      'Adding inline measurements...',
      'Polishing instructions...',
      'Almost ready...',
    ],
  },
  scaling: {
    icon: Scale,
    title: 'Scaling Recipe',
    messages: [
      'Calculating new quantities...',
      'Adjusting measurements...',
      'Checking cooking times...',
      'Finalizing recipe...',
    ],
  },
}

export function ProcessingOverlay({ type, isVisible }: ProcessingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const [dots, setDots] = useState('')
  const config = processingConfig[type]
  const Icon = config.icon

  // Cycle through messages
  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % config.messages.length)
    }, 2500)

    return () => clearInterval(interval)
  }, [isVisible, config.messages.length])

  // Animate dots
  useEffect(() => {
    if (!isVisible) {
      setDots('')
      return
    }

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'))
    }, 400)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 p-8 max-w-sm text-center">
        {/* Animated Icon Container */}
        <div className="relative">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
          
          {/* Spinning border */}
          <div className="relative h-20 w-20 rounded-full">
            <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
            <div 
              className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"
              style={{ animationDuration: '1.5s' }}
            />
            
            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Icon className="h-8 w-8 text-primary" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h2 className="font-serif text-xl text-foreground">
          {config.title}{dots}
        </h2>

        {/* Rotating message */}
        <div className="h-12 flex items-center">
          <p 
            key={messageIndex}
            className="text-muted-foreground animate-fade-in"
          >
            {config.messages[messageIndex]}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full animate-progress"
          />
        </div>

        {/* Reassurance text */}
        <p className="text-xs text-muted-foreground/70">
          This usually takes 10-20 seconds
        </p>
      </div>
    </div>
  )
}
