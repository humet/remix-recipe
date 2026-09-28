'use client'

import { ChefHat, X } from 'lucide-react'
import type { CookSession } from '@/lib/cook-session'

function describe(session: CookSession): { title: string; detail: string } {
  const { flow, display } = session
  const title = display?.recipe.title ?? flow.recipe?.title ?? flow.analysis?.title ?? 'Your recipe'

  if (display?.view === 'cooking') {
    return { title, detail: `Step ${display.currentStep + 1} of ${display.recipe.steps.length}` }
  }
  const choosing = flow.kind === 'home' ? flow.appState === 'suggestions' : flow.viewState === 'suggestions'
  return { title, detail: choosing ? 'Choosing improvements' : 'Pick up where you left off' }
}

/** Shown on home when a session exists but the user navigated here in-app. */
export function ResumeCookCard({
  session,
  onResume,
  onDismiss,
}: {
  session: CookSession
  onResume: () => void
  onDismiss: () => void
}) {
  const { title, detail } = describe(session)

  return (
    <div className="px-5 pb-4">
      <div className="relative glass rounded-2xl ring-2 ring-primary/30 hover:ring-primary/50 transition-all">
        <button
          type="button"
          onClick={onResume}
          className="block w-full p-4 pr-12 text-left active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <ChefHat className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Continue cooking</span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{detail}</p>
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
