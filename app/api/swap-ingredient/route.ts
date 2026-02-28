import { generateText, Output } from 'ai'
import { z } from 'zod'

const alternativesSchema = z.object({
  alternatives: z.array(z.object({
    name: z.string().describe('The substitute ingredient name'),
    amount: z.string().describe('The equivalent amount to use'),
    note: z.string().describe('Brief note about how it affects the dish, e.g., "slightly sweeter" or "adds nuttiness"'),
  })).describe('3-4 alternative ingredients that can substitute the original'),
})

export async function POST(req: Request) {
  try {
    const { ingredient, recipeContext } = await req.json() as {
      ingredient: { name: string; amount: string }
      recipeContext: string
    }

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: alternativesSchema,
      }),
      prompt: `You are a helpful cooking assistant. A user is making this recipe and doesn't have one of the ingredients. Suggest 3-4 practical substitutes.

RECIPE CONTEXT:
${recipeContext}

INGREDIENT TO SUBSTITUTE:
${ingredient.name} (${ingredient.amount})

REQUIREMENTS:
1. Suggest common household alternatives that most people would have
2. Consider the role this ingredient plays in the recipe (binding, flavor, texture, etc.)
3. Provide the equivalent amount for each substitute
4. Add a brief note about how the substitute might affect the final dish
5. Order by best match first

Provide practical, accessible alternatives.`,
    })

    if (!output) {
      throw new Error('No output generated')
    }

    return Response.json({ alternatives: output.alternatives })
  } catch (error) {
    console.error('Error generating alternatives:', error)
    return Response.json(
      { error: 'Failed to generate alternatives' },
      { status: 500 }
    )
  }
}
