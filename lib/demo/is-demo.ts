import { cookies } from 'next/headers'
import { DEMO_COOKIE } from './constants'

/** Server-side demo check. Safe in Server Components and route handlers. */
export async function isDemoRequest(): Promise<boolean> {
  const cookieStore = await cookies()
  return cookieStore.get(DEMO_COOKIE)?.value === '1'
}
