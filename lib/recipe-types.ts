export interface Ingredient {
  name: string
  amount: string
  notes: string | null
}

export interface StepTiming {
  label: string
  duration: string
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
  tips: string | null
  timings?: StepTiming[]
  timing?: string | null // Legacy field for backward compatibility
}

export interface ImprovedRecipe {
  title: string
  description: string
  prepTime: string
  cookTime: string
  servings: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  ingredients: Ingredient[]
  steps: RecipeStep[]
  proTips: string[]
  improvements: string[]
}

export interface SuggestedImprovement {
  id: string
  category: 'taste' | 'health' | 'kid-friendly' | 'easier' | 'faster' | 'vegetarian' | 'budget' | 'presentation'
  title: string
  description: string
}

export interface RecipeAnalysis {
  title: string
  summary: string
  parsedRecipe: string
  suggestedImprovements: SuggestedImprovement[]
}

export function serializeRecipe(recipe: ImprovedRecipe): string {
  const lines: string[] = []

  lines.push(recipe.title)
  lines.push('')
  lines.push(recipe.description)
  lines.push('')
  lines.push(`Prep Time: ${recipe.prepTime}`)
  lines.push(`Cook Time: ${recipe.cookTime}`)
  lines.push(`Servings: ${recipe.servings}`)
  lines.push(`Difficulty: ${recipe.difficulty}`)
  lines.push('')

  lines.push('Ingredients:')
  for (const ing of recipe.ingredients) {
    const note = ing.notes ? ` (${ing.notes})` : ''
    lines.push(`- ${ing.amount} ${ing.name}${note}`)
  }
  lines.push('')

  lines.push('Instructions:')
  for (const step of recipe.steps) {
    let line = `${step.stepNumber}. ${step.instruction}`
    if (step.tips) {
      line += ` [Tip: ${step.tips}]`
    }
    lines.push(line)
  }

  if (recipe.proTips.length > 0) {
    lines.push('')
    lines.push('Pro Tips:')
    for (const tip of recipe.proTips) {
      lines.push(`- ${tip}`)
    }
  }

  return lines.join('\n')
}
