import 'server-only'
import { createClient } from '@/lib/supabase/server'

/**
 * Defence in depth for route handlers. The root proxy is the primary gate,
 * but every AI route also refuses unauthenticated callers so demo traffic
 * can never reach the AI Gateway.
 *
 * Uses getClaims() rather than getUser(): it verifies the JWT locally
 * against a cached JWKS, so there's no auth round trip on the hot path of a
 * streaming route.
 *
 * Usage:
 *   const { response: unauthorized } = await requireUser()
 *   if (unauthorized) return unauthorized
 */
export async function requireUser(): Promise<{ response?: Response }> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()

  if (error || !data?.claims) {
    return { response: Response.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  return {}
}
