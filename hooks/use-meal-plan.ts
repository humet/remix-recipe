'use client'

import { useCallback, useEffect, useState } from 'react'
import { assignDay, clearEntry, listEntriesBetween } from '@/lib/data'
import type { MealPlanEntry } from '@/lib/recipe-types'
import { emitDataChange, useDataChangeListener } from '@/lib/events'
import { formatDateKey } from '@/lib/meal-plan-utils'

export type { MealPlanEntry } from '@/lib/recipe-types'

export function useMealPlan(weekDates: Date[]) {
  const [entries, setEntries] = useState<Map<string, MealPlanEntry>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (weekDates.length === 0) return

    const startDate = formatDateKey(weekDates[0])
    const endDate = formatDateKey(weekDates[weekDates.length - 1])

    const rows = await listEntriesBetween(startDate, endDate)

    const map = new Map<string, MealPlanEntry>()
    for (const row of rows) {
      map.set(row.plan_date, row)
    }
    setEntries(map)
    setLoading(false)
  }, [weekDates])

  useEffect(() => {
    setLoading(true)
    fetchEntries()
  }, [fetchEntries])

  const assignRecipe = async (date: Date, recipeId: string) => {
    const dateKey = formatDateKey(date)
    const entry = await assignDay(dateKey, recipeId)

    if (entry) {
      setEntries(prev => {
        const next = new Map(prev)
        next.set(dateKey, entry)
        return next
      })
    }

    emitDataChange('meal-plan-changed')
  }

  const clearDay = async (date: Date) => {
    const dateKey = formatDateKey(date)
    const entry = entries.get(dateKey)
    if (!entry) return

    try {
      await clearEntry(entry.id)
    } catch (error) {
      console.error('Error clearing day:', error)
      return
    }

    setEntries(prev => {
      const next = new Map(prev)
      next.delete(dateKey)
      return next
    })

    emitDataChange('meal-plan-changed')
  }

  // Refetch when saved recipes change (e.g. a recipe used in the plan is deleted)
  useDataChangeListener('recipes-changed', fetchEntries)

  return { entries, loading, assignRecipe, clearDay, refetch: fetchEntries }
}
