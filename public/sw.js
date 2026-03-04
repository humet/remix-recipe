const CACHE_NAME = 'remix-v1'
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/apple-icon.png',
]

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  )
  self.skipWaiting()
})

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Fetch: stale-while-revalidate for app shell, network-only for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Network-only for API routes and non-GET
  if (url.pathname.startsWith('/api') || event.request.method !== 'GET') {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        })
        .catch(() => cached)

      return cached || fetchPromise
    })
  )
})

// Push: show notification when push arrives (app backgrounded)
self.addEventListener('push', (event) => {
  let data = { title: 'Timer Complete', body: 'Your timer is done!' }
  try {
    data = event.data.json()
  } catch {
    // fallback to defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'timer-alert',
      vibrate: [200, 100, 200, 100, 200],
      data: { url: '/' },
      requireInteraction: true,
    })
  )
})

// Notification click: focus or open the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
