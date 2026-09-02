'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { getEntryForDate } from '@/lib/data'
import { formatDateKey } from '@/lib/meal-plan-utils'

/** Demo equivalent of the server-side /todays-dinner redirect resolver. */
export function DemoTodaysDinner() {
  const router = useRouter()

  useEffect(() => {
    getEntryForDate(formatDateKey(new Date())).then((entry) => {
      router.replace(entry ? `/recipe/${entry.recipe_id}` : '/meal-plan')
    })
  }, [router])

  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </main>
  )
}
