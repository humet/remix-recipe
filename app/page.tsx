'use client'

import { useState } from 'react'
import { RecipeInput } from '@/components/recipe-input'
import { RecipeDisplay } from '@/components/recipe-display'
import { ImprovementSuggestions } from '@/components/improvement-suggestions'
import { ImprovedRecipe, RecipeAnalysis, SuggestedImprovement } from '@/lib/recipe-types'

type AppState = 'input' | 'suggestions' | 'result'

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input')
  const [analysis, setAnalysis] = useState<RecipeAnalysis | null>(null)
  const [recipe, setRecipe] = useState<ImprovedRecipe | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Analyze the recipe and get suggestions
  const handleAnalyzeRecipe = async (
    text: string,
    images: { base64: string; mediaType: string }[]
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipeText: text,
          images,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze recipe')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setAppState('suggestions')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Step 2: Apply selected improvements
  const handleApplyImprovements = async (
    selectedImprovements: SuggestedImprovement[],
    customRequest: string
  ) => {
    if (!analysis) return
    
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/improve-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parsedRecipe: analysis.parsedRecipe,
          selectedImprovements: selectedImprovements.map(imp => ({
            title: imp.title,
            description: imp.description,
          })),
          customRequest,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve recipe')
      }

      const data = await response.json()
      setRecipe(data.recipe)
      setAppState('result')
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Skip improvements and just format
  const handleSkipImprovements = () => {
    handleApplyImprovements([], '')
  }

  const handleBackToInput = () => {
    setAppState('input')
    setAnalysis(null)
    setRecipe(null)
    setError(null)
  }

  const handleBackToSuggestions = () => {
    setAppState('suggestions')
    setRecipe(null)
    setError(null)
  }

  // Render based on app state
  if (appState === 'result' && recipe) {
    return <RecipeDisplay recipe={recipe} onBack={analysis ? handleBackToSuggestions : handleBackToInput} />
  }

  if (appState === 'suggestions' && analysis) {
    return (
      <ImprovementSuggestions
        analysis={analysis}
        onApply={handleApplyImprovements}
        onSkip={handleSkipImprovements}
        onBack={handleBackToInput}
        isLoading={isLoading}
      />
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <RecipeInput onImprove={handleAnalyzeRecipe} isLoading={isLoading} />
      
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
            Paste any recipe text, screenshot, or photo. The AI will suggest improvements like making it healthier, tastier, or kid-friendly.
          </p>
        </div>
      </div>
    </main>
  )
}
