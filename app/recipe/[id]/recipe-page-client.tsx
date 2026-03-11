'use client'

import { useState } from 'react'
import { RecipeDisplay } from '@/components/recipe-display'
import { ImprovementSuggestions } from '@/components/improvement-suggestions'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { ImprovedRecipe, RecipeAnalysis, SuggestedImprovement, serializeRecipe } from '@/lib/recipe-types'

interface RecipePageClientProps {
  initialRecipe: ImprovedRecipe
  savedRecipeId: string
  originalInput?: string
  originalAnalysis?: RecipeAnalysis
}

type ViewState = 'display' | 'suggestions'

export function RecipePageClient({
  initialRecipe,
  savedRecipeId,
  originalInput,
  originalAnalysis,
}: RecipePageClientProps) {
  const [viewState, setViewState] = useState<ViewState>('display')
  const [recipe, setRecipe] = useState<ImprovedRecipe>(initialRecipe)
  const [analysis, setAnalysis] = useState<RecipeAnalysis | null>(originalAnalysis ?? null)
  const [processingType, setProcessingType] = useState<'analyzing' | 'improving' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isReimproved, setIsReimproved] = useState(false)
  const [improveFromRecipe, setImproveFromRecipe] = useState<string | null>(null)
  const [previousRecipe, setPreviousRecipe] = useState<ImprovedRecipe | null>(null)
  const [currentSavedId, setCurrentSavedId] = useState(savedRecipeId)

  const handleImproveFurther = async () => {
    setProcessingType('analyzing')
    setError(null)

    try {
      const serialized = serializeRecipe(recipe)

      const response = await fetch('/api/analyze-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeText: serialized, images: [] }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setImproveFromRecipe(serialized)
      setPreviousRecipe(recipe)
      setIsReimproved(true)
      setViewState('suggestions')
      window.scrollTo(0, 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Improve further error:', err)
    } finally {
      setProcessingType(null)
    }
  }

  const handleReimproveFromOriginal = () => {
    if (analysis) {
      setPreviousRecipe(recipe)
      setIsReimproved(true)
      setImproveFromRecipe(null)
      setViewState('suggestions')
      window.scrollTo(0, 0)
    }
  }

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parsedRecipe: improveFromRecipe ?? analysis.parsedRecipe,
          selectedImprovements: selectedImprovements.map(imp => ({
            title: imp.title,
            description: imp.description,
          })),
          customRequest,
          existingTags: [],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve recipe')
      }

      const data = await response.json()
      setRecipe(data.recipe)
      setViewState('display')
      window.scrollTo(0, 0)
    } catch (err) {
      setError('Something went wrong. Please try again.')
      console.error('Error:', err)
    } finally {
      setProcessingType(null)
    }
  }

  const handleBackToResult = () => {
    if (previousRecipe) {
      setRecipe(previousRecipe)
      setPreviousRecipe(null)
      setViewState('display')
      window.scrollTo(0, 0)
    }
  }

  if (viewState === 'suggestions' && analysis) {
    return (
      <>
        <ProcessingOverlay type="improving" isVisible={processingType === 'improving'} />
        <ImprovementSuggestions
          analysis={analysis}
          onApply={handleApplyImprovements}
          onSkip={() => handleApplyImprovements([], '')}
          onBack={previousRecipe ? handleBackToResult : undefined}
          homeHref="/"
          isLoading={processingType !== null}
        />
      </>
    )
  }

  return (
    <>
      <ProcessingOverlay type="analyzing" isVisible={processingType === 'analyzing'} />
      <RecipeDisplay
        recipe={recipe}
        homeHref="/"
        savedRecipeId={currentSavedId}
        onSaved={(id) => setCurrentSavedId(id)}
        originalInput={originalInput}
        originalAnalysis={analysis}
        onImproveFurther={handleImproveFurther}
        onReimproveFromOriginal={analysis ? handleReimproveFromOriginal : undefined}
        isReimproved={isReimproved}
      />
    </>
  )
}
