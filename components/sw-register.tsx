'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { urlBase64ToUint8Array } from '@/lib/push-utils'

export interface PushState {
  subscription: PushSubscription | null
  isSupported: boolean
  permission: NotificationPermission | 'unsupported'
  subscribe: () => Promise<PushSubscription | null>
}

export function useServiceWorker(): PushState {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')
  const swRef = useRef<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return
    }
    setIsSupported(true)
    setPermission(Notification.permission)

    navigator.serviceWorker
      .register('/sw.js')
      .then(async (registration) => {
        swRef.current = registration
        // Check for existing subscription
        const existing = await registration.pushManager.getSubscription()
        if (existing) {
          setSubscription(existing)
        }
      })
      .catch((err) => {
        console.error('SW registration failed:', err)
      })
  }, [])

  const subscribe = useCallback(async (): Promise<PushSubscription | null> => {
    if (!swRef.current) return null

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      console.error('VAPID public key not configured')
      return null
    }

    try {
      const result = await Notification.requestPermission()
      setPermission(result)
      if (result !== 'granted') return null

      const sub = await swRef.current.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
      setSubscription(sub)
      return sub
    } catch (err) {
      console.error('Push subscription failed:', err)
      return null
    }
  }, [])

  return { subscription, isSupported, permission, subscribe }
}
