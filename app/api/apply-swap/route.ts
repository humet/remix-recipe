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
  swapNote: z.string().describe('A brief note about how this substitution affects the recipe'),
})

export async function POST(req: Request) {
  try {
    const { recipe, originalIngredient, newIngredient } = await req.json()

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: updatedRecipeSchema,
      }),
      prompt: `You are a helpful cooking assistant. Update this recipe to use a substitute ingredient.

CURRENT RECIPE:
Title: ${recipe.title}
Ingredients: ${JSON.stringify(recipe.ingredients)}
Steps: ${JSON.stringify(recipe.steps)}

SUBSTITUTION:
Replace: ${originalIngredient.name} (${originalIngredient.amount})
With: ${newIngredient.name} (${newIngredient.amount})

REQUIREMENTS:
1. Update the ingredients list with the new ingredient
2. Update ALL step instructions that mention the original ingredient to use the new one
3. Keep the inline measurements format: "Add the flour (200g)" - always include amounts in parentheses
4. Adjust any technique or timing if needed for the substitute
5. Keep all other ingredients and steps exactly the same
6. Provide a brief note about how this substitution might affect the dish

Return the updated ingredients and steps.`,
    })

    if (!output) {
      throw new Error('No output generated')
    }

    return Response.json({
      ingredients: output.ingredients,
      steps: output.steps,
      swapNote: output.swapNote,
    })
  } catch (error) {
    console.error('Error applying swap:', error)
    return Response.json(
      { error: 'Failed to apply swap' },
      { status: 500 }
    )
  }
}
