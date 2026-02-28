'use client'

import { useState } from 'react'
import { ImprovedRecipe } from '@/lib/recipe-types'
import { Button } from '@/components/ui/button'
import { ProcessingOverlay } from '@/components/processing-overlay'
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
  Loader2
} from 'lucide-react'

interface RecipeDisplayProps {
  recipe: ImprovedRecipe
  onBack: () => void
}

export function RecipeDisplay({ recipe: initialRecipe, onBack }: RecipeDisplayProps) {
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
        <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setView('overview')}
              className="flex items-center gap-1 text-muted-foreground"
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
              className="text-muted-foreground"
              aria-label="Restart"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
          {/* Progress Bar */}
          <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </header>

        {/* Step Content */}
        <main className="flex-1 p-5">
          <div className="flex flex-col gap-6">
            {/* Step Number Badge */}
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-serif text-xl">
                {step.stepNumber}
              </div>
              {step.timing && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary rounded-full">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{step.timing}</span>
                </div>
              )}
            </div>

            {/* Instruction */}
            <p className="text-xl leading-relaxed text-foreground">
              {formatInstruction(step.instruction)}
            </p>

            {/* Tip */}
            {step.tips && (
              <div className="flex gap-3 p-4 bg-accent/10 rounded-xl border border-accent/20">
                <Lightbulb className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{step.tips}</p>
              </div>
            )}
          </div>
        </main>

        {/* Navigation */}
        <footer className="sticky bottom-0 bg-background border-t border-border p-4 pb-8">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex-1 h-14 rounded-xl"
            >
              <ChevronLeft className="h-5 w-5 mr-1" />
              Previous
            </Button>
            {currentStep === recipe.steps.length - 1 ? (
              <Button
                size="lg"
                onClick={() => setView('overview')}
                className="flex-1 h-14 rounded-xl"
              >
                <Check className="h-5 w-5 mr-1" />
                Done!
              </Button>
            ) : (
              <Button
                size="lg"
                onClick={nextStep}
                className="flex-1 h-14 rounded-xl"
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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-foreground"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="font-serif text-lg font-normal text-foreground truncate">{recipe.title}</h1>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-5">
        <div className="flex flex-col gap-6">
          {/* Title & Description */}
          <div className="flex flex-col gap-3">
            <h2 className="font-serif text-2xl text-foreground text-balance">{recipe.title}</h2>
            <p className="text-muted-foreground leading-relaxed">{recipe.description}</p>
          </div>

          {/* AI Improvements Summary */}
          {recipe.improvements && recipe.improvements.length > 0 && (
            <div className="flex flex-col gap-3 p-4 bg-primary/5 rounded-xl border border-primary/20">
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

          {/* Scaling Notes */}
          {scalingNotes && scalingNotes.length > 0 && showScalingNotes && (
            <div className="flex flex-col gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-amber-600 dark:text-amber-500" />
                  <h3 className="font-semibold text-amber-900 dark:text-amber-100">Scaling Notes</h3>
                </div>
                <button
                  onClick={() => setShowScalingNotes(false)}
                  className="h-6 w-6 flex items-center justify-center rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900"
                  aria-label="Dismiss scaling notes"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="flex flex-col gap-1.5">
                {scalingNotes.map((note, index) => (
                  <li key={index} className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
                    {note}
                  </li>
                ))}
              </ul>
              {currentScaledServings !== originalServings && (
                <button
                  onClick={handleResetScale}
                  className="text-xs text-amber-700 dark:text-amber-300 underline underline-offset-2 self-start"
                >
                  Reset to original ({originalServings} servings)
                </button>
              )}
            </div>
          )}

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Prep</p>
                <p className="text-sm font-medium text-foreground">{recipe.prepTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Cook</p>
                <p className="text-sm font-medium text-foreground">{recipe.cookTime}</p>
              </div>
            </div>
            <div className="col-span-2 flex flex-col gap-3 p-3 bg-card rounded-xl border border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Servings</p>
                    <p className="text-sm font-medium text-foreground">
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
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Decrease servings"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-10 text-center font-semibold text-lg text-foreground">
                    {targetServings}
                  </span>
                  <button
                    onClick={() => adjustServings(1)}
                    disabled={isScaling || targetServings >= 50}
                    className="h-10 w-10 flex items-center justify-center rounded-full bg-secondary text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
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
                  className="w-full h-11 rounded-lg"
                >
                  Scale to {targetServings} servings
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <ChefHat className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Difficulty</p>
                <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${getDifficultyColor(recipe.difficulty)}`}>
                  {recipe.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <section className="flex flex-col gap-3">
            <h3 className="font-serif text-xl text-foreground">Ingredients</h3>
            <div className="bg-card rounded-xl border border-border divide-y divide-border">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-3 p-3">
                  <span className="font-semibold text-primary min-w-[70px] text-sm">{ingredient.amount}</span>
                  <div className="flex-1">
                    <span className="text-foreground">{ingredient.name}</span>
                    {ingredient.notes && (
                      <span className="text-muted-foreground text-sm"> ({ingredient.notes})</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Steps Preview */}
          <section className="flex flex-col gap-3">
            <h3 className="font-serif text-xl text-foreground">Steps</h3>
            <div className="flex flex-col gap-3">
              {recipe.steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentStep(index)
                    setView('cooking')
                  }}
                  className="flex gap-3 p-4 bg-card rounded-xl border border-border text-left hover:border-primary transition-colors"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    completedSteps.has(index) 
                      ? 'bg-accent text-accent-foreground' 
                      : 'bg-secondary text-foreground'
                  }`}>
                    {completedSteps.has(index) ? <Check className="h-4 w-4" /> : step.stepNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground line-clamp-2">{step.instruction}</p>
                    {step.timing && (
                      <p className="text-xs text-muted-foreground mt-1">{step.timing}</p>
                    )}
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>

          {/* Pro Tips */}
          {recipe.proTips.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="font-serif text-xl text-foreground">Pro Tips</h3>
              <div className="flex flex-col gap-2">
                {recipe.proTips.map((tip, index) => (
                  <div key={index} className="flex gap-3 p-4 bg-accent/10 rounded-xl border border-accent/20">
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
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-8 bg-gradient-to-t from-background via-background to-transparent">
        <Button
          size="lg"
          onClick={() => setView('cooking')}
          className="w-full h-14 rounded-xl text-base font-semibold"
        >
          Start Cooking
          <ChevronRight className="h-5 w-5 ml-1" />
        </Button>
      </div>
    </div>
  )
}
