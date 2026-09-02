import { isDemoMode } from '@/lib/demo/mode'
import { supabaseMealPlan, supabaseRecipes } from './supabase-backend'
import { demoMealPlan, demoRecipes } from './demo-backend'
import type { RecipeWrite } from './types'

/**
 * The only place the app decides between Supabase and the demo store.
 *
 * Dispatch happens per call, not at module load — the module can be evaluated
 * during SSR before <Providers> has set the demo flag.
 */
const recipes = () => (isDemoMode() ? demoRecipes : supabaseRecipes)
const mealPlan = () => (isDemoMode() ? demoMealPlan : supabaseMealPlan)

export const listRecipes = () => recipes().list()
export const getRecipe = (id: string) => recipes().get(id)
export const createRecipe = (input: RecipeWrite) => recipes().create(input)
export const updateRecipe = (id: string, input: RecipeWrite) => recipes().update(id, input)
export const setFavorite = (id: string, value: boolean) => recipes().setFavorite(id, value)
export const deleteRecipe = (id: string) => recipes().remove(id)
export const touchRecipe = (id: string) => recipes().touch(id)

export const listEntriesBetween = (startKey: string, endKey: string) =>
  mealPlan().listBetween(startKey, endKey)
export const getEntryForDate = (dateKey: string) => mealPlan().getForDate(dateKey)
export const assignDay = (dateKey: string, recipeId: string) =>
  mealPlan().assign(dateKey, recipeId)
export const clearEntry = (entryId: string) => mealPlan().clear(entryId)

/** Collects every tag in use, so the AI can reuse existing ones. */
export async function listRecipeTags(): Promise<string[]> {
  const rows = await listRecipes()
  const tags = new Set<string>()
  for (const row of rows) {
    for (const tag of row.recipe_data?.tags ?? []) {
      tags.add(tag)
    }
  }
  return Array.from(tags)
}

export type { RecipeListRow, RecipeWrite } from './types'
