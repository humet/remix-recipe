# Verifying UI in the real app

The point is to see what the user sees. Do this before designing (to ground the critique) and after building (to check the result).

## 1. Get the app running

1. **Env file.** Worktrees don't get `.env.local`. If it's missing, symlink it from the main checkout (`git worktree list` shows the main checkout's path first):
   `ln -s <main-checkout>/.env.local .env.local`. Don't `cat` it or echo its values; it holds keys. Demo mode doesn't call Supabase or the AI Gateway, but the auth gate in `proxy.ts` still builds a Supabase client, so the two public Supabase variables need to be present.
2. **Dev server.** Start it with the browser pane's `preview_start` using the `dev` entry in `.claude/launch.json` (`pnpm dev`, port 3000). Don't start it with Bash. If the entry is missing, add it.
3. **Enter demo mode.** Go to `/login` and press **Try the demo**. That sets the `remix_demo` cookie and seeds recipes from `lib/demo/fixtures/recipes.ts` into localStorage. Demo never touches real data, which is why it's the only mode to design in. Don't sign in with real credentials to "see real data".

## 2. Match the real device

- `resize_window` with `preset: "mobile"` (375×812) and reload. That's the default viewport for every screenshot.
- Check light and dark. Glass surfaces look very different in each. Note: as of this writing no `ThemeProvider` is mounted, so the app ignores `colorScheme`. To check dark styles, add the class by hand with `document.documentElement.classList.add('dark')` before screenshotting.
- **Keyboard.** The pane can't show a software keyboard, and region zoom isn't supported. Estimate it: when an input is focused, only about the top 400px (roughly the top half of the screenshot) is visible. Ask whether the user can still see what they need there (the first results, the active filters).
- Finish with `preset: "desktop"` to reset the pane.

Prefer `read_page` / `get_page_text` to verify text and structure; use screenshots to judge layout, density and hierarchy.

Pitfalls of the tooling itself, so you don't chase phantom bugs:
- **Screenshot coordinates are in the 375×812 frame**, not the scaled image's pixels. Click by `ref` from `find` where you can.
- **Clicking by `ref` scrolls the element into view first.** That hides or fakes bugs in scroll behaviour (for example "does the chip row scroll back to show what was applied"). Test those with a real `element.click()` in `javascript_tool` after setting `scrollLeft` yourself.
- **The first reload after an edit often serves the old build.** Wait ~5s, reload, and confirm the change is live (check a class name or text you changed with `javascript_tool`) before judging a screenshot.
- **The console log survives reloads and hot reloads.** Before debugging an error, check that the chunk in its stack trace is still loaded (`[...document.scripts].map(s => s.src)`); edits made mid-flight leave stale errors and hydration mismatches behind.
- To test an empty library, back up `localStorage['remix:demo:v2']`, set its `recipes` to `[]`, reload, then restore it.

## 3. Exercise the states, not just the happy path

For a list, search or filter screen, capture at least:

| State | How |
|---|---|
| Resting | Fresh load, no query |
| Typical query | A realistic query that should hit, e.g. an ingredient |
| Multi-word query | Words in a different order from the title |
| Typo / plural | `tomatos`, `chickpea` vs `chickpeas` |
| No results | Something absent from the library |
| One result | Narrow query |
| Filter + query | A tag selected, then type |
| Back navigation | Open a result, then tap the **in-app** back button (never the browser's; the installed app has none). Is the query, filter and scroll kept? Also open the page directly in a fresh tab: does back fall back somewhere sensible? |
| Overflow | Longest title, most tags, long description |
| Empty library | Clear the demo store (localStorage) and reload |

Other screens have their own equivalents (loading, error, first-run, full). Write down the list before you start so the same states get checked before and after.

## 4. Enough data to judge

The shipped demo fixtures have 4 recipes. For list, search or ranking work, add synthetic recipes to `lib/demo/fixtures/recipes.ts` first, aiming for about 25–40. Cover the cases that make search hard:

- shared ingredients across recipes (several chicken dishes, several with rice);
- words that hide inside other words (egg/veggie/eggplant, rice/price, ham/graham, pie/piece);
- plurals and accents (tomato/tomatoes, jalapeño);
- similar titles (two curries, two traybakes);
- a spread of times and difficulties, some favourited, some recently opened;
- near-duplicate tags (`one-pot` / `one pot`), and at least one very long title.

These are invented recipes. Never copy the user's saved recipes into fixtures, screenshots or commits. Their library is their data. The fixtures also improve the public demo, so keep them realistic and well written.

## 5. Report

Put before/after screenshots next to each other when the change is visual. Name any state you couldn't check and why.
