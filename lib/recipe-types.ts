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
