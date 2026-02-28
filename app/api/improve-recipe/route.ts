import { generateText, Output } from 'ai'
import { z } from 'zod'

const improvedRecipeSchema = z.object({
  title: z.string().describe('The recipe title'),
  description: z.string().describe('A brief, appetizing description of the dish'),
  prepTime: z.string().describe('Preparation time (e.g., "15 mins")'),
  cookTime: z.string().describe('Cooking time (e.g., "30 mins")'),
  servings: z.string().describe('Number of servings'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']).describe('Recipe difficulty level'),
  ingredients: z.array(
    z.object({
      name: z.string().describe('Ingredient name'),
      amount: z.string().describe('Amount with unit (e.g., "200g", "2 tbsp", "1 cup")'),
      notes: z.string().nullable().describe('Optional notes like "finely chopped" or "room temperature"'),
    })
  ).describe('List of all ingredients with precise measurements'),
  steps: z.array(
    z.object({
      stepNumber: z.number().describe('Step number starting from 1'),
      instruction: z.string().describe('Clear, detailed instruction for this step. When any ingredient is mentioned, ALWAYS include the amount/measurement in parentheses immediately after the ingredient name, e.g., "Add the flour (200g) and sugar (100g) to the bowl"'),
      tips: z.string().nullable().describe('Optional helpful tip for this step'),
      timing: z.string().nullable().describe('Optional timing for this step (e.g., "2-3 minutes")'),
    })
  ).describe('Step-by-step instructions with inline measurements'),
  proTips: z.array(z.string()).describe('2-3 professional tips to elevate the dish'),
  improvements: z.array(z.string()).describe('3-5 brief bullet points summarizing the key improvements made to the original recipe, such as clarified instructions, better techniques, adjusted proportions, or added tips'),
})

export async function POST(req: Request) {
  try {
    const { parsedRecipe, selectedImprovements, customRequest } = await req.json() as { 
      parsedRecipe: string
      selectedImprovements: { title: string; description: string }[]
      customRequest?: string
    }

    const hasImprovements = selectedImprovements.length > 0 || customRequest

    let improvementInstructions = ''
    if (selectedImprovements.length > 0) {
      improvementInstructions = `\n\nAPPLY THESE IMPROVEMENTS:\n${selectedImprovements.map((imp, i) => `${i + 1}. ${imp.title}: ${imp.description}`).join('\n')}`
    }
    if (customRequest) {
      improvementInstructions += `\n\nUSER'S CUSTOM REQUEST:\n${customRequest}`
    }

    const prompt = `You are an expert chef and recipe writer. Convert the following recipe into a clear, user-friendly format.

CRITICAL REQUIREMENTS:
1. In EVERY step instruction, when you mention an ingredient, you MUST include the measurement in parentheses right after the ingredient name. For example: "Add the butter (50g) to the pan" or "Mix in the flour (2 cups) with the sugar (100g)".
2. Never assume the user knows amounts - always be explicit with measurements in the instructions.
3. Make instructions clear and beginner-friendly.
4. Add helpful tips where appropriate.
${hasImprovements ? improvementInstructions : ''}

${hasImprovements ? `\nIn the "improvements" field, list the specific changes you made based on the requested improvements above.` : `\nIn the "improvements" field, note any clarifications or formatting improvements you made to the original recipe (no taste/ingredient changes were requested).`}

Recipe to process:
${parsedRecipe}`

    const { output } = await generateText({
      model: 'anthropic/claude-sonnet-4.6',
      output: Output.object({
        schema: improvedRecipeSchema,
      }),
      prompt,
    })

    return Response.json({ recipe: output })
  } catch (error) {
    console.error('Error improving recipe:', error)
    return Response.json(
      { error: 'Failed to improve recipe. Please try again.' },
      { status: 500 }
    )
  }
}
