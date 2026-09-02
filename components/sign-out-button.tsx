'use client'

import { LogOut } from 'lucide-react'
import { useDemoMode } from '@/components/providers'

export function SignOutButton() {
  const demo = useDemoMode()

  // Demo visitors get a "Sign in" link in the banner instead.
  if (demo) return null

  const handleSubmit = async () => {
    // Drop the cached static assets so a signed-out browser can't serve
    // anything from the previous session.
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch {
        // Not fatal — the SW skips navigations anyway.
      }
    }
  }

  return (
    <form action="/auth/signout" method="post" onSubmit={handleSubmit}>
      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 py-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </button>
    </form>
  )
}
