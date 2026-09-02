import type {
  ImprovedRecipe,
  Ingredient,
  RecipeAnalysis,
  RecipeStep,
  SuggestedImprovement,
} from '@/lib/recipe-types'
import { DEMO_RECIPES } from './recipes'

/**
 * Pre-written stand-ins for each AI route's JSON response. Demo mode never
 * reaches the AI Gateway, so everything the demo user "generates" comes from
 * here. Each function returns the exact shape its route returns — see
 * app/api/<route>/route.ts.
 */

export const DEMO_SUGGESTED_IMPROVEMENTS: SuggestedImprovement[] = [
  {
    id: 'demo-imp-taste',
    category: 'taste',
    title: 'Build a deeper savoury base',
    description:
      'Brown the aromatics properly and deglaze the pan before any liquid goes in, so the finished dish tastes cooked rather than assembled.',
  },
  {
    id: 'demo-imp-health',
    category: 'health',
    title: 'Cut the saturated fat',
    description:
      'Replace half the butter with olive oil and lean on acidity and fresh herbs for richness instead of dairy.',
  },
  {
    id: 'demo-imp-faster',
    category: 'faster',
    title: 'Overlap the slow steps',
    description:
      'Reorder the method so the oven preheats and the water boils while you prep — roughly ten minutes off the total.',
  },
  {
    id: 'demo-imp-kids',
    category: 'kid-friendly',
    title: 'Soften the heat, keep the flavour',
    description:
      'Move the chilli to a side condiment so the base dish stays mild without tasting bland.',
  },
  {
    id: 'demo-imp-easier',
    category: 'easier',
    title: 'Reduce it to one pan',
    description:
      'Cook the vegetables alongside the protein in its rendered fat instead of dirtying a second tray.',
  },
  {
    id: 'demo-imp-budget',
    category: 'budget',
    title: 'Stretch it with pulses',
    description:
      'A tin of chickpeas bulks the dish out and lets you use half the meat without anyone noticing.',
  },
]

/** GET /api/analyze-recipe → { analysis } */
export function demoAnalysis(recipeText: string): RecipeAnalysis {
  const trimmed = recipeText.trim()
  const firstLine = trimmed.split('\n')[0]?.trim() ?? ''
  const title = firstLine.length > 2 && firstLine.length < 70 ? firstLine : 'Your Recipe'

  return {
    title,
    summary:
      'A simple, family-sized main course. The bones are good — the method needs tightening and the seasoning needs building in layers rather than all at the end.',
    parsedRecipe:
      trimmed ||
      'Chicken thighs, red onion, cherry tomatoes, olive oil, harissa, honey.\n\n1. Marinate the chicken.\n2. Roast everything on one tray for 40 minutes.\n3. Serve with lemon.',
    suggestedImprovements: DEMO_SUGGESTED_IMPROVEMENTS.slice(0, 5),
  }
}

/** POST /api/improve-recipe → { recipe } */
export function demoImprovedRecipe(
  selectedImprovements: { title: string; description: string }[],
  customRequest?: string,
): ImprovedRecipe {
  const base = DEMO_RECIPES[0].recipe_data
  const applied = selectedImprovements.map((i) => i.title)
  if (customRequest?.trim()) {
    applied.push(`Applied your request: “${customRequest.trim()}”`)
  }

  return {
    ...base,
    improvements: applied.length > 0 ? applied : base.improvements,
  }
}

/** POST /api/scale-recipe → { scaledRecipe, scalingNotes } */
export function demoScaledRecipe(
  recipe: ImprovedRecipe,
  newServings: string,
): { scaledRecipe: ImprovedRecipe; scalingNotes: string } {
  const target = parseFloat(newServings) || 1
  const current = parseFloat(recipe.servings) || 1
  const factor = target / current

  return {
    scaledRecipe: {
      ...recipe,
      servings: String(target),
      ingredients: recipe.ingredients.map((ing) => ({
        ...ing,
        amount: scaleAmount(ing.amount, factor),
      })),
      steps: recipe.steps,
    },
    scalingNotes:
      factor > 1
        ? 'Scaled up. Use a larger pan so nothing steams instead of browning, and expect the cooking times to stretch a little.'
        : 'Scaled down. Watch it closely towards the end — smaller quantities cook faster than the stated times.',
  }
}

