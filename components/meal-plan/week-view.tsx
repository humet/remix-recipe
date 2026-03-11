'use client'

import { useState } from 'react'
import { DaySlot } from '@/components/meal-plan/day-slot'
import { RecipePickerSheet } from '@/components/meal-plan/recipe-picker-sheet'
import { MealPlanEntry } from '@/hooks/use-meal-plan'
import { formatDateKey } from '@/lib/meal-plan-utils'
import { useRouter } from 'next/navigation'

interface WeekViewProps {
  dates: Date[]
  entries: Map<string, MealPlanEntry>
  onAssign: (date: Date, recipeId: string) => Promise<void>
  onClear: (date: Date) => Promise<void>
}

export function WeekView({ dates, entries, onAssign, onClear }: WeekViewProps) {
  const [pickerDate, setPickerDate] = useState<Date | null>(null)
  const router = useRouter()

  const handleAdd = (date: Date) => {
    setPickerDate(date)
  }

  const handleSelect = async (recipeId: string) => {
    if (!pickerDate) return
    await onAssign(pickerDate, recipeId)
    setPickerDate(null)
  }

  const handleView = (entry: MealPlanEntry) => {
    router.push(`/recipe/${entry.recipe_id}`)
  }

  return (
    <>
      <div className="flex flex-col gap-3">
        {dates.map(date => {
          const key = formatDateKey(date)
          const entry = entries.get(key)
          return (
            <DaySlot
              key={key}
              date={date}
              entry={entry}
              onAdd={() => handleAdd(date)}
              onView={() => entry && handleView(entry)}
              onChange={() => handleAdd(date)}
              onClear={() => onClear(date)}
            />
          )
        })}
      </div>

      <RecipePickerSheet
        isOpen={pickerDate !== null}
        onClose={() => setPickerDate(null)}
        onSelect={handleSelect}
      />
    </>
  )
}
