'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * The app runs as an installed PWA with no browser chrome, so in-app back
 * buttons are the only way back. They should return to wherever the user
 * came from — but only if that's inside the app, never out of it.
 */

const KEY = 'remix:has-in-app-history'

type NavigationLike = { currentEntry?: { index: number } | null }

export function canGoBackInApp(): boolean {
  // The Navigation API only lists same-origin entries, so index > 0 means a
  // previous page of this app is right behind us.
  const nav = (globalThis as { navigation?: NavigationLike }).navigation
  if (nav?.currentEntry) return nav.currentEntry.index > 0

  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Fallback for browsers without the Navigation API: note once any client navigation has happened. */
export function useTrackInAppHistory() {
  const pathname = usePathname()
  const first = useRef<string | null>(null)

  useEffect(() => {
    if (first.current === null) {
      first.current = pathname
      return
    }
    if (pathname !== first.current) {
      try {
        sessionStorage.setItem(KEY, '1')
      } catch {
        // Storage unavailable; back buttons fall back to their default route.
      }
    }
  }, [pathname])
}
