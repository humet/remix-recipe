'use client'

import { useState } from 'react'
import { ImprovedRecipe } from '@/lib/recipe-types'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat, 
  Lightbulb,
  Check,
  ChevronRight,
  ChevronLeft,
  RotateCcw
} from 'lucide-react'

interface RecipeDisplayProps {
  recipe: ImprovedRecipe
  onBack: () => void
}

export function RecipeDisplay({ recipe, onBack }: RecipeDisplayProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())
  const [view, setView] = useState<'overview' | 'cooking'>('overview')

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
            <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Servings</p>
                <p className="text-sm font-medium text-foreground">{recipe.servings}</p>
              </div>
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
