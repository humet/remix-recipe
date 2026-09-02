import type { MealPlanEntry, SavedRecipe } from '@/lib/recipe-types'
import { mutate, newId, read } from '@/lib/demo/store'
import type {
  MealPlanBackend,
  RecipeBackend,
  RecipeListRow,
  RecipeWrite,
} from './types'

function byCreatedAtDesc(a: SavedRecipe, b: SavedRecipe) {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

function toListRow(r: SavedRecipe): RecipeListRow {
  return {
    id: r.id,
    title: r.title,
    recipe_data: r.recipe_data,
    created_at: r.created_at,
    is_favorite: r.is_favorite,
    last_opened_at: r.last_opened_at,
  }
}

export const demoRecipes: RecipeBackend = {
  async list() {
    return read().recipes.slice().sort(byCreatedAtDesc).map(toListRow)
  },

  async get(id) {
    return read().recipes.find((r) => r.id === id) ?? null
  },

  async create(input: RecipeWrite) {
    const id = newId()
    const now = new Date().toISOString()

    mutate((state) => ({
      ...state,
      recipes: [
        {
          id,
          title: input.title,
          recipe_data: input.recipe_data,
          original_input: input.original_input,
          original_analysis: input.original_analysis ?? undefined,
          created_at: now,
          updated_at: now,
          is_favorite: false,
          last_opened_at: null,
        },
        ...state.recipes,
      ],
    }))

    return id
  },

  async update(id, input: RecipeWrite) {
    mutate((state) => ({
      ...state,
      recipes: state.recipes.map((r) =>
        r.id === id
          ? {
              ...r,
              title: input.title,
              recipe_data: input.recipe_data,
              original_input: input.original_input,
              original_analysis: input.original_analysis ?? undefined,
              updated_at: new Date().toISOString(),
            }
          : r,
      ),
    }))
  },

  async setFavorite(id, value) {
    mutate((state) => ({
      ...state,
      recipes: state.recipes.map((r) => (r.id === id ? { ...r, is_favorite: value } : r)),
    }))
  },

  async remove(id) {
    mutate((state) => ({
      ...state,
      recipes: state.recipes.filter((r) => r.id !== id),
      // Mirror the ON DELETE CASCADE on meal_plan_entries.recipe_id.
      mealPlan: state.mealPlan.filter((e) => e.recipe_id !== id),
    }))
  },

  async touch(id) {
    mutate((state) => ({
      ...state,
      recipes: state.recipes.map((r) =>
        r.id === id ? { ...r, last_opened_at: new Date().toISOString() } : r,
      ),
    }))
  },
}

function hydrate(
  row: { id: string; recipe_id: string; plan_date: string },
  recipes: SavedRecipe[],
): MealPlanEntry | null {
  const recipe = recipes.find((r) => r.id === row.recipe_id)
  if (!recipe) return null
  return {
    id: row.id,
    recipe_id: row.recipe_id,
    plan_date: row.plan_date,
    recipe: { id: recipe.id, title: recipe.title, recipe_data: recipe.recipe_data },
  }
}

export const demoMealPlan: MealPlanBackend = {
  async listBetween(startKey, endKey) {
    const { mealPlan, recipes } = read()
    return mealPlan
      .filter((e) => e.plan_date >= startKey && e.plan_date <= endKey)
      .map((e) => hydrate(e, recipes))
      .filter((e): e is MealPlanEntry => e !== null)
  },

  async getForDate(dateKey) {
    const { mealPlan, recipes } = read()
    const row = mealPlan.find((e) => e.plan_date === dateKey)
    return row ? hydrate(row, recipes) : null
  },

  async assign(dateKey, recipeId) {
    const id = newId()

    // UNIQUE(plan_date) in scripts/003 — one entry per day, replaced on write.
    mutate((state) => ({
      ...state,
      mealPlan: [
        ...state.mealPlan.filter((e) => e.plan_date !== dateKey),
        { id, recipe_id: recipeId, plan_date: dateKey },
      ],
    }))

    return this.getForDate(dateKey)
  },

  async clear(entryId) {
    mutate((state) => ({
      ...state,
      mealPlan: state.mealPlan.filter((e) => e.id !== entryId),
    }))
  },
}
