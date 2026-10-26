import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)

async function main() {
  // Stub the AI and session guard before loading the route; no network or keys.
  let calls: string[] = []
  let compatible: boolean | undefined = true
  require.cache[require.resolve('ai')] = { exports: {
    Output: { object: (value: unknown) => value },
    generateText: async ({ prompt }: { prompt: string }) => {
      calls.push(prompt)
      if (prompt.startsWith('Check whether')) {
        return { output: compatible === undefined ? undefined : { compatible, reason: compatible ? null : 'Choose either yoghurt or coconut milk.' } }
      }
      return { output: { title: 'Remixed recipe', improvements: ['Added lemon'], tags: [] } }
    },
  } } as NodeJS.Module
  require.cache[require.resolve('../lib/auth/require-user.ts')] = { exports: {
    requireUser: async () => ({ response: null }),
  } } as NodeJS.Module
  const { POST } = await import('../app/api/improve-recipe/route')
  async function request(selectedImprovements: unknown[], customRequest = '') {
    calls = []
    return POST(new Request('http://localhost/api/improve-recipe', {
      method: 'POST', body: JSON.stringify({ parsedRecipe: 'Cream sauce', selectedImprovements, customRequest }),
    }))
  }
  const yoghurt = { id: 'yoghurt', title: 'Use yoghurt', description: 'Replace cream with yoghurt', conflicts: [{ improvementId: 'coconut', reason: 'Alternative replacements for the cream' }] }
  const coconut = { id: 'coconut', title: 'Use coconut milk', description: 'Replace cream with coconut milk' }
  assert.equal((await request([yoghurt, coconut])).status, 409)
  assert.equal(calls.length, 0, 'Known conflicts must not call the AI')
  compatible = false
  const response = await request([yoghurt], 'Use coconut milk instead of cream')
  assert.equal(response.status, 409)
  assert.match((await response.json()).error, /either yoghurt or coconut/)
  assert.equal(calls.length, 1, 'Custom conflicts must not rewrite the recipe')
  assert.match(calls[0], /Use coconut milk instead of cream/)
  assert.equal((await request([], 'Use yoghurt and coconut milk as alternative replacements')).status, 409)
  assert.equal(calls.length, 1, 'Custom-only contradictions must also be checked')
  compatible = true
  assert.equal((await request([yoghurt])).status, 200)
  assert.equal(calls.length, 2, 'Compatible requests are checked and then rewritten')
  assert.equal((await request([{ title: 'Add lemon', description: 'Finish with lemon juice' }])).status, 200)
  assert.equal(calls.length, 2, 'Legacy suggestions without IDs remain supported')
  assert.equal((await request([])).status, 200)
  assert.equal(calls.length, 1, 'Formatting alone needs no compatibility call')
  compatible = undefined
  assert.equal((await request([yoghurt])).status, 500)
  assert.equal(calls.length, 1, 'Missing compatibility results must not fail open')
  assert.equal((await request([{ title: 123 }])).status, 400)
  assert.equal(calls.length, 0)
  console.log('Recipe improvement route checks passed')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
