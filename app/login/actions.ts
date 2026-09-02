'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DEMO_COOKIE, DEMO_COOKIE_MAX_AGE } from '@/lib/demo/constants'

export type SignInState = { error: string | null }

/** Only allow same-origin relative paths through the `next` param. */
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === 'string' ? value : ''
  if (!next.startsWith('/') || next.startsWith('//')) return '/'
  return next
}

export async function signIn(
  _prevState: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (!email || !password) {
    return { error: 'Enter your email and password.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: 'That email and password combination didn’t work.' }
  }

  // Leaving demo behind on a real sign-in.
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)

  // The router cache may still hold the pre-login tree.
  revalidatePath('/', 'layout')

  redirect(safeNext(formData.get('next')))
}

export async function enterDemo() {
  const cookieStore = await cookies()
  cookieStore.set(DEMO_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: DEMO_COOKIE_MAX_AGE,
  })

  revalidatePath('/', 'layout')
  redirect('/')
}

export async function exitDemo() {
  const cookieStore = await cookies()
  cookieStore.delete(DEMO_COOKIE)

  revalidatePath('/', 'layout')
  redirect('/login')
}
