'use client'

import { createContext, useContext } from 'react'
import { useServiceWorker, type PushState } from '@/components/sw-register'
import { setDemoMode } from '@/lib/demo/mode'
import { DemoBanner } from '@/components/demo-banner'

const PushContext = createContext<PushState>({
  subscription: null,
  isSupported: false,
  permission: 'unsupported',
  subscribe: async () => null,
})

const DemoContext = createContext(false)

export function usePush() {
  return useContext(PushContext)
}

export function useDemoMode() {
  return useContext(DemoContext)
}

export function Providers({
  children,
  demo = false,
}: {
  children: React.ReactNode
  demo?: boolean
}) {
  // Set during render, before any child effect runs, so non-React callers
  // can read it synchronously. No-ops on the server.
  setDemoMode(demo)

  const pushState = useServiceWorker()

  return (
    <DemoContext.Provider value={demo}>
      <PushContext.Provider value={pushState}>
        {demo && <DemoBanner />}
        {children}
      </PushContext.Provider>
    </DemoContext.Provider>
  )
}
