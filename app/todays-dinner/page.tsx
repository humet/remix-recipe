import { redirect } from 'next/navigation'
import { getPlannedRecipeId } from '@/lib/data/server'
import { isDemoRequest } from '@/lib/demo/is-demo'
import { DemoTodaysDinner } from '@/components/demo/demo-todays-dinner'
import { formatDateKey } from '@/lib/meal-plan-utils'

export default async function TodaysDinnerPage() {
  if (await isDemoRequest()) {
    return <DemoTodaysDinner />
  }

  const recipeId = await getPlannedRecipeId(formatDateKey(new Date()))

  redirect(recipeId ? `/recipe/${recipeId}` : '/meal-plan')
}
