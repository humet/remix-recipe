// Reasons attached to a recipe change the user didn't approve. They reach the
// model as the tool result, and the ask-recipe prompt tells it how to treat each.

/** The user tapped "No thanks". */
export const DECLINED_CHANGE_REASON = 'User declined'

/** The user typed a new message instead of answering the approval card. */
export const SKIPPED_CHANGE_REASON = 'User asked something else instead'
