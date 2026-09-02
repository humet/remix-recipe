import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'
import { DEMO_COOKIE } from '@/lib/demo/constants'

/**
 * Paths that must stay reachable without a session, or we'd redirect the
 * login page to itself.
 */
const PUBLIC_PATHS = ['/login', '/auth/signout']

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

/**
 * updateSession may have refreshed the auth tokens and written them onto its
 * own response. Any response we return instead has to inherit those cookies,
 * or the refreshed session is thrown away and the user bounces to /login
 * while holding a perfectly valid session.
 */
function inheritCookies(from: NextResponse, to: NextResponse) {
  for (const cookie of from.cookies.getAll()) {
    to.cookies.set(cookie)
  }
  return to
}

export async function proxy(request: NextRequest) {
  // Refreshing the session on every request is what keeps the login alive
  // indefinitely.
  const { response, user } = await updateSession(request)

  // A real session always wins over a lingering demo cookie.
  if (user) {
    if (request.cookies.has(DEMO_COOKIE)) {
      response.cookies.delete(DEMO_COOKIE)
    }
    return response
  }

  const { pathname, search } = request.nextUrl

  if (isPublic(pathname)) {
    return response
  }

  // Demo visitors get through. Everything they can reach is independently
  // guarded — see lib/auth/require-user.ts and lib/data/index.ts.
  if (request.cookies.get(DEMO_COOKIE)?.value === '1') {
    return response
  }

  // API routes get a 401 rather than an HTML redirect.
  if (pathname.startsWith('/api/')) {
    return inheritCookies(
      response,
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    )
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = ''
  if (pathname !== '/') {
    loginUrl.searchParams.set('next', `${pathname}${search}`)
  }

  return inheritCookies(response, NextResponse.redirect(loginUrl))
}

export const config = {
  matcher: [
    /*
     * Everything except static assets, the PWA files, and the QStash webhook
     * (/api/timer-push/send verifies its own signature server-to-server and
     * must not be redirected or 401'd).
     */
    '/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|manifest\\.json|api/timer-push/send|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2)$).*)',
  ],
}
