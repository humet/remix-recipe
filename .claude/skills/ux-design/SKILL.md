---
name: ux-design
description: How to design, critique and verify user experience in the Remix recipe app — layout, flows, search and filtering, navigation, forms, empty/error/loading states, and interaction details on a phone. Use this skill whenever a task changes what a user sees or does in this app, even if the request never says "UX": redesigning or adding a screen or component, "search isn't useful", "this feels clunky", "results aren't relevant", "tidy up this page", filters, sheets, lists, cards, onboarding, empty states, or reviewing someone's UI change. It supplies the process (understand the job → look at the real screen → critique → design → build → re-look), the app's context of use, and search-specific guidance. Pair it with frontend-design only when the job is purely visual style.
---

# UX design for Remix

This skill exists because the usual failure isn't a lack of knowledge about good UX. It's writing JSX without looking at the result, designing from the component library outward ("we have `Badge`, so: pills"), and calling it done once it compiles. Every step below is there to stop one of those.

## Who is using this, and where

Design for this situation, not a generic "user":

- **One person, their own recipe library.** Tens to low hundreds of recipes, written by them or by the AI. They know roughly what they have. Search is mostly *re-finding* ("that harissa thing") and *deciding* ("what can I make with leeks and 30 minutes").
- **A phone, often in a kitchen.** One hand is busy or messy. The phone might be propped on a counter at arm's length. Attention comes in glances, sometimes mid-task with a timer running.
- **The screen keyboard takes nearly half the display.** While typing in search, roughly the top 400px of an 812px screen is all that's visible. Whatever matters most has to fit there.
- **It's installed as an app, with no browser chrome** (`"display": "standalone"` in `app/manifest.json`). There's no browser Back button or address bar, so every screen needs its own way back, and "Back" means the in-app button. Saved recipes use `canGoBackInApp()` from `lib/navigation.ts`: return to the previous in-app page, or fall back to a sensible parent.
- **The core action is "Remix".** Paste or photograph a recipe, get improvements. Dead ends elsewhere in the app should lead back to it where that makes sense.

## The process

### 1. Name the job before touching layout

Write one or two sentences: what is the user trying to get done on this screen, and what does "done" look like? For search: "find the recipe I'm thinking of in one or two taps", or "see what I could cook with what's in the fridge". If you can't state the job, you can't judge any design against it. When the request is vague ("improve search"), list the jobs you think it serves and check them with the user if they genuinely diverge.

### 2. Look at the real screen first

Open the current UI in the browser pane and screenshot it before proposing anything. Code shows you structure; only the rendered screen shows what's actually visible, how cramped it is, what's behind the keyboard, and how it feels. The steps are in [references/verification.md](references/verification.md): dev server, demo mode, phone viewport, light and dark, the states to exercise.

Demo mode ships very little data (4 recipes). For any list, search or filter work that's too few to judge anything. Add synthetic fixtures first (see verification.md). Never test against, copy or screenshot the user's real saved recipes.

### 3. Critique before designing

Write a short critique of what's there, ranked by how much each problem gets in the way of the job, with evidence from the screenshot or the code (`file:line`). Use [references/heuristics.md](references/heuristics.md) as the checklist. For search, filters or any "find a thing" screen, also read [references/search.md](references/search.md). It covers matching, ranking and result presentation, which is where search relevance lives, and none of it shows up in a screenshot.

Separate the problems into three kinds, because they get fixed differently:
- **Behaviour**: what the system does. Matching, ranking, what a tap does, persistence.
- **Structure**: what's on the screen and in what order. Hierarchy, what's hidden, what's shown first.
- **Surface**: spacing, type, colour, copy.

Surface fixes can't rescue a behaviour problem. Irrelevant search results are a ranking problem, not a styling one.

### 4. Design, then check it's the simplest thing that works

For anything beyond a small fix, sketch 2 options in words (or a quick mockup if layout is the question), give each one's trade-off, and pick one. Then subtract: for each element you're adding, ask what the user loses if it's gone. The strongest move is often removing or merging things, not adding a toggle, chip or explanatory line.

Taste calls, where both options work and it's preference, go to the user. Usability calls, where one option measurably gets in the way, are yours: make them and say why.

### 5. Build it in the house style

- Use the existing primitives: `components/ui/*` (shadcn, New York), `.glass` / `.glass-subtle` / `.glass-strong` from `app/globals.css`, OKLch tokens (`--primary`, `--muted-foreground`, etc.), and `--radius`. Don't invent colours or one-off shadows.
- Touch targets are at least 44×44px, including secondary ones (tag chips inside cards, clear buttons, favourite and delete). The existing `h-11 w-11` icon buttons are the house size.
- Anything irreversible (delete) needs a confirm or an undo toast. It should never sit one mis-tap away from the card's main tap area with no way back.
- Every icon-only button gets an `aria-label`.
- Keep layout stable while typing or toggling. Don't show or hide whole sections on keystroke under the user's thumb.

### 6. Re-look, compare, and be honest

Screenshot the same states as step 2, in the same viewport, and compare before against after. Check the things you *didn't* change still work (dark mode, the empty library, long titles). Then report:

- what changed and why, tied to the job from step 1;
- before/after screenshots when the change is visual;
- what's still weak or untested. A design isn't done because it compiles; say plainly if something only half-works.

## Traps to catch yourself in

These come up again and again in AI-built UI. If you notice one, stop and rethink:

- **Sorting that ignores intent.** A list sorted by favourite or recency while the user is searching. Once there's a query, relevance comes first.
- **Counts and labels that lie.** Filter counts computed on the whole library while other filters are active, so a tap leads to zero results.
- **Dead-end empty states.** "No results." with nothing to do next. Offer the nearest thing: loosen the query, clear a filter, or start a Remix with it.
- **Truncating what people recognise things by.** Titles and names are how a user tells items apart, and a clamp can hide the very word that matched. Let the primary label wrap. Shorten secondary lines (descriptions, metadata) instead.
- **Wall-of-pills.** Twelve tag chips above the content push results below the fold, especially with the keyboard up.
- **Controls that vanish.** Hiding filters or tabs when a condition changes, so the user can't find them again.
- **Silent state loss.** Search text, filters or scroll position gone after opening an item and coming back. Put meaningful state in the URL.
- **Decoration standing in for hierarchy.** More badges, borders and icons when what's needed is a clear order of importance.
- **Only checking the happy path**, and only in light mode.

## Reference files

- [references/verification.md](references/verification.md): running the app in demo mode, phone viewport, which states to screenshot, synthetic fixtures. Read it every time you do step 2 or 6.
- [references/heuristics.md](references/heuristics.md): the general usability checklist for step 3.
- [references/search.md](references/search.md): matching, ranking, result display, filters, no-results, and building a relevance test set. Read it for any search, filter or picker work.
