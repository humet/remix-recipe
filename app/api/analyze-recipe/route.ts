import { generateText, Output } from 'ai'
import { z } from 'zod'

const analysisSchema = z.object({
  title: z.string().describe('The original recipe title'),
  summary: z.string().describe('A brief summary of what this recipe makes'),
  parsedRecipe: z.string().describe('The full recipe text as parsed/extracted, cleaned up for readability'),
  suggestedImprovements: z.array(
    z.object({
      id: z.string().describe('Unique identifier for this suggestion'),
      category: z.enum(['taste', 'health', 'kid-friendly', 'easier', 'faster', 'vegetarian', 'budget', 'presentation']).describe('Category of improvement'),
      title: z.string().describe('Short title for the improvement (e.g., "Add More Vegetables")'),
      description: z.string().describe('Brief explanation of what this improvement does and why it helps'),
    })
  ).describe('4-6 suggested improvements the user can choose to apply'),
})

export async function POST(req: Request) {
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
3. Suggest 4-6 meaningful improvements the user might want to apply. Focus on:
   - Making it taste better (better seasoning, techniques, ingredient swaps)
   - Making it healthier (less fat, more nutrients, lower sodium)
   - Making it kid-friendly (milder flavors, fun presentation)
   - Making it easier (simplified techniques, fewer steps)
   - Making it faster (time-saving tips)
   - Making it vegetarian (plant-based swaps)
   - Budget-friendly alternatives
   - Better presentation tips

Be specific and practical with your suggestions. Each suggestion should be actionable.

${recipeText ? `Recipe to analyze:\n${recipeText}` : 'Please extract and analyze the recipe from the images provided.'}`,
    })

    console.log('[v0] Calling generateText with model: google/gemini-3-flash')
    console.log('[v0] Content items:', content.length)

    const { output } = await generateText({
      model: 'google/gemini-3-flash',
      output: Output.object({
        schema: analysisSchema,
      }),
      messages: [{ role: 'user' as const, content }],
    })

    console.log('[v0] Output received:', !!output)
    return Response.json({ analysis: output })
  } catch (error) {
    console.error('[v0] Error analyzing recipe:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[v0] Error details:', errorMessage)
    return Response.json(
      { error: `Failed to analyze recipe: ${errorMessage}` },
      { status: 500 }
    )
  }
}
