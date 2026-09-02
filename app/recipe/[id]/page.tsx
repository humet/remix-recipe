import { notFound } from 'next/navigation'
import { after } from 'next/server'
import { getRecipeForPage, touchRecipeOnServer } from '@/lib/data/server'
import { isDemoRequest } from '@/lib/demo/is-demo'
import { DemoRecipeLoader } from '@/components/demo/demo-recipe-loader'
import { RecipePageClient } from './recipe-page-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function RecipePage({ params }: Props) {
  const { id } = await params

  // Demo recipes live in the visitor's localStorage, so the lookup has to
  // happen client-side.
  if (await isDemoRequest()) {
    return <DemoRecipeLoader id={id} />
  }

  const data = await getRecipeForPage(id)

  if (!data) {
    notFound()
  }

  // Track recently used without holding up the response.
  after(() => touchRecipeOnServer(id))

  return (
    <RecipePageClient
      initialRecipe={data.recipe_data}
      savedRecipeId={data.id}
      originalInput={data.original_input}
      originalAnalysis={data.original_analysis}
    />
  )
}
