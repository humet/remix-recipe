/**
 * Browser-only mirror of the demo cookie, for callers that can't use a hook:
 * lib/data/index.ts, lib/ai/fetch.ts and the module-level helpers in
 * hooks/use-timers.ts.
 *
 * Set from <Providers> during render, guarded on `typeof window` so a demo
 * request can never leak the flag into another request's server render.
 * Server code reads the cookie directly via lib/demo/is-demo.ts instead.
 */
let demo = false

export function setDemoMode(value: boolean) {
  if (typeof window === 'undefined') return
  demo = value
}

export function isDemoMode() {
  return demo
}
