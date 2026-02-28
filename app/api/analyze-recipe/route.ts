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

    const messages: Array<{ role: 'user'; content: Array<{ type: string; text?: string; image?: string; mediaType?: string }> }> = [
      {
        role: 'user',
        content: [],
      },
    ]

    // Add all images if provided
    if (images && images.length > 0) {
      for (const img of images) {
        messages[0].content.push({
          type: 'image',
          image: img.base64,
          mediaType: img.mediaType || 'image/jpeg',
        })
      }
    }

    const hasImages = images && images.length > 0

    // Add text prompt
    messages[0].content.push({
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

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: analysisSchema,
      }),
      messages,
    })

    return Response.json({ analysis: output })
  } catch (error) {
    console.error('Error analyzing recipe:', error)
    return Response.json(
      { error: 'Failed to analyze recipe. Please try again.' },
      { status: 500 }
    )
  }
}
