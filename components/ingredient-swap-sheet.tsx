'use client'

import { useState, useEffect } from 'react'
import { X, Loader2, ArrowRight, Sparkles, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Ingredient } from '@/lib/recipe-types'

interface Alternative {
  name: string
  amount: string
  note: string
}

interface IngredientSwapSheetProps {
  isOpen: boolean
  ingredient: Ingredient | null
  recipeContext: string
  onClose: () => void
  onSwap: (original: Ingredient, replacement: { name: string; amount: string }) => void
  isApplying: boolean
}

export function IngredientSwapSheet({
  isOpen,
  ingredient,
  recipeContext,
  onClose,
  onSwap,
  isApplying,
}: IngredientSwapSheetProps) {
  const [alternatives, setAlternatives] = useState<Alternative[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showCustom, setShowCustom] = useState(false)
  const [customIngredient, setCustomIngredient] = useState('')
  const [customAmount, setCustomAmount] = useState('')

  useEffect(() => {
    if (isOpen && ingredient) {
      fetchAlternatives()
    } else {
      // Reset state when closed
      setAlternatives([])
      setError(null)
      setShowCustom(false)
      setCustomIngredient('')
      setCustomAmount('')
    }
  }, [isOpen, ingredient])

  const fetchAlternatives = async () => {
    if (!ingredient) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/swap-ingredient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ingredient: { name: ingredient.name, amount: ingredient.amount },
          recipeContext,
        }),
      })
      
      if (!response.ok) throw new Error('Failed to fetch alternatives')
      
      const data = await response.json()
      setAlternatives(data.alternatives)
    } catch (err) {
      setError('Could not load alternatives. Try again.')
      console.error('Error fetching alternatives:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectAlternative = (alt: Alternative) => {
    if (!ingredient || isApplying) return
    onSwap(ingredient, { name: alt.name, amount: alt.amount })
  }

  const handleCustomSwap = () => {
    if (!ingredient || !customIngredient.trim() || isApplying) return
    onSwap(ingredient, { 
      name: customIngredient.trim(), 
      amount: customAmount.trim() || ingredient.amount 
    })
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-50 animate-slide-up">
        <div className="glass-strong rounded-t-3xl max-h-[85vh] overflow-hidden flex flex-col">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-border/30">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">Swap Ingredient</h2>
              {ingredient && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  Replace <span className="font-medium text-foreground">{ingredient.name}</span> ({ingredient.amount})
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              disabled={isApplying}
              className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 pb-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Finding alternatives...</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <p className="text-sm text-destructive">{error}</p>
                <Button onClick={fetchAlternatives} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            ) : isApplying ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Updating recipe...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Suggested Alternatives */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium text-foreground">Suggested Alternatives</h3>
                  </div>
                  
                  {alternatives.map((alt, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAlternative(alt)}
                      className="flex items-center gap-3 p-4 glass rounded-2xl text-left hover:ring-2 hover:ring-primary/30 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{alt.name}</span>
                          <span className="text-sm text-primary font-semibold">{alt.amount}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{alt.note}</p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
                
                {/* Custom Input */}
                <div className="flex flex-col gap-3 pt-2">
                  {!showCustom ? (
                    <button
                      onClick={() => setShowCustom(true)}
                      className="flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-border/50 glass-subtle text-muted-foreground hover:border-primary/50 hover:text-primary transition-all"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span className="text-sm font-medium">Use something else</span>
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 p-4 glass rounded-2xl">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-medium text-foreground">Custom Substitute</h3>
                      </div>
                      <div className="flex gap-2">
                        <Textarea
                          value={customIngredient}
                          onChange={(e) => setCustomIngredient(e.target.value)}
                          placeholder="Ingredient name..."
                          className="min-h-[44px] h-[44px] resize-none glass rounded-xl border-0 flex-1"
                        />
                        <input
                          type="text"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder={ingredient?.amount || 'Amount'}
                          className="w-24 h-[44px] px-3 text-sm glass rounded-xl border-0 bg-transparent"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowCustom(false)}
                          className="flex-1 h-11 rounded-xl glass border-0"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleCustomSwap}
                          disabled={!customIngredient.trim()}
                          className="flex-1 h-11 rounded-xl bg-gradient-to-r from-primary to-accent"
                        >
                          Use This
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
