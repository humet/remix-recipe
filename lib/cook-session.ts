import type { ImprovedRecipe, RecipeAnalysis } from '@/lib/recipe-types'
import type { Timer } from '@/hooks/use-timers'
import { isDemoMode } from '@/lib/demo/mode'

/**
 * Remembers where the user is — flow state, cooking progress and timers — so
 * a relaunch after iOS evicts the backgrounded PWA puts them back mid-cook
 * instead of on an empty home screen.
 *
 * One session at a time, in localStorage, namespaced by demo/live so the two
 * never restore into each other. Cleared by the Home button and sign-out, and
 * dropped once it's older than a day.
 */

const KEY_PREFIX = 'remix:cook-session:v1'
const TTL_MS = 24 * 60 * 60 * 1000

/** The home page's state machine (`app/page.tsx`). */
export interface HomeFlow {
  kind: 'home'
  appState: 'suggestions' | 'result'
  analysis: RecipeAnalysis | null
  recipe: ImprovedRecipe | null
  savedRecipeId?: string
  originalInput?: string
  isReimproved: boolean
  improveFromRecipe: string | null
  previousRecipe: ImprovedRecipe | null
}

/** The saved recipe page's state machine (`app/recipe/[id]`). */
export interface SavedFlow {
  kind: 'saved'
  recipeId: string
  viewState: 'display' | 'suggestions'
  recipe: ImprovedRecipe
  analysis: RecipeAnalysis | null
  isReimproved: boolean
  improveFromRecipe: string | null
  previousRecipe: ImprovedRecipe | null
  currentSavedId: string
}

/** RecipeDisplay's own state, tied to the recipe it was mounted with. */
export interface DisplaySnapshot {
  baseKey: string
  recipe: ImprovedRecipe
  view: 'overview' | 'cooking'
  currentStep: number
  completedSteps: number[]
  targetServings: number
  currentScaledServings: number
  scalingNotes: string[] | null
  swapNotes: string[]
  isSaved: boolean
  currentSavedId?: string
}

// remainingSeconds is derived from endsAt on every tick, so it isn't stored.
export type PersistedTimer = Omit<Timer, 'remainingSeconds'>

export interface CookSession {
  version: 1
  updatedAt: number
  flow: HomeFlow | SavedFlow
  display?: DisplaySnapshot
  timers?: PersistedTimer[]
}

function key(demo = isDemoMode()) {
  return `${KEY_PREFIX}:${demo ? 'demo' : 'live'}`
}

// Same call-time lookup as lib/demo/store.ts — covers private browsing and
// disabled storage.
function getStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export function readCookSession(): CookSession | null {
  const storage = getStorage()
  if (!storage) return null

  try {
    const raw = storage.getItem(key())
    if (!raw) return null
    const parsed = JSON.parse(raw) as CookSession
    if (parsed?.version === 1 && parsed.flow && Date.now() - parsed.updatedAt < TTL_MS) {
      return parsed
    }
  } catch {
    // Corrupt — fall through and drop it.
  }

  clearCookSession()
  return null
}

function write(session: CookSession) {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.setItem(key(), JSON.stringify({ ...session, updatedAt: Date.now() }))
  } catch {
    // Quota exceeded or storage disabled. Restore is best-effort.
  }
}

/**
 * Starts or updates the session. A flow for a different recipe replaces the
 * old session outright, so its cooking progress and timers can't leak across.
 */
export function writeCookFlow(flow: HomeFlow | SavedFlow) {
  const existing = readCookSession()
  const sameSession =
    existing &&
    existing.flow.kind === flow.kind &&
    (flow.kind === 'home' || (existing.flow as SavedFlow).recipeId === flow.recipeId)

  write(sameSession ? { ...existing, flow } : { version: 1, updatedAt: Date.now(), flow })
}

// Display and timer writes only ever update an existing session. After the
// Home button clears it, a still-mounted RecipeDisplay can't resurrect it.
export function writeCookDisplay(display: DisplaySnapshot) {
  const existing = readCookSession()
  if (existing) write({ ...existing, display })
}

let lastTimers: string | null = null

export function writeCookTimers(timers: Timer[]) {
  const persisted: PersistedTimer[] = timers.map(({ remainingSeconds: _, ...t }) => t)
  // The 1s tick changes remainingSeconds only, so most calls are no-ops.
  const serialised = JSON.stringify(persisted)
  if (serialised === lastTimers) return

  const existing = readCookSession()
  if (!existing) return
  lastTimers = serialised
  write({ ...existing, timers: persisted })
}

export function readCookTimers(): Timer[] {
  const timers = readCookSession()?.timers ?? []
  lastTimers = JSON.stringify(timers)
  return timers.map((t) => ({
    ...t,
    remainingSeconds: t.pausedRemaining ?? Math.max(0, Math.round((t.endsAt - Date.now()) / 1000)),
  }))
}

export function clearCookSession() {
  lastTimers = null
  try {
    getStorage()?.removeItem(key())
  } catch {
    // Nothing to clear.
  }
}

/** Sign-out clears both namespaces so a shared device starts clean. */
export function clearAllCookSessions() {
  lastTimers = null
  try {
    const storage = getStorage()
    storage?.removeItem(key(true))
    storage?.removeItem(key(false))
  } catch {
    // Nothing to clear.
  }
}

/** Cheap, stable fingerprint of a recipe, to match a snapshot to its recipe. */
export function recipeKey(recipe: ImprovedRecipe): string {
  const s = JSON.stringify(recipe)
  let h = 5381
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) | 0
  }
  return `${s.length}:${h >>> 0}`
}

export function matchingDisplay(
  session: CookSession | null,
  recipe: ImprovedRecipe,
): DisplaySnapshot | undefined {
  const display = session?.display
  return display && display.baseKey === recipeKey(recipe) ? display : undefined
}

let launchHandled = false

/**
 * True the first time it's asked in a document that was loaded at `/` (or
 * `/login`, which lands on `/` after a session expiry) — an app relaunch or
 * reload. False after that, so navigating back to home inside the app offers
 * a resume card instead of yanking the user somewhere.
 */
export function consumeFreshLaunch(): boolean {
  if (launchHandled) return false
  launchHandled = true

  try {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const path = entry ? new URL(entry.name).pathname : window.location.pathname
    return path === '/' || path === '/login'
  } catch {
    return false
  }
}
