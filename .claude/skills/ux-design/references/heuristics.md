# Usability checklist

A working checklist, loosely built on Nielsen's ten usability heuristics plus mobile-specific rules. Use it to find problems, then rank them by how much they get in the way of the user's job. Not every line applies to every screen.

## Visibility and feedback
- Can the user tell what state they're in (searching, filtered, editing, demo) at a glance?
- Does every tap produce visible feedback within about 100ms (pressed state, optimistic update, spinner)?
- Are counts and summaries accurate for the *current* state, not the unfiltered one?
- For async work over about 1s, is there progress, and can the user keep doing other things?

## Match the user's words and model
- Labels use the user's language ("Cook time", "What's in the fridge"), not the data model's (`recipe_data`, "entries").
- Things that look the same behave the same. A chip that filters in one place shouldn't navigate in another.
- Sorting and grouping follow what the user is doing right now (relevance when searching, date when browsing).

## Control and forgiveness
- Destructive actions confirm or offer undo. Undo is better for frequent actions; confirm for rare, costly ones.
- Back always works and restores where the user was: query, filters, scroll.
- Sheets and dialogs close by swipe, tapping the backdrop, and a visible control.
- No trap states: every screen has a way forward and a way out.

## Consistency with the app
- Same component for the same job across screens (the recipes page and the meal-plan picker share search behaviour).
- Spacing, radius and glass treatment follow `globals.css` tokens.
- Icon meaning is consistent (heart = favourite everywhere).

## Prevent errors before explaining them
- Don't offer choices that lead to nothing (a filter that gives zero results should be shown as such, or not offered).
- Inputs accept loose formats (plurals, casing, stray spaces).
- Dangerous controls aren't next to frequent ones.

## Recognition over recall
- Show recent searches, existing tags or suggestions rather than making the user remember exact names.
- Show *why* an item is in the list (a matched ingredient, the tag).
- Keep the current query and active filters visible while results scroll.

## Efficiency
- The most common task takes the fewest taps. Measure it: count taps for the top two jobs before and after.
- Focus lands where the user will type next. Enter or Return does the obvious thing.
- Local data needs no debounce or "Search" button; update as the user types.

## Minimal, clear hierarchy
- One primary action per screen, visually dominant.
- Secondary information is quieter (muted colour, smaller) rather than removed, if it helps the decision.
- Anything that doesn't serve the job on this screen goes.

## Recovery
- Error and empty states say what happened *and* offer the next step, in plain words.
- Failures keep the user's input (never clear a form on error).

## Mobile and kitchen
- Touch targets at least 44×44px with at least 8px between neighbours.
- The main controls sit in reach of a thumb (bottom half) where possible; the top of the screen is for reading.
- Content important while typing sits within the top ~400px (the keyboard covers the rest).
- Readable at arm's length: body text at least 16px on inputs (smaller zooms iOS Safari), strong contrast.
- Respect safe areas (`env(safe-area-inset-*)`) on sheets and bottom bars.
- Works with one hand. No gestures that need two hands or precision.

## Accessibility
- Icon-only buttons have `aria-label`s; inputs have labels (a placeholder isn't a label).
- Search sits in a `role="search"` region; the result count is announced through an `aria-live="polite"` region.
- Colour is never the only signal (active filter = filled *and* an ✕, not just a colour change).
- Contrast meets WCAG AA in both themes; check text on glass over the gradient background specifically.
- Keyboard: tab order follows the visual order, focus is visible, Escape closes overlays.
