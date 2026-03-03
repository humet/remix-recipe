# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI-powered recipe app ("Remix - Recipe Remixer") built with Next.js 16 and React 19. Users input recipes via text or images, get AI-suggested improvements, then can scale, swap/remove ingredients, and set cooking timers. Recipes can be saved to Supabase.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm start        # Start production server
```

Package manager is **pnpm**. No test framework is configured.

## Architecture

### App Flow (State Machine in `app/page.tsx`)

The app is a single-page client component with three states:
1. **`input`** — `RecipeInput`: user enters recipe text or uploads images
2. **`suggestions`** — `ImprovementSuggestions`: user picks from AI-suggested improvements
3. **`result`** — `RecipeDisplay`: interactive recipe view with scaling, swaps, timers

### API Routes (`app/api/`)

All routes use Vercel AI SDK's `generateText` with **Google Gemini 3 Flash** (`google/gemini-3-flash`) and Zod schemas for structured output:

- **`/api/analyze-recipe`** — Parse recipe from text/images, suggest 4-6 improvements
- **`/api/improve-recipe`** — Apply selected improvements, return formatted recipe
- **`/api/scale-recipe`** — Scale ingredients/instructions to new serving count
- **`/api/swap-ingredient`** — Get alternative ingredients for a given ingredient
- **`/api/apply-swap`** — Apply an ingredient substitution throughout the recipe
- **`/api/remove-ingredient`** — Adapt recipe to work without an ingredient

### Data Layer

- **Supabase** (PostgreSQL) with a single `saved_recipes` table storing JSONB recipe data
- Client setup: `lib/supabase/client.ts` (browser), `lib/supabase/server.ts` (SSR), `lib/supabase/proxy.ts` (middleware)
- RLS policies exist but auth is not enforced at the application level
- Database schema in `scripts/setup-saved-recipes.sql`

### Key Directories

- `components/` — React components (all `'use client'`)
- `components/ui/` — shadcn/ui component library (New York style, Radix-based)
- `hooks/` — `use-timers.ts` (multi-timer with Web Audio API, wake lock, notifications), `use-mobile.ts`
- `lib/recipe-types.ts` — Core TypeScript interfaces (`ImprovedRecipe`, `RecipeAnalysis`, `Ingredient`, `RecipeStep`)
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
GOOGLE_GENERATIVE_AI_API_KEY=
```

## Conventions

- Path alias: `@/*` maps to project root
- TypeScript strict mode enabled; `ignoreBuildErrors: true` in next.config.mjs
- Images are unoptimized in Next.js config (static export compatibility)
- Vercel Analytics is currently disabled due to a runtime error
