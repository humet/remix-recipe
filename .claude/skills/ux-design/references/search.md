# Search, filters and pickers

Search quality is mostly invisible in a screenshot. A beautiful search box on top of bad matching is still bad search. Work through these layers in order; problems in an earlier layer can't be fixed in a later one.

## Contents
1. Start with a relevance test set
2. Matching: what counts as a hit
3. Ranking: what comes first
4. Presenting results
5. Query input
6. Filters and facets
7. No results and weak results
8. State and persistence
9. Performance
10. Where the code lives here

## 1. Start with a relevance test set

Before changing matching or ranking, write down 12–20 realistic queries against the (synthetic) fixtures, with what should come *first* and what must *not* appear. For example:

| Query | Expect first | Must not appear |
|---|---|---|
| `harissa` | Harissa Chicken Traybake | — |
| `chicken curry` | a chicken curry whose title is worded differently | cookies |
| `egg` | recipes with egg as an ingredient | recipes whose only match is "veggie" |
| `tomatos` | tomato recipes (typo) | — |
| `quick` / `easy` | short total time / Easy difficulty | — |
| `leek potato` | recipes containing both | recipes with only one, above ones with both |

Here that script already exists: `pnpm search:check` (`scripts/search-relevance.ts`), with `--legacy` for the old matcher. Add cases to it rather than writing a new one. Without it, "is search better?" becomes a matter of opinion. Include queries the user actually types; ask them for a few.

**Passing checks aren't enough; read the ranked lists.** Print the top results with their scores and reasons for 6–8 varied queries (single ingredient, intent word like "quick", one letter, a word that's also common in prose like "cream"). In the first pass of this redesign all 28 checks passed while `chicken` still matched "thicken" through typo tolerance, `quick` ranked a 3-hour recipe first because its title said "Quick-Pickled", and step text dragged half the library into `rice`. None of those were in the test set until someone read the output. Turn each surprise into a new case.

## 2. Matching: what counts as a hit

- **Normalise** both query and text: lowercase, strip accents (`normalize('NFD')` and remove combining marks), turn `-`/`_` into spaces, collapse whitespace.
- **Tokenise the query.** Split into words, drop throwaway words ("with", "and", "the", "a", "recipe"). Every remaining word must match *somewhere* in the recipe (AND across words), but words can match different fields and appear in any order.
- **Match at word starts, not anywhere in the string.** `egg` should hit "eggs" and "egg yolk" but not "veggie". Prefix matching on word starts also gives search-as-you-type for free (`chi` → chicken).
- **Loosen plurals and inflections** with a light stemmer (strip `-es`/`-s`, `-ies`→`y`), applied to both sides. Don't pull in a heavy NLP library for this.
- **Tolerate typos** only for words of 5+ letters, up to edit distance 1–2, and only when the word matches *nothing* in the library as typed. Otherwise correctly spelled words pick up near-misses (chicken → "thicken"). Keep it to titles, tags and ingredients; prose is full of near-misses. Short words with typo tolerance match everything.
- **Search every useful field**: title, tags, ingredient *names* and description. Ingredients are the most important field people forget. Step text was tried here and dropped: "serve with rice" is noise, and anything cooked is already in the ingredients.
- **Understand a few practical words** when the data supports them: `quick`/`fast` → short total time, `easy` → difficulty, `veggie`/`vegetarian` → tag. Match intent words against the recipe's properties and tags only, not titles ("Quick-Pickled Cucumber" isn't quick). Keep the list small and explicit; don't guess.
- **Synonyms**: a small hand-written map is enough (`aubergine`↔`eggplant`, `courgette`↔`zucchini`, `coriander`↔`cilantro`, `mince`↔`ground beef`). UK and US names matter.

## 3. Ranking: what comes first

Once there is a query, **relevance comes first**. Favourites and recency only break ties, or add a small boost. They must never lift a weak match above a strong one.

A simple, explainable score beats a clever one. For each query word, take the best field it matched in:

| Match | Rough weight |
|---|---|
| Title, whole word | 10 |
| Title, prefix | 7 |
| Tag | 6 |
| Ingredient name | 5 |
| Description | 2 |
| Typo / fuzzy match | half of the above |

