import type {
  ImprovedRecipe,
  MealPlanEntry,
  RecipeAnalysis,
  SavedRecipe,
} from '@/lib/recipe-types'

/**
 * Narrow row shape the four list views actually render. See
 * hooks/use-recipe-filter.ts — nothing in the lists touches original_input
 * or original_analysis.
 */
export type RecipeListRow = Pick<
  SavedRecipe,
  'id' | 'title' | 'recipe_data' | 'created_at' | 'is_favorite' | 'last_opened_at'
>

export interface RecipeWrite {
  title: string
  recipe_data: ImprovedRecipe
  original_input?: string
  original_analysis?: RecipeAnalysis | null
}

export interface RecipeBackend {
  list(): Promise<RecipeListRow[]>
  get(id: string): Promise<SavedRecipe | null>
  /** Returns the id of the new row. */
  create(input: RecipeWrite): Promise<string>
  update(id: string, input: RecipeWrite): Promise<void>
  setFavorite(id: string, value: boolean): Promise<void>
  remove(id: string): Promise<void>
  touch(id: string): Promise<void>
}

export interface MealPlanBackend {
  listBetween(startKey: string, endKey: string): Promise<MealPlanEntry[]>
  getForDate(dateKey: string): Promise<MealPlanEntry | null>
  assign(dateKey: string, recipeId: string): Promise<MealPlanEntry | null>
  clear(entryId: string): Promise<void>
}

export type { MealPlanEntry, SavedRecipe }
