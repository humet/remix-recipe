import { generateText, Output } from 'ai'
import { z } from 'zod'

const validationSchema = z.object({
  valid: z.boolean().describe('Whether the custom request is a reasonable recipe improvement request'),
  reason: z.string().nullable().describe('If invalid, a helpful message explaining why and suggesting alternatives. Null if valid.'),
})

export async function POST(req: Request) {
  try {
    const { recipeTitle, recipeSummary, customRequest } = await req.json() as {
      recipeTitle: string
      recipeSummary: string
      customRequest: string
    }

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: validationSchema,
      }),
      prompt: `You are a quick validation gate for recipe improvement requests. Your job is to check whether a user's custom request makes sense as a recipe modification.

RECIPE: ${recipeTitle}
SUMMARY: ${recipeSummary}

USER'S REQUEST: "${customRequest}"

RULES — be LENIENT:
- ALLOW creative, unusual, or adventurous food ideas (e.g., "add lavender", "make it Korean-inspired", "use miso in the sauce")
- ALLOW vague requests (e.g., "make it better", "healthier", "more interesting")
- ALLOW dietary modifications (e.g., "make it vegan", "low sodium", "keto-friendly")
- REJECT gibberish or random characters (e.g., "asdfghjkl", "!!!???", "aaaaaa")
- REJECT physically impossible or dangerous requests (e.g., "replace flour with concrete", "cook at 10000 degrees", "add bleach")
- REJECT clearly non-food requests (e.g., "write me a poem", "what's the weather", "solve this math problem")

When rejecting, provide a SHORT friendly reason and suggest what they could try instead (e.g., "Try something like 'make it spicier' or 'add a crispy topping'").

When in doubt, mark as VALID. It's better to allow a borderline request than to block a creative one.`,
    })

    if (!output) {
      // Fail open — allow the request through
      return Response.json({ valid: true, reason: null })
    }

    return Response.json({ valid: output.valid, reason: output.reason })
  } catch (error) {
    console.error('Error validating request:', error)
    // Fail open — if validation itself fails, allow the request through
    return Response.json({ valid: true, reason: null })
  }
}