Add bonuses for the whole query appearing as a phrase in the title, and for the title *starting* with the query. Then add a small boost for favourite and recently opened. Keep the scorer a pure function in its own module so it can be tested with the relevance set, and keep the weights in one place.

When there is **no** query (browsing), sorting by favourite, then last opened, then created is right. Don't break that.

## 4. Presenting results

- **Show why it matched** when the reason isn't the title: "Contains leeks, potatoes" or "Tagged one-pot". Without it, ingredient matches look like mistakes.
- **Highlight** matched words (a subtle weight or background change, not bright yellow). Only highlight words that actually matched.
- **Show a result count** in a polite live region ("7 recipes"), which also helps screen readers.
- On a phone, while typing, the **first 2–3 results must be visible above the keyboard**. Compact result rows are better than tall cards during search. Show the full card when browsing.
- Show the details that help decide (time, difficulty, favourite). Drop decoration that doesn't.

## 5. Query input

- Real `<input type="search">` with `enterKeyHint="search"`, at least 16px text (smaller zooms iOS Safari), a visible label or `aria-label`, and a clear button with an `aria-label`.
- Autofocus only when the user explicitly opened search (a search screen or sheet). Don't autofocus on a browse page, where it pops the keyboard unasked.
- Escape clears, then blurs. Return dismisses the keyboard (results are already live).
- **Before typing**, show the user something useful: recent searches, and a few top tags or "what's in the fridge" shortcuts. Don't show a blank area or a wall of every tag.

## 6. Filters and facets

- Filters narrow the current results; they don't replace search. Keep them available *while* searching. Don't hide them on the first keystroke.
- **Counts reflect the current query and other active filters.** Hide or disable options that would lead to zero results.
- Show applied filters as removable chips near the query, plus "Clear all".
- Prefer a few strong facets (time, difficulty, favourites, top tags) over every tag. Put the long tail behind "More".
- Near-duplicate tags (`one-pot`/`one pot`) should be merged when counting and matching. `canonicalize()` in `use-recipe-filter.ts` already does this.
- Decide between AND and OR per facet and make it obvious. Tags usually narrow (AND); a single facet's options (Easy or Medium) usually widen (OR).

## 7. No results and weak results

Never stop at "No results." In order of preference:
1. **Automatically loosen** and say so: "No recipes with all of *leek, bacon, tarragon*. Showing ones with 2 of 3."
2. **Suggest a correction**: "Did you mean *tomato*?"
3. **Point at the cause**: "No matches with the *Vegetarian* filter. Remove it?"
4. **Offer the core action**: "Remix a new recipe with leeks". Link to input, ideally pre-filled.

For an empty *library*, that's a different state: explain what the screen will hold and link to adding the first recipe.

## 8. State and persistence

- Put the query and filters in the URL (`?q=leek&tags=one-pot`) with `router.replace` (not `push`) as the user types, so Back returns to the same results and the state can be shared or bookmarked.
- Restore scroll position when returning from a recipe.
- Recent searches: keep the last 5–8 in localStorage, de-duplicated, only once the user has *acted* on a result (opened a recipe), not on every keystroke.

## 9. Performance

With hundreds of recipes, searching on the client every keystroke is instant. Don't add a debounce or a server call. Build the normalised search index once per `recipes` change (`useMemo`), not per keystroke. If the library ever reaches thousands, look at a small library like MiniSearch before building anything server-side.

## 10. Where the code lives here

- `lib/search/recipe-search.ts`: the pure matcher and scorer (normalising, stemming, synonyms, weights). Tune relevance here.
- `hooks/use-recipe-filter.ts`: wraps it with filter state and live facet counts. It's shared by the recipes page and the meal-plan picker, so changes land in both. Check both screens.
- `components/recipe-search/*`: the shared search field, filter chips, result row, count and no-results state.
- `app/recipes/page.tsx`: the search and browse screen.
- `components/meal-plan/recipe-picker-sheet.tsx`: the same hook inside a bottom sheet, with its own keyboard-offset handling.
- The list rows (`RecipeListRow`) already include the full `recipe_data`, ingredients included, so ingredient search needs no extra fetch.
