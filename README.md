# Remix - Recipe Remixer

An AI-powered recipe app that lets you remix any recipe — make it healthier, tastier, or perfectly suited to your kitchen.

Paste or photograph a recipe, pick from AI-suggested improvements, then interact with the result: scale servings, swap or remove ingredients, and set cooking timers with audio alerts.

## Features

- **Recipe input** — paste text or upload/photograph a recipe image
- **AI analysis** — extracts and parses recipes, then suggests 4-6 targeted improvements (healthier, tastier, kid-friendly, easier, faster, vegetarian, budget-friendly, better presentation)
- **Interactive recipe view** — step-by-step instructions with inline measurements
- **Serving scaler** — proportionally adjusts all ingredients and instructions
- **Ingredient swaps** — get AI-suggested alternatives for any ingredient and apply them throughout
- **Ingredient removal** — adapt the recipe to work without a specific ingredient
- **Cooking timers** — per-step timers with Web Audio beeps, notifications, wake lock, and vibration
- **Save recipes** — persist improved recipes to Supabase
- **Dark mode** — full light/dark theme support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 |
| AI | Vercel AI SDK with Google Gemini 3 Flash |
| Styling | Tailwind CSS v4 |
| UI Components | shadcn/ui (Radix primitives) |
| Validation | Zod |
| Database | Supabase (PostgreSQL) |
| Package Manager | pnpm |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- A [Supabase](https://supabase.com) project
### Setup

1. Clone the repository:

   ```bash
   git clone <repo-url>
   cd ai-recipe-app
   pnpm install
   ```

2. Create a `.env.local` file:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   AI_GATEWAY_API_KEY=your-ai-gateway-key
   ```

   AI model requests (`google/gemini-3-flash`) are routed through the Vercel AI Gateway.

3. Set up the database by running `scripts/001_create_saved_recipes.sql` in your Supabase SQL editor.

4. Start the dev server:

   ```bash
   pnpm dev
   ```

## Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Production build
pnpm start    # Start production server
pnpm lint     # Run ESLint
```

## Project Structure

```
app/
  page.tsx              # Main app (input → suggestions → result state machine)
  api/                  # AI-powered API routes (analyze, improve, scale, swap, remove)
  layout.tsx            # Root layout with metadata and fonts
components/
  recipe-input.tsx      # Text/image recipe input
  improvement-suggestions.tsx
  recipe-display.tsx    # Interactive recipe view
  saved-recipes.tsx     # Saved recipe list
  ui/                   # shadcn/ui component library
hooks/
  use-timers.ts         # Multi-timer system with audio/notifications
lib/
  recipe-types.ts       # Core TypeScript interfaces
  supabase/             # Supabase client setup (browser, SSR, middleware)
scripts/
  001_create_saved_recipes.sql
```
