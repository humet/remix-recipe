'use client'

import { useState } from 'react'
import { RecipeInput } from '@/components/recipe-input'
import { RecipeDisplay } from '@/components/recipe-display'
import { ImprovementSuggestions } from '@/components/improvement-suggestions'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { ImprovedRecipe, RecipeAnalysis, SuggestedImprovement } from '@/lib/recipe-types'

type AppState = 'input' | 'suggestions' | 'result'
type ProcessingType = 'analyzing' | 'improving' | null

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input')
  const [analysis, setAnalysis] = useState<RecipeAnalysis | null>(null)
  const [recipe, setRecipe] = useState<ImprovedRecipe | null>(null)
  const [processingType, setProcessingType] = useState<ProcessingType>(null)
  const [error, setError] = useState<string | null>(null)

  // Step 1: Analyze the recipe and get suggestions
  const handleAnalyzeRecipe = async (
    text: string,
    images: { base64: string; mediaType: string }[]
  ) => {
    setProcessingType('analyzing')
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
      setProcessingType(null)
    }
  }

  // Step 2: Apply selected improvements
  const handleApplyImprovements = async (
    selectedImprovements: SuggestedImprovement[],
    customRequest: string
  ) => {
    if (!analysis) return
    
    setProcessingType('improving')
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
      setProcessingType(null)
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

  const isLoading = processingType !== null

  // Render based on app state
  if (appState === 'result' && recipe) {
    return <RecipeDisplay recipe={recipe} onBack={analysis ? handleBackToSuggestions : handleBackToInput} />
  }

  if (appState === 'suggestions' && analysis) {
    return (
      <>
        <ProcessingOverlay type="improving" isVisible={processingType === 'improving'} />
        <ImprovementSuggestions
          analysis={analysis}
          onApply={handleApplyImprovements}
          onSkip={handleSkipImprovements}
          onBack={handleBackToInput}
          isLoading={isLoading}
        />
      </>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <ProcessingOverlay type="analyzing" isVisible={processingType === 'analyzing'} />
      <RecipeInput onImprove={handleAnalyzeRecipe} isLoading={isLoading} />
      
      {error && (
        <div className="px-5 pb-5">
          <div className="p-4 glass rounded-2xl border-l-4 border-destructive text-destructive text-sm text-center">
            {error}
          </div>
        </div>
      )}
      
      {/* Example recipes hint */}
      <div className="px-5 pb-8">
        <div className="p-4 glass rounded-2xl">
          <p className="text-sm text-muted-foreground text-center leading-relaxed">
            Paste any recipe text, screenshot, or photo. The AI will suggest improvements like making it healthier, tastier, or kid-friendly.
          </p>
        </div>
      </div>
    </main>
  )
}
