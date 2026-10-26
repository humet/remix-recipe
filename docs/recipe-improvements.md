# Recipe improvement choices

Categories label choices; they do not limit how many can be selected. Analysis asks for 4–8 useful suggestions overall, allowing several in a category. Unrelated changes are separate choices. Supporting adjustments that are necessary for a substitution stay with that choice. Descriptions explain material tradeoffs.

Each new suggestion includes a `conflicts` array of `{ improvementId, reason }`. IDs must be unique and references must point to another returned suggestion. Conflict lookup reads both directions. Previously saved analyses without this optional metadata remain usable.

The picker keeps incompatible alternatives visible with a reason and tells the user which selection to deselect. It does not silently replace a selection. Both the home flow and saved-recipe flow preserve conflict metadata when applying changes and display server errors on the picker.

The improve endpoint rejects declared conflicts with HTTP 409 before calling the AI. It then checks the actual recipe, selected changes and custom request for contradictions before rewriting. This also covers older analyses without conflict metadata. An incompatible result returns HTTP 409 with a resolution message; a failed check returns an error and does not generate a recipe. Formatting without requested changes skips the check. Compatibility checking adds one AI call to improvement requests; semantic detection depends on the model's judgement.

Demo fixtures include compatible choices in the same category and a spicy/mild alternative pair. Demo mode enforces declared conflicts locally and never calls the AI; it does not simulate semantic checking of arbitrary custom requests.

Run `pnpm improvements:check` for reference/selection checks and route checks with stubbed AI and authentication. The route checks cover known conflicts, custom-request conflicts, compatible requests, legacy payloads, formatting, invalid payloads and a missing compatibility result. No credentials or model calls are needed.
