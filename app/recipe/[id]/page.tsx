import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ImprovedRecipe, RecipeAnalysis } from '@/lib/recipe-types'
import { RecipePageClient } from './recipe-page-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('saved_recipes')
    .select('id, title, recipe_data, original_input, original_analysis')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  // Track recently used (fire-and-forget)
  supabase
    .from('saved_recipes')
    .update({ last_opened_at: new Date().toISOString() })
    .eq('id', id)
    .then()

  return (
    <RecipePageClient
      initialRecipe={data.recipe_data as ImprovedRecipe}
      savedRecipeId={data.id}
      originalInput={data.original_input as string | undefined}
      originalAnalysis={data.original_analysis as RecipeAnalysis | undefined}
    />
  )
}
