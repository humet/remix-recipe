'use client'

import { Plus, Clock, ChefHat, X, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { MealPlanEntry } from '@/hooks/use-meal-plan'
import { isToday, formatDayLabel } from '@/lib/meal-plan-utils'

interface DaySlotProps {
  date: Date
  entry?: MealPlanEntry
  onAdd: () => void
  onView: () => void
  onChange: () => void
  onClear: () => void
}

export function DaySlot({ date, entry, onAdd, onView, onChange, onClear }: DaySlotProps) {
  const today = isToday(date)
  const recipe = entry?.recipe?.recipe_data

  if (!entry || !recipe) {
    return (
      <button
        onClick={onAdd}
        className={`w-full text-left rounded-2xl p-4 transition-all active:scale-[0.98] cursor-pointer border-2 border-dashed ${
          today
            ? 'border-primary/50 glass'
            : 'border-border/40 glass-subtle'
        } hover:border-primary/40`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${today ? 'text-primary' : 'text-muted-foreground'}`}>
            {formatDayLabel(date)}
            {today && <span className="ml-2 text-xs font-normal text-primary/70">Today</span>}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground/60">
          <Plus className="h-5 w-5" />
          <span className="text-sm">Add dinner</span>
        </div>
      </button>
    )
  }

  return (
    <div
      className={`w-full rounded-2xl p-4 glass transition-all ${
        today ? 'ring-2 ring-primary/30' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${today ? 'text-primary' : 'text-muted-foreground'}`}>
          {formatDayLabel(date)}
          {today && <span className="ml-2 text-xs font-normal text-primary/70">Today</span>}
        </span>
        <button
          onClick={onClear}
          className="h-7 w-7 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-destructive transition-colors"
          aria-label="Clear day"
        >
          <X className="h-3.5 w-3.5" />
        </button>
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

      <div className="flex gap-2 mt-3">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl glass hover:ring-2 hover:ring-primary/30 transition-all text-foreground"
        >
          <Eye className="h-3.5 w-3.5" />
          View
        </button>
        <button
          onClick={onChange}
          className="px-3 py-1.5 text-xs font-medium rounded-xl glass hover:ring-2 hover:ring-primary/30 transition-all text-muted-foreground"
        >
          Change
        </button>
      </div>
    </div>
  )
}