/** Scales the leading number in an amount string, leaving units alone. */
function scaleAmount(amount: string, factor: number): string {
  const match = amount.match(/^(\d+(?:\.\d+)?)/)
  if (!match) return amount

  const scaled = parseFloat(match[1]) * factor
  const rounded = scaled >= 10 ? Math.round(scaled) : Math.round(scaled * 4) / 4

  return amount.replace(match[1], String(rounded))
}

/** POST /api/swap-ingredient → { alternatives: [{ name, amount, note }] } */
export function demoAlternatives(ingredient: { name: string; amount: string }): {
  alternatives: { name: string; amount: string; note: string }[]
} {
  const table: Record<string, { name: string; amount: string; note: string }[]> = {
    pancetta: [
      { name: 'smoked streaky bacon', amount: ingredient.amount, note: 'Smokier, and the closest everyday substitute' },
      { name: 'guanciale', amount: ingredient.amount, note: 'The traditional choice — richer and more delicate' },
      { name: 'smoked tofu', amount: ingredient.amount, note: 'Vegetarian; fry hard in oil to get the crisp edges' },
    ],
    'coconut milk': [
      { name: 'single cream', amount: ingredient.amount, note: 'Richer and less sweet; no coconut note' },
      { name: 'cashew cream', amount: ingredient.amount, note: 'Vegan, silkier, very slightly nutty' },
      { name: 'whole milk + 1 tbsp butter', amount: ingredient.amount, note: 'Thinner — reduce a few minutes longer' },
    ],
  }

  const specific = table[ingredient.name.toLowerCase()]
  if (specific) return { alternatives: specific }

  return {
    alternatives: [
      {
        name: 'a like-for-like swap',
        amount: ingredient.amount,
        note: `Behaves almost identically to ${ingredient.name} here, so the method is unchanged`,
      },
      {
        name: 'a plant-based alternative',
        amount: ingredient.amount,
        note: 'Keeps the dish vegan; season a little harder to compensate',
      },
      {
        name: 'a budget alternative',
        amount: `slightly more than ${ingredient.amount}`,
        note: 'Cheaper and widely available, but milder in flavour',
      },
    ],
  }
}

/** POST /api/apply-swap → { ingredients, steps, swapNote } */
export function demoAppliedSwap(
  recipe: ImprovedRecipe,
  originalIngredient: { name: string },
  newIngredient: { name: string; amount: string },
): { ingredients: Ingredient[]; steps: RecipeStep[]; swapNote: string } {
  return {
    ingredients: recipe.ingredients.map((ing) =>
      ing.name === originalIngredient.name
        ? { name: newIngredient.name, amount: newIngredient.amount, notes: ing.notes }
        : ing,
    ),
    steps: recipe.steps.map((step) => ({
      ...step,
      instruction: replaceName(step.instruction, originalIngredient.name, newIngredient.name),
    })),
    swapNote: `${newIngredient.name} goes in at the same stage the ${originalIngredient.name} did. Taste before serving — you may want a touch more seasoning.`,
  }
}

/** POST /api/remove-ingredient → { ingredients, steps, removalNote } */
export function demoRemovedIngredient(
  recipe: ImprovedRecipe,
  ingredientToRemove: { name: string },
): { ingredients: Ingredient[]; steps: RecipeStep[]; removalNote: string } {
  return {
    ingredients: recipe.ingredients.filter((ing) => ing.name !== ingredientToRemove.name),
    steps: recipe.steps.map((step) => ({
      ...step,
      instruction: stripName(step.instruction, ingredientToRemove.name),
    })),
    removalNote: `the dish holds up fine without it. Season a little more assertively at the end to make up for what the ${ingredientToRemove.name} was contributing.`,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function replaceName(text: string, from: string, to: string): string {
  return text.replace(new RegExp(escapeRegExp(from), 'gi'), to)
}

/** Drops "the <ingredient>" style references without mangling the sentence. */
function stripName(text: string, name: string): string {
  const escaped = escapeRegExp(name)
  return text
    .replace(new RegExp(`,?\\s*(?:and\\s+)?(?:the\\s+)?${escaped}`, 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([,.])/g, '$1')
    .trim()
}
