'use client'

import { useCallback, useEffect, useState } from 'react'
import { getEntryForDate } from '@/lib/data'
import { useDataChangeListener } from '@/lib/events'
import type { MealPlanEntry } from '@/lib/recipe-types'
import { formatDateKey } from '@/lib/meal-plan-utils'

export function useTodaysDinner() {
  const [entry, setEntry] = useState<MealPlanEntry | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const todayKey = formatDateKey(new Date())
    setEntry(await getEntryForDate(todayKey))
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])
  useDataChangeListener('meal-plan-changed', fetch)
  useDataChangeListener('recipes-changed', fetch)

  return { entry, loading }
}
