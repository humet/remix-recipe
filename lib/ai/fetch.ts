import { isDemoMode } from '@/lib/demo/mode'
import { demoAiResponse, type DemoAiRoute } from '@/lib/demo/ai'

/**
 * The single seam between the app and the AI routes.
 *
 * In demo mode this resolves a canned fixture and never opens a request, so
 * no AI Gateway tokens can be spent. It returns a `Response` rather than
 * parsed JSON so every call site keeps its own `response.ok` handling — some
 * read `errorData.error`, some throw, and improvement-suggestions fails open.
 *
 * Deliberately NOT a window.fetch monkeypatch: that would also intercept the
 * Supabase browser client, the service-worker registration and analytics.
 */
export async function aiFetch(route: DemoAiRoute, body: unknown): Promise<Response> {
  if (isDemoMode()) {
    const data = await demoAiResponse(route, (body ?? {}) as Record<string, unknown>)
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return fetch(route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export type { DemoAiRoute }
