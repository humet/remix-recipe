'use client'

import { useState } from 'react'
import { RecipeInput } from '@/components/recipe-input'
import { RecipeDisplay } from '@/components/recipe-display'
import { ImprovedRecipe } from '@/lib/recipe-types'

export default function Home() {
  const [recipe, setRecipe] = useState<ImprovedRecipe | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImproveRecipe = async (
    text: string,
    imageData: { base64: string; mediaType: string } | null
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/improve-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeText: text,
          imageData,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve recipe')
      }

      const data = await response.json()
      setRecipe(data.recipe)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    setRecipe(null)
    setError(null)
  }

  if (recipe) {
    return <RecipeDisplay recipe={recipe} onBack={handleBack} />
  }

  return (
    <main className="min-h-screen bg-background">
      <RecipeInput onImprove={handleImproveRecipe} isLoading={isLoading} />
      
      {error && (
        <div className="px-5 pb-5">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm text-center">
            {error}
          </div>
        </div>
      )}
      
      {/* Example recipes hint */}
      <div className="px-5 pb-8">
        <div className="p-4 bg-secondary/50 rounded-xl">
          <p className="text-sm text-muted-foreground text-center">
            Paste any recipe text, screenshot, or photo. The AI will transform it into an easy-to-follow guide with inline measurements.
          </p>
        </div>
      </div>
    </main>
  )
}
