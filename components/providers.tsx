'use client'

import { createContext, useContext } from 'react'
import { useServiceWorker, type PushState } from '@/components/sw-register'

const PushContext = createContext<PushState>({
  subscription: null,
  isSupported: false,
  permission: 'unsupported',
  subscribe: async () => null,
})

export function usePush() {
  return useContext(PushContext)
}

export function Providers({ children }: { children: React.ReactNode }) {
  const pushState = useServiceWorker()

  return (
    <PushContext.Provider value={pushState}>
      {children}
    </PushContext.Provider>
  )
}
