# Remix — AI-powered Recipe Remixer

Remix is a mobile-first cooking companion that can take an existing recipe and intelligently adapt it to the way you actually want to cook.

Paste a recipe or photograph one, choose from targeted AI suggestions, then work with the result interactively: scale servings, swap/remove ingredients, save recipes, and run cooking timers that continue to notify you when the app is backgrounded.

## Why I built this

I was already using ChatGPT to adapt recipes I found online — changing quantities, swapping ingredients, simplifying methods, or improving them to suit how I actually cook.

The problem was that the useful version of the recipe then lived inside a chat.

I couldn't easily save the edited recipe, and the chat interface wasn't a particularly good cooking interface either. While cooking, I didn't want to keep scrolling backwards and forwards between ingredients, quantities, and method steps.

I also wanted something cleaner than many recipe websites, where the actual recipe can be buried beneath ads, pop-ups, and long-form content.

Remix grew out of those frustrations: a place to import a recipe, turn it into structured recipe data, improve or adapt it with AI, save the result, and then actually cook from it in an interface designed for the kitchen.

The goal is for AI to be useful without getting in the way — helping reshape the recipe while the application keeps the result structured, persistent, and practical.

## Features

- **Recipe input** — paste text or upload/photograph a recipe image
- **AI analysis** — extracts and parses recipes, then suggests targeted improvements such as healthier, tastier, kid-friendly, easier, faster, vegetarian, budget-friendly, or better-presented
- **Interactive recipe view** — step-by-step instructions with inline measurements
- **Serving scaler** — proportionally adjusts ingredients and relevant instructions
- **Ingredient swaps** — request alternatives for an ingredient and apply them throughout the recipe
- **Ingredient removal** — adapt the recipe to work without a specific ingredient
- **Saved recipe library** — favourites, recents, search, and tag filtering
- **Cooking timers** — per-step timers with Web Audio alerts, notifications, wake lock, and vibration
- **Push notifications** — timer alerts via web push even when the app is backgrounded or the phone is locked (including iOS PWA support)
- **Offline support** — service worker caches the app shell for offline loading
- **Persistence** — saved recipes stored in Supabase
- **Dark mode** — full light/dark theme support

## AI architecture

Model requests are routed through **Vercel AI Gateway** using the Vercel AI SDK.

The app uses typed/validated outputs rather than treating model responses as trusted free-form application state. AI is used for tasks where semantic judgment is useful — parsing, suggesting improvements, recipe transformations, swaps, and validation — while deterministic application code owns persistence, timers, UI state, and other product behaviour.

Recent work has also focused on common production failure modes rather than just adding features: handling declined AI suggestions correctly, classifying/retrying errors, reducing tag proliferation, and validating custom requests before sending them to more expensive generation paths.

## Tech stack

| Layer | Technology |
| --- | --- |
| Framework | Next.js 16 (App Router) + React 19 |
| AI | Vercel AI SDK + AI Gateway |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui / Radix primitives |
| Validation | Zod |
| Database | Supabase (PostgreSQL) |
| Push | web-push (VAPID) + Service Worker |
| Scheduling | QStash |
| Package Manager | pnpm |

## Development approach

This is a personal product built heavily with AI-assisted engineering, including coding agents. AI-generated implementation is treated as a starting point rather than an authority: changes are reviewed against the intended product behaviour, typed boundaries, build/lint checks, and real usage of the app.

The project is deliberately useful as a product, not a benchmark demo — a lot of the work has come from using it on a phone while actually cooking and fixing the rough edges that only appear there.

## Getting started

### Prerequisites

- Node.js 18+
- pnpm
- a Supabase project
- a Vercel AI Gateway key

### Setup

```bash
git clone <repo-url>
cd ai-recipe-app
pnpm install
cp .env.example .env.local
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000).

Environment variables are documented in [`.env.example`](.env.example).

Set up the database by running the migration scripts in your Supabase SQL editor.

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Project structure

```text
app/
  page.tsx              # Main app/product entry point
  api/                  # AI-powered API routes and backend actions
  layout.tsx            # Root layout with metadata/fonts
components/
  recipe-input.tsx      # Text/image recipe input
  improvement-suggestions.tsx
  recipe-display.tsx    # Interactive recipe view
  saved-recipes.tsx     # Saved recipe/library UI
  ui/                   # Shared UI primitives
hooks/
  use-timers.ts         # Multi-timer system with audio/notifications/push
lib/
  push-utils.ts         # Push-notification utilities
  recipe-types.ts       # Core TypeScript interfaces
  supabase/             # Supabase browser/SSR setup
public/
  sw.js                 # Service worker (caching + push notifications)
scripts/
  *.sql                 # Database migrations
```

## Public-repository note

Credentials, local environment files, and personal Claude Code memory/settings are intentionally ignored. Before deploying your own copy, provide your own Supabase, AI Gateway, push, and QStash credentials through environment variables.
