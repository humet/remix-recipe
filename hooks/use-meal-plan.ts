'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { emitDataChange, useDataChangeListener } from '@/lib/events'
import { ImprovedRecipe } from '@/lib/recipe-types'
import { formatDateKey } from '@/lib/meal-plan-utils'

export interface MealPlanEntry {
  id: string
  recipe_id: string
  plan_date: string
  recipe: {
    id: string
    title: string
    recipe_data: ImprovedRecipe
  }
}

export function useMealPlan(weekDates: Date[]) {
  const [entries, setEntries] = useState<Map<string, MealPlanEntry>>(new Map())
  const [loading, setLoading] = useState(true)

  const fetchEntries = useCallback(async () => {
    if (weekDates.length === 0) return

    const startDate = formatDateKey(weekDates[0])
    const endDate = formatDateKey(weekDates[weekDates.length - 1])

    const supabase = createClient()
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select('id, recipe_id, plan_date, saved_recipes(id, title, recipe_data)')
      .gte('plan_date', startDate)
      .lte('plan_date', endDate)

    if (error) {
      console.error('Error fetching meal plan:', error)
      setLoading(false)
      return
    }

    const map = new Map<string, MealPlanEntry>()
    for (const row of data ?? []) {
      const recipe = row.saved_recipes as unknown as MealPlanEntry['recipe']
      if (recipe) {
        map.set(row.plan_date, {
          id: row.id,
          recipe_id: row.recipe_id,
          plan_date: row.plan_date,
          recipe,
        })
      }
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
    const supabase = createClient()

    const { error } = await supabase
      .from('meal_plan_entries')
      .upsert(
        { recipe_id: recipeId, plan_date: dateKey },
        { onConflict: 'plan_date' }
      )

    if (error) {
      console.error('Error assigning recipe:', error)
      return
    }

    // Fetch the newly assigned entry with its recipe data in one query
    const { data: row } = await supabase
      .from('meal_plan_entries')
      .select('id, recipe_id, plan_date, saved_recipes(id, title, recipe_data)')
      .eq('plan_date', dateKey)
      .single()

    if (row) {
      const recipe = row.saved_recipes as unknown as MealPlanEntry['recipe']
      if (recipe) {
        setEntries(prev => {
          const next = new Map(prev)
          next.set(dateKey, {
            id: row.id,
            recipe_id: row.recipe_id,
            plan_date: row.plan_date,
            recipe,
          })
          return next
        })
      }
    }

    emitDataChange('meal-plan-changed')
  }

  const clearDay = async (date: Date) => {
    const dateKey = formatDateKey(date)
    const entry = entries.get(dateKey)
    if (!entry) return

    const supabase = createClient()
    const { error } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('id', entry.id)

    if (error) {
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
