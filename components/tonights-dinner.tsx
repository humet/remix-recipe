'use client'

import Link from 'next/link'
import { Clock, ChefHat, UtensilsCrossed, CalendarPlus } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useTodaysDinner } from '@/hooks/use-todays-dinner'

export function TonightsDinner() {
  const { entry, loading } = useTodaysDinner()

  if (loading) {
    return (
      <div className="px-5 pb-4">
        <div className="glass rounded-2xl p-4 animate-pulse">
          <div className="h-3 w-24 bg-muted-foreground/20 rounded mb-3" />
          <div className="h-5 w-48 bg-muted-foreground/20 rounded mb-2" />
          <div className="h-3 w-32 bg-muted-foreground/20 rounded" />
        </div>
      </div>
    )
  }

  if (!entry) {
    return (
      <div className="px-5 pb-4">
        <Link
          href="/meal-plan"
          className="block w-full glass rounded-2xl p-4 border-2 border-dashed border-border/40 hover:border-primary/40 transition-all active:scale-[0.98]"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-muted-foreground/10">
              <CalendarPlus className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">No dinner planned tonight</p>
              <p className="text-xs text-muted-foreground/70">Tap to plan your meals</p>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  const recipe = entry.recipe.recipe_data

  return (
    <div className="px-5 pb-4">
      <Link
        href={`/recipe/${entry.recipe_id}`}
        className="block w-full glass rounded-2xl p-4 ring-2 ring-primary/30 hover:ring-primary/50 transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <UtensilsCrossed className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-primary">Tonight&apos;s dinner</span>
        </div>

        <h3 className="font-semibold text-foreground truncate">{recipe.title}</h3>

        {(recipe.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {(recipe.tags ?? []).slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mt-2.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            <span>{recipe.cookTime}</span>
          </div>
          <div className="flex items-center gap-1">
            <ChefHat className="h-3.5 w-3.5" />
            <span>{recipe.difficulty}</span>
          </div>
        </div>
      </Link>
    </div>
  )
}
