import { generateText, Output } from 'ai'
import { z } from 'zod'
import { requireUser } from '@/lib/auth/require-user'
import { validateImprovementReferences } from '@/lib/improvement-conflicts'

const analysisSchema = z.object({
  title: z.string().describe('The original recipe title'),
  summary: z.string().describe('A brief summary of what this recipe makes'),
  parsedRecipe: z.string().describe('The full recipe text as parsed/extracted, cleaned up for readability'),
  suggestedImprovements: z.array(
    z.object({
      id: z.string().describe('Unique identifier for this suggestion'),
      category: z.enum(['taste', 'health', 'kid-friendly', 'easier', 'faster', 'vegetarian', 'budget', 'presentation']).describe('Category of improvement'),
      title: z.string().describe('Short title for the improvement (e.g., "Add More Vegetables")'),
      description: z.string().describe('The specific change and its benefit, including any tradeoff and necessary supporting adjustments'),
      conflicts: z.array(z.object({
        improvementId: z.string().describe('ID of another suggestion that cannot be applied with this one'),
        reason: z.string().describe('Short, user-facing explanation of why these two choices cannot be combined'),
      })).describe('Only genuine incompatibilities or mutually exclusive alternatives; empty when compatible'),
    })
  ).describe('4-8 focused choices; multiple suggestions may share a category'),
})

export async function POST(req: Request) {
  const { response: unauthorized } = await requireUser()
  if (unauthorized) return unauthorized

  try {
    const { recipeText, images } = await req.json() as { 
      recipeText: string
      images: { base64: string; mediaType: string }[] 
    }

    const content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> = []

    // Add all images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        content.push({
          type: 'image',
          image: `data:${img.mediaType || 'image/jpeg'};base64,${img.base64}`,
        })
      }
    }

    const hasImages = images && images.length > 0

    // Add text prompt
    content.push({
      type: 'text',
      text: `You are an expert chef and recipe analyst. Analyze the following recipe and suggest improvements.

${hasImages ? `I've provided ${images.length} image${images.length > 1 ? 's' : ''} of the recipe. Please extract and analyze the recipe from the images.` : ''}

Your task:
1. Parse/extract the recipe and clean it up
2. Identify the recipe title and provide a brief summary
3. Suggest 4-8 meaningful improvements the user might want to apply. Focus on:
   - Making it taste better (better seasoning, techniques, ingredient swaps)
   - Making it healthier (less fat, more nutrients, lower sodium)
   - Making it kid-friendly (milder flavors, fun presentation)
   - Making it easier (simplified techniques, fewer steps)
   - Making it faster (time-saving tips)
   - Making it vegetarian (plant-based swaps)
   - Budget-friendly alternatives
   - Better presentation tips

Be specific and practical. Each suggestion must be one independently selectable choice.
- Categories are labels, not quotas: return multiple suggestions in a category when useful. Do not fill irrelevant categories.
- Split unrelated changes into separate suggestions. Keep necessary supporting changes together (e.g. replacing meat and adjusting its cooking time).
- Prioritize the most useful changes; do not pad the list.
- Explain material tradeoffs in the description, such as extra cooking time.
- Alternatives for the same ingredient or technique must be separate choices with explicit conflicts referencing their unique IDs.
- Check every pair, including across categories. Record incompatibilities in both suggestions, with a brief reason. Compatible tradeoffs are not conflicts.
- Never use duplicate IDs, missing references, or self-references.

${recipeText ? `Recipe to analyze:\n${recipeText}` : 'Please extract and analyze the recipe from the images provided.'}`,
    })

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: analysisSchema,
      }),
      messages: [{ role: 'user' as const, content }],
    })

    if (!output) throw new Error('No recipe analysis returned')
    validateImprovementReferences(output.suggestedImprovements)
    return Response.json({ analysis: output })
  } catch (error) {
    console.error('Error analyzing recipe:', error)
    return Response.json(
      { error: 'Failed to analyze recipe. Please try again.' },
      { status: 500 }
    )
  }
}
