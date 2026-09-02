import { createClient } from '@/lib/supabase/client'
import type { MealPlanEntry, SavedRecipe } from '@/lib/recipe-types'
import type {
  MealPlanBackend,
  RecipeBackend,
  RecipeListRow,
  RecipeWrite,
} from './types'

const LIST_COLUMNS = 'id, title, recipe_data, created_at, is_favorite, last_opened_at'
const ENTRY_COLUMNS = 'id, recipe_id, plan_date, saved_recipes(id, title, recipe_data)'

type EntryRow = {
  id: string
  recipe_id: string
  plan_date: string
  saved_recipes: unknown
}

function toEntry(row: EntryRow): MealPlanEntry | null {
  const recipe = row.saved_recipes as unknown as MealPlanEntry['recipe']
  if (!recipe) return null
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    plan_date: row.plan_date,
    recipe,
  }
}

export const supabaseRecipes: RecipeBackend = {
  async list() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select(LIST_COLUMNS)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching recipes:', error)
      return []
    }
    return (data ?? []) as RecipeListRow[]
  },

  async get(id) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .select('id, title, recipe_data, original_input, original_analysis, created_at, updated_at, is_favorite, last_opened_at')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return null
    return data as unknown as SavedRecipe
  },

  async create(input: RecipeWrite) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('saved_recipes')
      .insert({
        title: input.title,
        recipe_data: input.recipe_data,
        original_input: input.original_input,
        original_analysis: input.original_analysis,
      })
      .select('id')
      .single()

    if (error) throw error
    return data.id as string
  },

  async update(id, input: RecipeWrite) {
    const supabase = createClient()
    const { error } = await supabase
      .from('saved_recipes')
      .update({
        title: input.title,
        recipe_data: input.recipe_data,
        original_input: input.original_input,
        original_analysis: input.original_analysis,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) throw error
  },

  async setFavorite(id, value) {
    const supabase = createClient()
    await supabase.from('saved_recipes').update({ is_favorite: value }).eq('id', id)
  },

  async remove(id) {
    const supabase = createClient()
    await supabase.from('saved_recipes').delete().eq('id', id)
  },

  async touch(id) {
    const supabase = createClient()
    await supabase
      .from('saved_recipes')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', id)
  },
}

export const supabaseMealPlan: MealPlanBackend = {
  async listBetween(startKey, endKey) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(ENTRY_COLUMNS)
      .gte('plan_date', startKey)
      .lte('plan_date', endKey)

    if (error) {
      console.error('Error fetching meal plan:', error)
      return []
    }

    return ((data ?? []) as unknown as EntryRow[])
      .map(toEntry)
      .filter((e): e is MealPlanEntry => e !== null)
  },

  async getForDate(dateKey) {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select(ENTRY_COLUMNS)
      .eq('plan_date', dateKey)
      .maybeSingle()

    if (error) {
      console.error("Error fetching today's dinner:", error)
      return null
    }
    if (!data) return null

    return toEntry(data as unknown as EntryRow)
  },

  async assign(dateKey, recipeId) {
    const supabase = createClient()
    const { error } = await supabase
      .from('meal_plan_entries')
      .upsert({ recipe_id: recipeId, plan_date: dateKey }, { onConflict: 'plan_date' })

    if (error) {
      console.error('Error assigning recipe:', error)
      return null
    }

    // Read the new entry back with its recipe data in one query.
    const { data: row } = await supabase
      .from('meal_plan_entries')
      .select(ENTRY_COLUMNS)
      .eq('plan_date', dateKey)
      .single()

    return row ? toEntry(row as unknown as EntryRow) : null
  },

  async clear(entryId) {
    const supabase = createClient()
    const { error } = await supabase.from('meal_plan_entries').delete().eq('id', entryId)
    if (error) throw error
  },
}
