'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { WeekView } from '@/components/meal-plan/week-view'
import { useMealPlan } from '@/hooks/use-meal-plan'
import {
  DAYS_OF_WEEK,
  DayOfWeek,
  getStartDay,
  setStartDay as saveStartDay,
  getWeekDates,
  formatWeekRange,
} from '@/lib/meal-plan-utils'

export default function MealPlanPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [startDay, setStartDay] = useState<DayOfWeek>('Monday')
  const [referenceDate, setReferenceDate] = useState<Date | null>(null)

  useEffect(() => {
    setStartDay(getStartDay())
    setReferenceDate(new Date())
    setMounted(true)
  }, [])

  const weekDates = useMemo(
    () => referenceDate ? getWeekDates(referenceDate, startDay) : [],
    [referenceDate, startDay]
  )

  const { entries, loading, assignRecipe, clearDay } = useMealPlan(weekDates)

  const handleStartDayChange = (day: string) => {
    const d = day as DayOfWeek
    setStartDay(d)
    saveStartDay(d)
  }

  const navigateWeek = useCallback((direction: -1 | 1) => {
    setReferenceDate(prev => {
      if (!prev) return prev
      const next = new Date(prev)
      next.setDate(prev.getDate() + direction * 7)
      return next
    })
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <div className="px-5 pt-5 pb-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to home"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Dinner Plan</h1>
        </div>

        {/* Start day selector */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Groceries arrive on</span>
          <Select value={startDay} onValueChange={handleStartDayChange}>
            <SelectTrigger className="h-8 glass border-0 rounded-xl text-sm font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS_OF_WEEK.map(day => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Week navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-foreground">
            {mounted ? formatWeekRange(weekDates) : ''}
          </span>
          <button
            onClick={() => navigateWeek(1)}
            className="h-9 w-9 flex items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Week view */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : (
          <WeekView
            dates={weekDates}
            entries={entries}
            onAssign={assignRecipe}
            onClear={clearDay}
          />
        )}
      </div>
    </main>
  )
}
