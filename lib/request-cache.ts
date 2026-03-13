const cache = new Map<string, { data: unknown; expires: number }>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry || Date.now() > entry.expires) {
    cache.delete(key)
    return null
  }
  return entry.data as T
}

export function setCache(key: string, data: unknown, ttlMs = 5 * 60 * 1000) {
  cache.set(key, { data, expires: Date.now() + ttlMs })
}

export function cacheKey(route: string, params: Record<string, unknown>): string {
  return `${route}:${JSON.stringify(params)}`
}

export function invalidateCache(prefix?: string) {
  if (!prefix) { cache.clear(); return }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
