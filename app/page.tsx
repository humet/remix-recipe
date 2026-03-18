'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecipeInput } from '@/components/recipe-input'
import { RecipeDisplay } from '@/components/recipe-display'
import { ImprovementSuggestions } from '@/components/improvement-suggestions'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { RecipeHighlights } from '@/components/recipe-highlights'
import { ImprovedRecipe, RecipeAnalysis, SuggestedImprovement, serializeRecipe } from '@/lib/recipe-types'
import { CalendarDays } from 'lucide-react'
import { TonightsDinner } from '@/components/tonights-dinner'

type AppState = 'input' | 'suggestions' | 'result'
type ProcessingType = 'analyzing' | 'improving' | null

export default function Home() {
  const [appState, setAppState] = useState<AppState>('input')
  const [analysis, setAnalysis] = useState<RecipeAnalysis | null>(null)
  const [recipe, setRecipe] = useState<ImprovedRecipe | null>(null)
  const [processingType, setProcessingType] = useState<ProcessingType>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedRecipeId, setSavedRecipeId] = useState<string | undefined>(undefined)
  const [originalInput, setOriginalInput] = useState<string | undefined>(undefined)
  const [isReimproved, setIsReimproved] = useState(false)
  const [improveFromRecipe, setImproveFromRecipe] = useState<string | null>(null)
  const [previousRecipe, setPreviousRecipe] = useState<ImprovedRecipe | null>(null)
  const existingTagsRef = useRef<string[]>([])

  // Load existing tags from saved recipes so the AI can reuse them
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('saved_recipes')
      .select('recipe_data')
      .then(({ data }) => {
        if (!data) return
        const tagSet = new Set<string>()
        for (const row of data) {
          for (const tag of (row.recipe_data as { tags?: string[] }).tags ?? []) {
            tagSet.add(tag)
          }
        }
        existingTagsRef.current = Array.from(tagSet)
      })
  }, [])

  // Step 1: Analyze the recipe and get suggestions
  const handleAnalyzeRecipe = async (
    text: string,
    images: { base64: string; mediaType: string }[]
  ) => {
    setProcessingType('analyzing')
    setError(null)
    setOriginalInput(text || (images.length > 0 ? '[Image input]' : ''))

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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Request failed with status ${response.status}`)
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setAppState('suggestions')
      window.scrollTo(0, 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('[v0] Analyze error:', err)
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
          parsedRecipe: improveFromRecipe ?? analysis.parsedRecipe,
          selectedImprovements: selectedImprovements.map(imp => ({
            title: imp.title,
            description: imp.description,
          })),
          customRequest,
          existingTags: existingTagsRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to improve recipe')
      }

      const data = await response.json()
      setRecipe(data.recipe)
      setAppState('result')
      window.scrollTo(0, 0)
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
    window.scrollTo(0, 0)
    setAnalysis(null)
    setRecipe(null)
    setError(null)
    setSavedRecipeId(undefined)
    setOriginalInput(undefined)
    setIsReimproved(false)
    setImproveFromRecipe(null)
    setPreviousRecipe(null)
  }

  const handleRecipeSaved = (id: string) => {
    setSavedRecipeId(id)
  }

  const handleBackToResult = () => {
    if (previousRecipe) {
      setRecipe(previousRecipe)
      setAppState('result')
      setPreviousRecipe(null)
      window.scrollTo(0, 0)
    }
  }

  const handleReimproveFromOriginal = () => {
    if (analysis) {
      setPreviousRecipe(recipe)
      setRecipe(null)
      setIsReimproved(true)
      setImproveFromRecipe(null)
      setAppState('suggestions')
      window.scrollTo(0, 0)
    }
  }

  const handleImproveFurther = async () => {
    if (!recipe) return

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
      setRecipe(null)
      setIsReimproved(true)
      setAppState('suggestions')
      window.scrollTo(0, 0)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong'
      setError(errorMessage)
      console.error('Improve further error:', err)
    } finally {
      setProcessingType(null)
    }
  }

  const isLoading = processingType !== null

  // Render based on app state
  if (appState === 'result' && recipe) {
    return (
      <>
        <ProcessingOverlay type="analyzing" isVisible={processingType === 'analyzing'} />
        <RecipeDisplay
          recipe={recipe}
          onHome={handleBackToInput}
          savedRecipeId={savedRecipeId}
          onSaved={handleRecipeSaved}
          originalInput={originalInput}
          originalAnalysis={analysis}
          onImproveFurther={handleImproveFurther}
          onReimproveFromOriginal={analysis ? handleReimproveFromOriginal : undefined}
          isReimproved={isReimproved}
        />
      </>
    )
  }

  if (appState === 'suggestions' && analysis) {
    return (
      <>
        <ProcessingOverlay type="improving" isVisible={processingType === 'improving'} />
        <ImprovementSuggestions
          analysis={analysis}
          onApply={handleApplyImprovements}
          onSkip={handleSkipImprovements}
          onBack={previousRecipe ? handleBackToResult : undefined}
          onHome={handleBackToInput}
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

      <TonightsDinner />

      {/* Plan your week */}
      <div className="px-5 pb-6">
        <Link
          href="/meal-plan"
          className="w-full glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3"
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-foreground text-sm">Plan your week</h3>
            <p className="text-xs text-muted-foreground">Assign saved recipes to each day</p>
          </div>
        </Link>
      </div>
      
      {/* Recipe Highlights */}
      <div className="px-5 pb-6">
        <RecipeHighlights />
      </div>

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
