'use client'

import { useActionState } from 'react'
import { Loader2, LogIn, Sparkles } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { signIn, enterDemo, type SignInState } from './actions'

const initialState: SignInState = { error: null }

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, isPending] = useActionState(signIn, initialState)

  return (
    <div className="flex flex-col gap-6 p-5 pt-8 w-full max-w-md mx-auto">
      <div className="flex flex-col items-center gap-4 pb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/remix-logo.svg" alt="Remix" className="h-40 w-40" />
        <p className="text-sm text-muted-foreground">Remix any recipe to make it yours</p>
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={next ?? '/'} />

        <div className="glass rounded-2xl p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              className="h-12 rounded-xl text-base"
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="h-12 rounded-xl text-base"
              placeholder="••••••••"
            />
          </div>
        </div>

        {state.error && (
          <div
            role="alert"
            className="p-4 glass rounded-2xl border-l-4 border-destructive text-destructive text-sm text-center"
          >
            {state.error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="h-14 rounded-2xl text-base font-semibold gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign in
            </>
          )}
        </button>
      </form>

      <form action={enterDemo} className="flex flex-col gap-2">
        <div className="flex items-center gap-3 py-1">
          <div className="h-px flex-1 bg-border/60" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <button
          type="submit"
          className="w-full glass rounded-2xl p-4 hover:ring-2 hover:ring-primary/30 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-3 text-left"
        >
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary/10 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">Try the demo</h3>
            <p className="text-xs text-muted-foreground">
              Explore with sample recipes — no account needed
            </p>
          </div>
        </button>
      </form>
    </div>
  )
}
