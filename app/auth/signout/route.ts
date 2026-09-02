import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { DEMO_COOKIE } from '@/lib/demo/constants'

export async function POST(request: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)

  return NextResponse.redirect(new URL('/login', request.url), { status: 303 })
}
