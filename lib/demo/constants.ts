/** Cookie that marks a session as demo mode (no auth, no AI, no DB). */
export const DEMO_COOKIE = 'remix_demo'

/** One year — demo is a shareable state, not a short-lived one. */
export const DEMO_COOKIE_MAX_AGE = 60 * 60 * 24 * 365
