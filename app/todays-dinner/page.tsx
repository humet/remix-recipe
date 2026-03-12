import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function formatDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default async function TodaysDinnerPage() {
  const supabase = await createClient()
  const todayKey = formatDateKey(new Date())

  const { data } = await supabase
    .from('meal_plan_entries')
    .select('recipe_id')
    .eq('plan_date', todayKey)
    .maybeSingle()

  if (data?.recipe_id) {
    redirect(`/recipe/${data.recipe_id}`)
  } else {
    redirect('/meal-plan')
  }
}
