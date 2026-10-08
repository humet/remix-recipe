const CACHE_NAME = 'remix-v5'

// Registered as /sw.js?dev in development (components/sw-register.tsx). Dev
// chunk names aren't content-hashed, so caching them serves pre-edit JS on
// reload. In dev the worker caches nothing and only handles push.
const DEV = new URL(self.location.href).searchParams.has('dev')

// Deliberately does NOT include '/'. The app is behind a login, and a
// cached HTML shell would be served without ever reaching the auth gate —
// handing a signed-out visitor the authed page, or vice versa.
const APP_SHELL = [
  '/manifest.json',
  '/icon0.svg',
]

// The only things that are ever cached. Everything here is excluded from the
// proxy.ts matcher, so serving it from cache can never skip the auth gate.
// Pages, RSC payloads and API responses are always left to the network.
const HASHED_ASSET = /^\/_next\/static\//
const PUBLIC_ASSET = /^\/(?:manifest\.json|favicon\.ico|icon\d*\.(?:svg|png)|apple-icon\.png|web-app-manifest-\d+x\d+\.png|remix-logo(?:-icon)?\.svg)$/

// Install: pre-cache app shell
self.addEventListener('install', (event) => {
  if (!DEV) {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
    )
  }
  self.skipWaiting()
})

// Activate: clean old caches (all of them in dev)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => DEV || k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// App Router client-side navigations and prefetches fetch React Server
// Component payloads with mode 'cors', not 'navigate'. They carry auth-gated
// data, so they must reach proxy.ts every time.
function isRscRequest(request, url) {
  return (
    url.searchParams.has('_rsc') ||
    request.headers.has('RSC') ||
    request.headers.has('Next-Router-State-Tree') ||
    request.headers.has('Next-Router-Prefetch')
  )
}

function cacheResponse(request, response) {
  // 200 only: Cache.put rejects partial (206) responses.
  if (response.status === 200) {
    const clone = response.clone()
    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
  }
  return response
}

// Fetch: cache-first for hashed build assets, stale-while-revalidate for the
// PWA icons and manifest, and no SW involvement for anything else.
self.addEventListener('fetch', (event) => {
  if (DEV) return

  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin || request.method !== 'GET') return
  // Never cache navigations — every page load must reach the auth gate.
  if (request.mode === 'navigate' || isRscRequest(request, url)) return

  if (HASHED_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) => cached || fetch(request).then((response) => cacheResponse(request, response))
      )
    )
    return
  }

  if (PUBLIC_ASSET.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const fetchPromise = fetch(request)
          .then((response) => cacheResponse(request, response))
          .catch((err) => cached || Promise.reject(err))
        return cached || fetchPromise
      })
    )
  }
})

// Push: show notification when push arrives (app backgrounded)
// Declarative Web Push (web_push: "8030") is handled natively by Safari —
// this handler is the fallback for browsers that don't support it yet.
self.addEventListener('push', (event) => {
  let title = 'Timer Complete'
  let body = 'Your timer is done!'
  let tag = 'timer-alert'
  let url = '/'

  try {
    const raw = event.data.json()
    if (raw.web_push === '8030' && raw.notification) {
      // Declarative format reached the SW (non-Safari browser)
      title = raw.notification.title || title
      body = raw.notification.body || body
      tag = raw.notification.tag || tag
      url = raw.notification.navigate_url || url
    } else {
      title = raw.title || title
      body = raw.body || body
      tag = raw.tag || tag
    }
  } catch {
    // fallback to defaults
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/web-app-manifest-192x192.png',
      badge: '/web-app-manifest-192x192.png',
      tag,
      vibrate: [200, 100, 200, 100, 200],
      data: { url },
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
