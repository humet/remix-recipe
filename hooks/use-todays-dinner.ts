'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useDataChangeListener } from '@/lib/events'
import { MealPlanEntry } from '@/hooks/use-meal-plan'
import { formatDateKey } from '@/lib/meal-plan-utils'

export function useTodaysDinner() {
  const [entry, setEntry] = useState<MealPlanEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const todayKey = formatDateKey(new Date())
    const supabase = createClient()

    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select('id, recipe_id, plan_date, saved_recipes(id, title, recipe_data)')
      .eq('plan_date', todayKey)
      .maybeSingle()

    if (error) {
      console.error('Error fetching today\'s dinner:', error)
      setEntry(null)
      setLoading(false)
      return
    }

    if (data) {
      const recipe = data.saved_recipes as unknown as MealPlanEntry['recipe']
      setEntry(recipe ? { id: data.id, recipe_id: data.recipe_id, plan_date: data.plan_date, recipe } : null)
    } else {
      setEntry(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  useDataChangeListener('meal-plan-changed', fetch)
  useDataChangeListener('recipes-changed', fetch)

  return { entry, loading }
}
