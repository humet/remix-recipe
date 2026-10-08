import type { SavedRecipe } from '@/lib/recipe-types'
import { formatDateKey } from '@/lib/meal-plan-utils'
import { DEMO_RECIPES } from './fixtures/recipes'

/**
 * localStorage-backed store for demo mode. Seeds itself from the fixtures on
 * first read, so a demo visitor can save, favourite, delete and meal-plan and
 * have it all survive a refresh — without a single request to Supabase.
 */

// Bump when the fixtures change so returning visitors get the new set.
const KEY = 'remix:demo:v2'
const LEGACY_KEYS = ['remix:demo:v1']
const MAX_RECIPES = 50

export interface DemoMealPlanRow {
  id: string
  recipe_id: string
  plan_date: string
}

interface DemoState {
  version: 1
  recipes: SavedRecipe[]
  mealPlan: DemoMealPlanRow[]
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function seed(): DemoState {
  const today = formatDateKey(new Date())
  return {
    version: 1,
    recipes: DEMO_RECIPES.map((r) => ({ ...r })),
    // Seeded at runtime, never as a literal — otherwise "tonight's dinner"
    // is empty for everyone after the first day.
    mealPlan: [
      {
        id: 'demo-plan-today',
        recipe_id: DEMO_RECIPES[0].id,
        plan_date: today,
      },
    ],
  }
}

function isFixture(id: string): boolean {
  return id.startsWith('demo-')
}

/**
 * Resolved at call time rather than via `typeof window`, which bundlers
 * statically replace — that would make the store a permanent no-op in any
 * non-browser bundle. Also covers private browsing and disabled storage.
 */
function getStorage(): Pick<Storage, 'getItem' | 'setItem'> | null {
  try {
    const storage = globalThis.localStorage
    return storage ?? null
  } catch {
    return null
  }
}

export function read(): DemoState {
  const storage = getStorage()
  if (!storage) return seed()

  try {
    const raw = storage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState
      if (parsed?.version === 1 && Array.isArray(parsed.recipes)) {
        return parsed
      }
    }
  } catch {
    // Corrupt or unavailable — fall through and reseed.
  }

  const fresh = seed()
  write(fresh)
  for (const legacy of LEGACY_KEYS) {
    try {
      globalThis.localStorage?.removeItem(legacy)
    } catch {
      // Best effort — a stale key is only wasted space.
    }
  }
  return fresh
}

export function write(state: DemoState) {
  const storage = getStorage()
  if (!storage) return

  // Recipe payloads are multi-KB. Cap the store so an enthusiastic demo
  // visitor can't fill the quota, dropping their oldest own-saved recipes
  // first and never the seeded fixtures.
  if (state.recipes.length > MAX_RECIPES) {
    const own = state.recipes.filter((r) => !isFixture(r.id))
    const fixtures = state.recipes.filter((r) => isFixture(r.id))
    const keep = own.slice(0, MAX_RECIPES - fixtures.length)
    state = { ...state, recipes: [...keep, ...fixtures] }
  }

  try {
    storage.setItem(KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded or storage disabled. Degrade rather than throw inside a
    // click handler — the current session still has the in-memory result.
  }
}

export function mutate(fn: (state: DemoState) => DemoState) {
  write(fn(read()))
}

export { newId, isFixture }
