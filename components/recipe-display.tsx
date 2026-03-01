'use client'

import { useState } from 'react'
import { ImprovedRecipe, Ingredient, RecipeAnalysis } from '@/lib/recipe-types'
import { Button } from '@/components/ui/button'
import { ProcessingOverlay } from '@/components/processing-overlay'
import { IngredientSwapSheet } from '@/components/ingredient-swap-sheet'
import { TimerBar } from '@/components/timer-bar'
import { useTimers } from '@/hooks/use-timers'
import { createClient } from '@/lib/supabase/client'
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat, 
  Lightbulb,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  Sparkles,
  Minus,
  Plus,
  X,
  Info,
  Loader2,
  RefreshCw,
  Timer,
  Bookmark,
  BookmarkCheck,
  Wand2,
  Home
} from 'lucide-react'

interface RecipeDisplayProps {
  recipe: ImprovedRecipe
  onBack: () => void
  onHome: () => void
  savedRecipeId?: string
  onSaved?: (id: string) => void
  originalInput?: string
  originalAnalysis?: RecipeAnalysis | null
  onReimprove?: () => void
  isReimproved?: boolean
}

export function RecipeDisplay({ recipe: initialRecipe, onBack, onHome, savedRecipeId, onSaved, originalInput, originalAnalysis, onReimprove, isReimproved }: RecipeDisplayProps) {
  const [recipe, setRecipe] = useState(initialRecipe)
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [view, setView] = useState<'overview' | 'cooking'>('overview')
  
  // Portion scaling state
  const [isScaling, setIsScaling] = useState(false)
  const [scalingNotes, setScalingNotes] = useState<string[] | null>(null)
  const [showScalingNotes, setShowScalingNotes] = useState(false)
  
  // Parse current servings number for the adjuster
  const parseServings = (servingsStr: string): number => {
    const match = servingsStr.match(/\d+/)
    return match ? parseInt(match[0], 10) : 4
  }
  
  const [targetServings, setTargetServings] = useState(() => parseServings(recipe.servings))
  const [currentScaledServings, setCurrentScaledServings] = useState(() => parseServings(recipe.servings))
  const originalServings = parseServings(initialRecipe.servings)

  const adjustServings = (delta: number) => {
    const newValue = targetServings + delta
    if (newValue >= 1 && newValue <= 50) {
      setTargetServings(newValue)
    }
  }

  const handleApplyScale = async () => {
    // If already at this scale, do nothing
    if (targetServings === currentScaledServings) return
    
    // If returning to original, just reset
    if (targetServings === originalServings) {
      setRecipe(initialRecipe)
      setCurrentScaledServings(originalServings)
      setScalingNotes(null)
      return
    }
    
    setIsScaling(true)
    try {
      const response = await fetch('/api/scale-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe: initialRecipe,
          newServings: `${targetServings} servings`,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to scale')
      
      const data = await response.json()
      setRecipe(data.scaledRecipe)
      setCurrentScaledServings(targetServings)
      setScalingNotes(data.scalingNotes)
      setShowScalingNotes(true)
    } catch (error) {
      console.error('Error scaling recipe:', error)
      // Reset target to current
      setTargetServings(currentScaledServings)
    } finally {
      setIsScaling(false)
    }
  }

  const handleResetScale = () => {
    setTargetServings(originalServings)
    setCurrentScaledServings(originalServings)
    setRecipe(initialRecipe)
    setScalingNotes(null)
  }

  // Timer hook
  const timerHook = useTimers()

  // Save state
  const [isSaved, setIsSaved] = useState(!!savedRecipeId && !isReimproved)
  const [isSaving, setIsSaving] = useState(false)
  const [currentSavedId, setCurrentSavedId] = useState<string | undefined>(savedRecipeId)
  const [showSavePrompt, setShowSavePrompt] = useState(false)

  const handleSaveClick = () => {
    // If this is a re-improved version of an existing recipe, ask what to do
    if (isReimproved && savedRecipeId && !isSaved) {
      setShowSavePrompt(true)
    } else {
      handleSave()
    }
  }

  const handleSave = async (saveAsNew = false) => {
    setIsSaving(true)
    setShowSavePrompt(false)
    const supabase = createClient()
    
    try {
      if (currentSavedId && !saveAsNew) {
        // Update existing
        await supabase
          .from('saved_recipes')
          .update({ 
            title: recipe.title,
            recipe_data: recipe,
            original_input: originalInput,
            original_analysis: originalAnalysis,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentSavedId)
      } else {
        // Insert new
        const { data } = await supabase
          .from('saved_recipes')
          .insert({ 
            title: recipe.title,
            recipe_data: recipe,
            original_input: originalInput,
            original_analysis: originalAnalysis
          })
          .select('id')
          .single()
        
        if (data) {
          setCurrentSavedId(data.id)
          onSaved?.(data.id)
        }
      }
      setIsSaved(true)
    } catch (error) {
      console.error('Error saving recipe:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Ingredient swap state
  const [swapSheetOpen, setSwapSheetOpen] = useState(false)
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [swapNotes, setSwapNotes] = useState<string[]>([])

  const getRecipeContext = () => {
    return `${recipe.title}\n\nIngredients:\n${recipe.ingredients.map(i => `- ${i.amount} ${i.name}`).join('\n')}\n\nSteps:\n${recipe.steps.map(s => `${s.stepNumber}. ${s.instruction}`).join('\n')}`
  }

  const handleIngredientTap = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient)
    setSwapSheetOpen(true)
  }

  const handleSwap = async (original: Ingredient, replacement: { name: string; amount: string }) => {
    setIsSwapping(true)
    setSwapSheetOpen(false)
    
    try {
      const response = await fetch('/api/apply-swap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          originalIngredient: { name: original.name, amount: original.amount },
          newIngredient: replacement,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to apply swap')
      
      const data = await response.json()
      
      setRecipe({
        ...recipe,
        ingredients: data.ingredients,
        steps: data.steps,
      })
      
      if (data.swapNote) {
        setSwapNotes(prev => [...prev, data.swapNote])
      }
    } catch (error) {
      console.error('Error applying swap:', error)
    } finally {
      setIsSwapping(false)
    }
  }

  const handleRemoveIngredient = async (ingredient: Ingredient) => {
    setIsSwapping(true)
    setSwapSheetOpen(false)
    
    try {
      const response = await fetch('/api/remove-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipe,
          ingredientToRemove: { name: ingredient.name, amount: ingredient.amount },
        }),
      })
      
      if (!response.ok) throw new Error('Failed to remove ingredient')
      
      const data = await response.json()
      
      setRecipe({
        ...recipe,
        ingredients: data.ingredients,
        steps: data.steps,
      })
      
      if (data.removalNote) {
        setSwapNotes(prev => [...prev, `Removed ${ingredient.name}: ${data.removalNote}`])
      }
    } catch (error) {
      console.error('Error removing ingredient:', error)
    } finally {
      setIsSwapping(false)
    }
  }

  const toggleStepComplete = (stepIndex: number) => {
    const newCompleted = new Set(completedSteps)
    if (newCompleted.has(stepIndex)) {
      newCompleted.delete(stepIndex)
    } else {
      newCompleted.add(stepIndex)
    }
    setCompletedSteps(newCompleted)
  }

  const nextStep = () => {
    if (currentStep < recipe.steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-accent text-accent-foreground'
      case 'Medium':
        return 'bg-amber-100 text-amber-800'
      case 'Hard':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-secondary text-secondary-foreground'
    }
  }

  // Highlight ingredient amounts in the instruction text
  const formatInstruction = (instruction: string) => {
    // Match patterns like "ingredient (amount)" and highlight the amount
    const parts = instruction.split(/(\([^)]+\))/g)
    return parts.map((part, index) => {
      if (part.startsWith('(') && part.endsWith(')')) {
        return (
          <span key={index} className="inline-flex items-center px-1.5 py-0.5 mx-0.5 text-sm font-semibold bg-primary/15 text-primary rounded">
            {part.slice(1, -1)}
          </span>
        )
      }
      return part
    })
  }

  if (view === 'cooking') {
    const step = recipe.steps[currentStep]
    const progress = ((currentStep + 1) / recipe.steps.length) * 100

    return (
      <div className="flex flex-col min-h-screen bg-background">
        <ProcessingOverlay type="scaling" isVisible={isScaling} />
        {/* Cooking Mode Header */}
        <header className="sticky top-0 z-10 glass-strong px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('overview')}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm">Overview</span>
            </button>
            <span className="text-sm font-medium text-foreground">
              Step {currentStep + 1} of {recipe.steps.length}
            </span>
            <button
              onClick={() => {
                setCurrentStep(0)
                setCompletedSteps(new Set())
              }}
              className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Restart"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-2 glass rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Step Content */}
        <main className="flex-1 p-5">
          <div className="flex flex-col gap-6">
            {/* Step Number Badge */}
            <div className="flex items-start gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white font-bold text-2xl shadow-lg shadow-primary/25">
                {step.stepNumber}
              </div>
              {step.timings && step.timings.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {step.timings.map((timing, idx) => (
                    <button
                      key={idx}
                      onClick={() => timerHook.addTimer(timing.label, timing.duration)}
                      className="flex items-center gap-1.5 px-3 py-2 glass rounded-xl hover:ring-2 hover:ring-primary/30 transition-all active:scale-95"
                    >
                      <Timer className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm font-medium text-foreground">{timing.duration}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Instruction */}
            <p className="text-xl leading-relaxed text-foreground">
              {formatInstruction(step.instruction)}
            </p>

            {/* Tip */}
            {step.tips && (
              <div className="flex gap-3 p-4 glass rounded-2xl border-l-4 border-accent">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{step.tips}</p>
              </div>
            )}
          </div>
        </main>

        {/* Timer Bar */}
        <TimerBar {...timerHook} />

        {/* Navigation */}
        <footer className={`sticky bottom-0 glass-strong p-4 pb-8 ${timerHook.timers.length > 0 ? 'pb-4' : ''}`}>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 h-14 rounded-2xl glass border-0 hover:scale-[1.02] active:scale-[0.98] transition-transform"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </Button>
            {currentStep === recipe.steps.length - 1 ? (
              <Button
                size="lg"
                onClick={() => setView('overview')}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                <Check className="h-5 w-5 mr-1" />
                Done!
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={nextStep}
                className="flex-1 h-14 rounded-2xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Next
                <ChevronRight className="h-5 w-5 ml-1" />
              </Button>
            )}
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      <ProcessingOverlay type="scaling" isVisible={isScaling} />
      
      {/* Header */}
      <header className="sticky top-0 z-10 glass-strong px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full glass text-foreground hover:scale-105 active:scale-95 transition-transform"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="flex-1 text-lg font-semibold text-foreground truncate">{recipe.title}</h1>
          <button
            onClick={onHome}
            className="flex h-10 w-10 items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all"
            aria-label="Go home"
          >
            <Home className="h-5 w-5" />
          </button>
          <button
            onClick={handleSaveClick}
            disabled={isSaving}
            className={`flex h-10 w-10 items-center justify-center rounded-full glass hover:scale-105 active:scale-95 transition-all ${
              isSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
            aria-label={isSaved ? 'Recipe saved' : 'Save recipe'}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="h-5 w-5" />
            ) : (
              <Bookmark className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-5">
        <div className="flex flex-col gap-6">
          {/* Title & Description */}
          <div className="flex flex-col gap-3">
            <h2 className="text-2xl font-semibold text-foreground text-balance">{recipe.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
          </div>

          {/* AI Improvements Summary */}
          {recipe.improvements && recipe.improvements.length > 0 && (
            <div className="flex flex-col gap-3 p-4 glass rounded-2xl border-l-4 border-primary">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">AI Improvements</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {recipe.improvements.map((improvement, index) => (
                  <li key={index} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Re-improve option */}
          {originalAnalysis && onReimprove && (
            <button
              onClick={onReimprove}
              className="flex items-center justify-center gap-2 p-4 glass rounded-2xl text-muted-foreground hover:text-foreground hover:ring-2 hover:ring-primary/30 transition-all"
            >
              <Wand2 className="h-5 w-5" />
              <span className="font-medium">Try different improvements</span>
            </button>
          )}

          {/* Scaling Notes */}
          {scalingNotes && scalingNotes.length > 0 && showScalingNotes && (
            <div className="flex flex-col gap-3 p-4 glass rounded-2xl border-l-4 border-amber-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600" />
                  <h3 className="font-semibold text-foreground">Scaling Notes</h3>
                </div>
                <button
                  onClick={() => setShowScalingNotes(false)}
                  className="h-7 w-7 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground"
                  aria-label="Dismiss scaling notes"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {scalingNotes.map((note, index) => (
                  <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
              {currentScaledServings !== originalServings && (
                <button
                  onClick={handleResetScale}
                  className="text-xs text-primary underline underline-offset-2 self-start"
                >
                  Reset to original ({originalServings} servings)
                </button>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 glass rounded-2xl">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Prep</p>
                <p className="text-sm font-semibold text-foreground">{recipe.prepTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 glass rounded-2xl">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cook</p>
                <p className="text-sm font-semibold text-foreground">{recipe.cookTime}</p>
              </div>
            </div>
            <div className="col-span-2 flex flex-col gap-3 p-4 glass rounded-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Servings</p>
                    <p className="text-sm font-semibold text-foreground">
                      {currentScaledServings !== originalServings && (
                        <span className="text-muted-foreground line-through mr-1">{originalServings}</span>
                      )}
                      {currentScaledServings}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => adjustServings(-1)}
                    disabled={isScaling || targetServings <= 1}
                    className="h-11 w-11 flex items-center justify-center rounded-xl glass text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Decrease servings"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-lg text-foreground">
                    {targetServings}
                  </span>
                  <button
                    onClick={() => adjustServings(1)}
                    disabled={isScaling || targetServings >= 50}
                    className="h-11 w-11 flex items-center justify-center rounded-xl glass text-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-transform"
                    aria-label="Increase servings"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {targetServings !== currentScaledServings && (
                <Button
                  onClick={handleApplyScale}
                  disabled={isScaling}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  {isScaling ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Scale to {targetServings} servings
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3 p-4 glass rounded-2xl">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10">
                <ChefHat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-lg ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">Ingredients</h3>
              <span className="text-xs text-muted-foreground">Tap to swap</span>
            </div>
            <div className="glass rounded-2xl divide-y divide-border/30">
              {recipe.ingredients.map((ingredient, index) => (
                <button
                  key={index}
                  onClick={() => handleIngredientTap(ingredient)}
                  className="w-full flex items-center gap-3 p-4 text-left hover:bg-primary/5 transition-colors"
                >
                  <span className="font-bold text-primary min-w-[80px] text-sm">{ingredient.amount}</span>
                  <div className="flex-1">
                    <span className="text-foreground">{ingredient.name}</span>
                    {ingredient.notes && (
                      <span className="text-muted-foreground text-sm"> ({ingredient.notes})</span>
                    )}
                  </div>
                  <RefreshCw className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Swap Notes */}
          {swapNotes.length > 0 && (
            <div className="flex flex-col gap-3 p-4 glass rounded-2xl border-l-4 border-primary">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-foreground">Ingredient Swaps</h3>
              </div>
              <ul className="flex flex-col gap-2">
                {swapNotes.map((note, index) => (
                  <li key={index} className="text-sm text-muted-foreground leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Steps Preview */}
          <section className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-foreground">Steps</h3>
            <div className="flex flex-col gap-3">
              {recipe.steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentStep(index)
                    setView('cooking')
                  }}
                  className="flex gap-3 p-4 glass rounded-2xl text-left hover:ring-2 hover:ring-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold ${
                    completedSteps.has(index) 
                      ? 'bg-gradient-to-br from-accent to-primary text-white' 
                      : 'bg-primary/10 text-primary'
                  }`}>
                    {completedSteps.has(index) ? <Check className="h-4 w-4" /> : step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground line-clamp-2">{step.instruction}</p>
                    {step.timing && (
                      <p className="text-xs text-muted-foreground mt-1.5">{step.timing}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Pro Tips */}
          {recipe.proTips.length > 0 && (
            <section className="flex flex-col gap-4">
              <h3 className="text-lg font-semibold text-foreground">Pro Tips</h3>
              <div className="flex flex-col gap-3">
                {recipe.proTips.map((tip, index) => (
                  <div key={index} className="flex gap-3 p-4 glass rounded-2xl border-l-4 border-accent">
                    <Lightbulb className="h-5 w-5 text-accent shrink-0" />
                    <p className="text-sm text-foreground leading-relaxed">{tip}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Start Cooking Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 glass-strong">
        <Button
          size="lg"
          onClick={() => setView('cooking')}
          className="w-full h-14 rounded-2xl text-base font-semibold bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-[0.98] transition-transform"
        >
          Start Cooking
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>

      {/* Ingredient Swap Sheet */}
      {selectedIngredient && (
        <IngredientSwapSheet
          isOpen={swapSheetOpen}
          onClose={() => setSwapSheetOpen(false)}
          ingredient={selectedIngredient}
          recipeContext={getRecipeContext()}
          onSwap={handleSwap}
          onRemove={handleRemoveIngredient}
          isApplying={isSwapping}
        />
      )}

      {/* Swapping Overlay */}
      <ProcessingOverlay type="swapping" isVisible={isSwapping} />

      {/* Save Prompt Modal */}
      {showSavePrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 animate-fade-in">
          <div className="w-full max-w-lg p-5 pb-10 glass-strong rounded-t-3xl animate-slide-up">
            <h3 className="text-lg font-semibold text-foreground text-center mb-2">Save Recipe</h3>
            <p className="text-sm text-muted-foreground text-center mb-6">
              This is a new version with different improvements. How would you like to save it?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => handleSave(false)}
                className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent"
              >
                Update existing recipe
              </Button>
              <Button
                variant="outline"
                onClick={() => handleSave(true)}
                className="w-full h-14 rounded-2xl glass border-0"
              >
                Save as new recipe
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowSavePrompt(false)}
                className="w-full h-12 rounded-2xl text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
