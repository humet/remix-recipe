# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered recipe app ("Remix - Recipe Remixer") built with Next.js 16 and React 19. Users input recipes via text or images, get AI-suggested improvements, then can scale, swap/remove ingredients, and set cooking timers. Recipes can be saved to Supabase.

The app is **single-user and behind a login**, with an opt-in **demo mode** that runs entirely on fixtures.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm start        # Start production server
pnpm search:check # Recipe search relevance cases against the demo fixtures (--legacy: old matcher)
```

Package manager is **pnpm**. No test framework is configured.

## Architecture

### App Flow (State Machine in `app/page.tsx`)

The app is a single-page client component with three states:
1. **`input`** — `RecipeInput`: user enters recipe text or uploads images
2. **`suggestions`** — `ImprovementSuggestions`: user picks from AI-suggested improvements
3. **`result`** — `RecipeDisplay`: interactive recipe view with scaling, swaps, timers

### API Routes (`app/api/`)

AI routes use Vercel AI SDK's `generateText` with **Google Gemini 3 Flash** (`google/gemini-3-flash`) and Zod schemas for structured output:

- **`/api/analyze-recipe`** — Parse recipe from text/images, suggest 4-6 improvements
- **`/api/improve-recipe`** — Apply selected improvements, return formatted recipe
- **`/api/scale-recipe`** — Scale ingredients/instructions to new serving count
- **`/api/swap-ingredient`** — Get alternative ingredients for a given ingredient
- **`/api/apply-swap`** — Apply an ingredient substitution throughout the recipe
- **`/api/remove-ingredient`** — Adapt recipe to work without an ingredient
- **`/api/ask-recipe`** — Streaming recipe Q&A (`streamText` + tool approval, `runtime = 'edge'`)
- **`/api/validate-request`** — Cheap gate on custom improvement requests; fails open

Non-AI routes: **`/api/timer-push/{schedule,cancel,send}`** for QStash-scheduled web-push timer alerts.

**Every route above requires a session** via `requireUser()` from `lib/auth/require-user.ts` — except `timer-push/send`, which QStash calls server-to-server and which verifies its own signature. Do not add the guard there.

### Auth and demo mode

- **Gate:** `proxy.ts` at the repo root (Next.js 16's middleware convention — `export async function proxy()`). It refreshes the Supabase session via `updateSession()` from `lib/supabase/proxy.ts`, then passes authed users through, lets demo-cookie holders through, and redirects everyone else to `/login` (API routes get a 401). Redirects inherit the refreshed cookies — see `inheritCookies()`; skipping that causes a refresh loop.
- **Auth:** Supabase email/password. One user, created by hand in the dashboard. No sign-up route.
- **Demo mode:** the `remix_demo` cookie. Same routes, no page duplication. Read server-side by `isDemoRequest()` (`lib/demo/is-demo.ts`) in `app/layout.tsx`, passed into `Providers`, and exposed as `useDemoMode()`. `lib/demo/mode.ts` mirrors it for non-React callers and is `typeof window`-guarded so it can never leak across server requests.
- **Demo data:** `lib/demo/fixtures/recipes.ts` seeded into a localStorage store (`lib/demo/store.ts`). **Demo never touches Supabase or the AI Gateway.**
- **Demo AI:** `aiFetch()` (`lib/ai/fetch.ts`) is the single seam. It returns a `Response` so each call site keeps its own error handling, and in demo resolves fixtures from `lib/demo/fixtures/ai.ts`. Never monkeypatch `window.fetch` here — it would also intercept the Supabase client and the service worker.
- Recipe Q&A (`components/recipe-qa-sheet.tsx`) is the one feature disabled in demo; faking the streaming tool-approval transport isn't worth it.

### Session restore

iOS evicts a backgrounded PWA and relaunches it at `/`, which used to drop the user mid-cook. `lib/cook-session.ts` keeps one session in localStorage (`remix:cook-session:v1:{demo|live}`): the flow state of `app/page.tsx` or `app/recipe/[id]/recipe-page-client.tsx`, RecipeDisplay's progress (view, step, completed steps, scaled/swapped recipe), and timers (wall-clock `endsAt`, so they catch up on restore).

- On a fresh document load at `/` (or `/login`), home auto-restores: it hydrates its own flow, or `router.replace`s to the saved recipe. Arriving at home by in-app navigation shows `ResumeCookCard` instead.
- The saved recipe page is server-rendered, so it restores after hydration and remounts RecipeDisplay via its `key`. RecipeDisplay never reads storage itself; it takes `restoreSnapshot` and only writes once `persist` is true.
- The session is cleared by the Home button, starting a new recipe, sign-out (both namespaces), and "Done!" on a saved recipe with no running timers. It expires after 24h.

### Data Layer

- **Supabase** (PostgreSQL): `saved_recipes` (JSONB recipe data), `meal_plan_entries`, `push_timers`
- **All app data access goes through `lib/data/`** — `index.ts` is the facade that dispatches per call to `supabase-backend.ts` or `demo-backend.ts`. Only `lib/data/*` should import `lib/supabase/client`. Server components use `lib/data/server.ts`.
- Client setup: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (SSR), `lib/supabase/proxy.ts` (used by root `proxy.ts`)
- RLS is deliberately permissive; protection is the edge gate plus the per-route session check. `scripts/005_document_actual_schema.sql` records the real schema and the multi-user upgrade path.
- Migrations: `scripts/00{1..5}_*.sql`, run in order
- Cross-component refresh is a window-event bus (`lib/events.ts`), not SWR — writes must `emitDataChange('recipes-changed' | 'meal-plan-changed')`

### Key Directories

- `components/` — React components (all `'use client'`)
- `components/ui/` — shadcn/ui component library (New York style, Radix-based)
- `hooks/` — `use-timers.ts` (multi-timer with Web Audio API, wake lock, notifications), `use-mobile.ts`
- `lib/recipe-types.ts` — Core TypeScript interfaces (`ImprovedRecipe`, `RecipeAnalysis`, `Ingredient`, `RecipeStep`, `MealPlanEntry`)
- `lib/data/` — Repository layer (facade + Supabase/demo backends)
- `lib/demo/` — Demo flag, localStorage store, and fixtures (bump the store key in `store.ts` when fixtures change)
- `lib/search/recipe-search.ts` — Pure recipe matcher/scorer; `hooks/use-recipe-filter.ts` wraps it with filter state, `components/recipe-search/` renders it for the recipes page and meal-plan picker
- `lib/navigation.ts` — `canGoBackInApp()` for in-app back buttons (the PWA runs standalone, with no browser back)
- `lib/auth/require-user.ts` — Server-side session guard for route handlers
- `lib/hooks/use-toast.ts` — Toast notification system

### Type System

Recipe steps support both legacy `timing?: string` and current `timings?: StepTiming[]` formats for backward compatibility (see `lib/recipe-types.ts`).

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **AI:** Vercel AI SDK (`ai` + `@ai-sdk/openai`) with Google Gemini 3 Flash
- **Styling:** Tailwind CSS v4 with OKLch color tokens and glass morphism effects (`globals.css`)
- **UI Components:** shadcn/ui (59+ Radix-based components)
- **Validation:** Zod (API schemas and forms via react-hook-form)
- **Database:** Supabase (PostgreSQL + JS SDK, no ORM)
- **Theme:** next-themes for dark/light mode

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
AI_GATEWAY_API_KEY=
```

AI model requests (`google/gemini-3-flash`) are routed through the Vercel AI Gateway. Auth needs no additional variables beyond the two Supabase ones.

## Conventions

- UI work: use the project skill `.claude/skills/ux-design` (render in demo mode at phone size, critique, build, re-check)

- Path alias: `@/*` maps to project root
- TypeScript strict mode enabled; `ignoreBuildErrors: true` in next.config.mjs
- Images are unoptimized in Next.js config (static export compatibility)
- Vercel Analytics is currently disabled due to a runtime error
- `public/sw.js` must never cache navigations, or a cached HTML shell bypasses the auth gate. Bump `CACHE_NAME` when changing its caching behaviour.
- `ignoreBuildErrors` means `pnpm build` won't catch type errors — run `pnpm exec tsc --noEmit`
