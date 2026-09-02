import type { ImprovedRecipe, Ingredient } from '@/lib/recipe-types'
import {
  demoAlternatives,
  demoAnalysis,
  demoAppliedSwap,
  demoImprovedRecipe,
  demoRemovedIngredient,
  demoScaledRecipe,
} from './fixtures/ai'

export type DemoAiRoute =
  | '/api/analyze-recipe'
  | '/api/improve-recipe'
  | '/api/scale-recipe'
  | '/api/swap-ingredient'
  | '/api/apply-swap'
  | '/api/remove-ingredient'
  | '/api/validate-request'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** Obvious keyboard-mashing, so the demo can still show the guard rail. */
function looksLikeGibberish(input: string): boolean {
  const value = input.trim().toLowerCase()
  if (value.length < 3) return true
  if (/^(.)\1{2,}$/.test(value)) return true
  if (/^[^aeiou\s]{5,}$/.test(value)) return true
  return false
}

/**
 * Resolves the canned response for a route. Shapes match the real handlers
 * exactly — see app/api/<route>/route.ts.
 */
export async function demoAiResponse(
  route: DemoAiRoute,
  body: Record<string, unknown>,
): Promise<unknown> {
  // Let ProcessingOverlay actually get its moment.
  await delay(500 + Math.random() * 700)

  switch (route) {
    case '/api/analyze-recipe':
      return { analysis: demoAnalysis(String(body.recipeText ?? '')) }

    case '/api/improve-recipe':
      return {
        recipe: demoImprovedRecipe(
          (body.selectedImprovements ?? []) as { title: string; description: string }[],
          body.customRequest as string | undefined,
        ),
      }

    case '/api/scale-recipe':
      return demoScaledRecipe(
        body.recipe as ImprovedRecipe,
        String(body.newServings ?? ''),
      )

    case '/api/swap-ingredient':
      return demoAlternatives(body.ingredient as { name: string; amount: string })

    case '/api/apply-swap':
      return demoAppliedSwap(
        body.recipe as ImprovedRecipe,
        body.originalIngredient as Ingredient,
        body.newIngredient as { name: string; amount: string },
      )

    case '/api/remove-ingredient':
      return demoRemovedIngredient(
        body.recipe as ImprovedRecipe,
        body.ingredientToRemove as Ingredient,
      )

    case '/api/validate-request': {
      const request = String(body.customRequest ?? '')
      if (looksLikeGibberish(request)) {
        return {
          valid: false,
          reason:
            'That doesn’t look like a recipe change. Try something like “make it spicier” or “add a crispy topping”.',
        }
      }
      return { valid: true, reason: null }
    }
  }
}
