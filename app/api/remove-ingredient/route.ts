import { generateText, Output } from 'ai'
import { z } from 'zod'

const updatedRecipeSchema = z.object({
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    notes: z.string().nullable(),
  })),
  steps: z.array(z.object({
    stepNumber: z.number(),
    instruction: z.string().describe('The step instruction with ingredient amounts in parentheses'),
    tips: z.string().nullable(),
    timing: z.string().nullable(),
  })),
  removalNote: z.string().describe('A brief note explaining how the recipe was adapted without this ingredient'),
})

export async function POST(req: Request) {
  try {
    const { recipe, ingredientToRemove } = await req.json()

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: updatedRecipeSchema,
      }),
      prompt: `You are a helpful cooking assistant. Update this recipe to work WITHOUT a specific ingredient.

CURRENT RECIPE:
Title: ${recipe.title}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Steps: ${JSON.stringify(recipe.steps)}

REMOVE THIS INGREDIENT:
${ingredientToRemove.name} (${ingredientToRemove.amount})

REQUIREMENTS:
1. Remove this ingredient from the ingredients list
2. Update ALL step instructions to remove references to this ingredient
3. Adjust the method so it still makes sense and produces a good result
4. If removing this ingredient significantly changes the dish, adapt the technique accordingly
5. Keep the inline measurements format for remaining ingredients: "Add the flour (200g)"
6. Keep all other ingredients exactly the same
7. Renumber steps if any need to be removed entirely
8. Provide a brief note explaining how the recipe works without this ingredient

Return the updated ingredients and steps.`,
    })

    if (!output) {
      throw new Error('No output generated')
    }

    return Response.json({
      ingredients: output.ingredients,
      steps: output.steps,
      removalNote: output.removalNote,
    })
  } catch (error) {
    console.error('Error removing ingredient:', error)
    return Response.json(
      { error: 'Failed to remove ingredient' },
      { status: 500 }
    )
  }
}
