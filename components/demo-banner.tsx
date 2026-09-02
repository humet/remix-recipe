'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Sparkles, X } from 'lucide-react'

/**
 * Rendered as a static strip at the top of the tree (not fixed), so it pushes
 * content down instead of fighting the sticky headers and the TimerBar.
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="glass-strong border-b border-border/50">
      <div className="px-5 py-2.5 flex items-center gap-3">
        <Sparkles className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-foreground flex-1 leading-snug">
          <span className="font-semibold">Demo mode.</span>{' '}
          <span className="text-muted-foreground">
            Sample recipes, saved in this browser only.
          </span>
        </p>
        <Link
          href="/login"
          className="text-xs font-semibold text-primary hover:underline shrink-0"
        >
          Sign in
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss demo notice"
          className="h-6 w-6 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
