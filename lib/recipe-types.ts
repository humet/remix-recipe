export interface Ingredient {
  name: string
  amount: string
  notes: string | null
}

export interface RecipeStep {
  stepNumber: number
  instruction: string
  tips: string | null
  timing: string | null
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
