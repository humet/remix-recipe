import 'server-only'
import { createClient } from '@/lib/supabase/server'
import type { SavedRecipe } from '@/lib/recipe-types'

/**
 * Server-side reads for the two server components. There is deliberately no
 * demo branch here: demo mode is short-circuited before these are called
 * (see app/recipe/[id]/page.tsx and app/todays-dinner/page.tsx), because in
 * demo the browser's localStorage is the only source of truth.
 */

export async function getRecipeForPage(id: string): Promise<SavedRecipe | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('saved_recipes')
    .select('id, title, recipe_data, original_input, original_analysis')
    .eq('id', id)
    .single()

  if (error || !data) return null
  return data as unknown as SavedRecipe
}

export async function touchRecipeOnServer(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('saved_recipes')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id)
}

export async function getPlannedRecipeId(dateKey: string): Promise<string | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('meal_plan_entries')
    .select('recipe_id')
    .eq('plan_date', dateKey)
    .maybeSingle()

  return (data?.recipe_id as string | undefined) ?? null
}
