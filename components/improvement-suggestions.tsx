'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecipeAnalysis, SuggestedImprovement } from '@/lib/recipe-types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { 
  ArrowLeft, 
  ChefHat, 
  Sparkles, 
  Heart, 
  Baby, 
  Zap, 
  Timer, 
  Leaf, 
  PiggyBank, 
  Palette,
  Check,
  Wand2,
  MessageSquare,
  Home
} from 'lucide-react'

interface ImprovementSuggestionsProps {
  analysis: RecipeAnalysis
  onApply: (selectedImprovements: SuggestedImprovement[], customRequest: string) => void
  onSkip: () => void
  onBack?: () => void
  onHome?: () => void
  homeHref?: string
  isLoading: boolean
}

const categoryIcons: Record<SuggestedImprovement['category'], typeof ChefHat> = {
  taste: ChefHat,
  health: Heart,
  'kid-friendly': Baby,
  easier: Zap,
  faster: Timer,
  vegetarian: Leaf,
  budget: PiggyBank,
  presentation: Palette,
}

const categoryColors: Record<SuggestedImprovement['category'], string> = {
  taste: 'bg-primary/10 text-primary border-primary/20',
  health: 'bg-accent/10 text-accent border-accent/20',
  'kid-friendly': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  easier: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  faster: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  vegetarian: 'bg-green-500/10 text-green-600 border-green-500/20',
  budget: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  presentation: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
}

export function ImprovementSuggestions({
  analysis,
  onApply,
  onSkip,
  onBack,
  onHome,
  homeHref,
  isLoading
}: ImprovementSuggestionsProps) {
  const router = useRouter()
  const handleHome = onHome ?? (homeHref ? () => router.push(homeHref) : () => router.push('/'))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [customRequest, setCustomRequest] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApply = () => {
    const selectedImprovements = analysis.suggestedImprovements.filter(
      imp => selectedIds.has(imp.id)
    )
    onApply(selectedImprovements, customRequest.trim())
  }

  const validateAndApply = async () => {
    const trimmed = customRequest.trim()
    if (!trimmed) {
      handleApply()
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      const res = await fetch('/api/validate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeTitle: analysis.title,
          recipeSummary: analysis.summary,
          customRequest: trimmed,
        }),
      })

      if (!res.ok) {
        // Fail open
        handleApply()
        return
      }

      const data = await res.json() as { valid: boolean; reason: string | null }

      if (!data.valid) {
        setValidationError(data.reason ?? 'That request doesn\'t seem like a recipe improvement. Try something like "make it spicier" or "add a crispy topping".')
        // Wait for error element to render before scrolling
        requestAnimationFrame(() => {
          errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        })
        textareaRef.current?.focus()
        return
      }

      handleApply()
    } catch {
      // Fail open on network errors
      handleApply()
    } finally {
      setIsValidating(false)
    }
  }

  const hasSelections = selectedIds.size > 0 || customRequest.trim().length > 0

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
<header className="sticky top-0 z-10 glass-strong border-b-0">
        <div className="flex items-center gap-3 px-5 py-4">
          {onBack && (
            <button
              onClick={onBack}
              className="h-11 w-11 flex items-center justify-center rounded-full glass text-foreground hover:scale-105 active:scale-95 transition-transform"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">
              {analysis.title}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Choose improvements to apply
            </p>
          </div>
          <button
            onClick={handleHome}
            className="h-11 w-11 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground hover:scale-105 active:scale-95 transition-all"
            aria-label="Go home"
          >
            <Home className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="flex flex-col gap-6 p-5 pb-52">
        {/* Recipe Summary */}
        <div className="flex flex-col gap-2 p-4 glass rounded-2xl">
          <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>
        </div>

        {/* AI Suggestions Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Suggested Improvements</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Select any improvements you&apos;d like the AI to apply to your recipe.
          </p>

          <div className="flex flex-col gap-3">
            {analysis.suggestedImprovements.map((improvement) => {
              const Icon = categoryIcons[improvement.category]
              const isSelected = selectedIds.has(improvement.id)
              
              return (
                <button
                  key={improvement.id}
                  onClick={() => toggleSelection(improvement.id)}
                  disabled={isLoading}
                  className={`flex items-start gap-3 p-4 rounded-2xl text-left transition-all hover:scale-[1.01] active:scale-[0.99] ${
                    isSelected 
                      ? 'glass-strong ring-2 ring-primary/50' 
                      : 'glass hover:ring-1 hover:ring-primary/30'
                  } ${isLoading ? 'opacity-50' : ''}`}
                >
                  <div className={`shrink-0 h-11 w-11 flex items-center justify-center rounded-xl ${categoryColors[improvement.category]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-foreground">{improvement.title}</h3>
                      {isSelected && (
                        <div className="h-5 w-5 flex items-center justify-center rounded-full bg-primary text-white">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      {improvement.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </section>

        {/* Custom Request Section */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Custom Request</h2>
          </div>
          
          {!showCustomInput ? (
            <button
              onClick={() => setShowCustomInput(true)}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-border/50 glass-subtle text-muted-foreground hover:border-primary/50 hover:text-primary transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Wand2 className="h-5 w-5" />
              <span className="text-sm font-medium">Add your own improvement request</span>
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <Textarea
                ref={textareaRef}
                value={customRequest}
                onChange={(e) => { setCustomRequest(e.target.value); setValidationError(null) }}
                placeholder="E.g., Make it spicier, add a crispy topping, substitute dairy with oat milk..."
                className="min-h-[100px] text-base resize-none glass rounded-2xl border-0"
                disabled={isLoading}
              />
              {validationError && (
                <div ref={errorRef} className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-500 leading-relaxed">{validationError}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setShowCustomInput(false)
                  setCustomRequest('')
                  setValidationError(null)
                }}
                className="text-sm text-muted-foreground hover:text-foreground self-start"
              >
                Cancel
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 glass-strong border-t-0">
        <div className="flex flex-col gap-3">
          <Button
            onClick={validateAndApply}
            disabled={isLoading || isValidating}
            className="h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-primary to-accent hover:opacity-90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isValidating ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 animate-spin" />
                Checking...
              </span>
            ) : hasSelections ? (
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Apply {selectedIds.size > 0 ? `${selectedIds.size} improvement${selectedIds.size > 1 ? 's' : ''}` : 'custom request'}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Format recipe (no changes)
              </span>
            )}
          </Button>
          
          {!isLoading && (
            <button
              onClick={onSkip}
              className="py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip and just format the recipe
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
