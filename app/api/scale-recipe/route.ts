import { generateText, Output } from 'ai'
import { z } from 'zod'

const scaledRecipeSchema = z.object({
  servings: z.string().describe('The new serving size'),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string().describe('The scaled amount for the new serving size'),
    notes: z.string().nullable(),
  })),
  steps: z.array(z.object({
    stepNumber: z.number(),
    instruction: z.string().describe('The instruction with updated measurements in parentheses. Also adjust cooking times if scaling significantly.'),
    tips: z.string().nullable(),
    timing: z.string().nullable().describe('Adjusted timing if needed for larger/smaller quantities'),
  })),
  scalingNotes: z.array(z.string()).describe('1-3 brief notes about important scaling considerations, like adjusted cooking times or technique changes for the new quantity'),
})

export async function POST(req: Request) {
  try {
    const { recipe, newServings } = await req.json()

    const prompt = `You are an expert chef. Scale this recipe from ${recipe.servings} to ${newServings} servings.

CRITICAL REQUIREMENTS:
1. Scale ALL ingredient amounts proportionally
2. Update ALL measurements mentioned in step instructions (in parentheses) to match the new quantities
3. If scaling significantly (2x or more, or half or less), consider:
   - Cooking times may need adjustment (larger batches take longer)
   - Pan/pot sizes might need to change
   - Some techniques may need modification
4. Keep amounts practical (round to sensible measurements)
5. Provide 1-3 scaling notes about important considerations

Current recipe:
Title: ${recipe.title}
Servings: ${recipe.servings}

Ingredients:
${recipe.ingredients.map((i: { amount: string; name: string; notes: string | null }) => `- ${i.amount} ${i.name}${i.notes ? ` (${i.notes})` : ''}`).join('\n')}

Steps:
${recipe.steps.map((s: { stepNumber: number; instruction: string; timing: string | null }) => `${s.stepNumber}. ${s.instruction}${s.timing ? ` [${s.timing}]` : ''}`).join('\n')}

Scale to: ${newServings} servings`

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4-20250514',
      output: Output.object({
        schema: scaledRecipeSchema,
      }),
      prompt,
    })

    if (!output) {
      throw new Error('Failed to scale recipe')
    }

    return Response.json({ 
      scaledRecipe: {
        ...recipe,
        servings: output.servings,
        ingredients: output.ingredients,
        steps: output.steps,
      },
      scalingNotes: output.scalingNotes,
    })
  } catch (error) {
    console.error('Error scaling recipe:', error)
    return Response.json(
      { error: 'Failed to scale recipe' },
      { status: 500 }
    )
  }
}
