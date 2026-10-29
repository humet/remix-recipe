import { FatalError, sleep } from 'workflow'
import webpush, { type PushSubscription } from 'web-push'

export interface TimerPushInput {
  timerId: string
  label: string
  /** ISO timestamp the timer ends at. */
  fireAt: string
  subscription: PushSubscription
  appUrl: string
}

/**
 * Sleeps until the timer ends, then sends its push. Pausing, resetting or
 * removing the timer cancels the run, which stops it at the sleep.
 */
export async function timerPushWorkflow(input: TimerPushInput) {
  'use workflow'

  await sleep(new Date(input.fireAt))
  await sendTimerPush(input)
}

// A "Timer Complete" that turns up long after the timer ended is worse than
// none, so a retried send gives up past this.
const STALE_AFTER_MS = 2 * 60 * 1000

async function sendTimerPush({ timerId, label, fireAt, subscription, appUrl }: TimerPushInput) {
  'use step'

  if (Date.now() - new Date(fireAt).getTime() > STALE_AFTER_MS) return

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!publicKey || !privateKey) throw new FatalError('VAPID keys are not configured')
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:hello@example.com', publicKey, privateKey)

  // Use Declarative Web Push format (RFC 8030) — Safari handles natively,
  // other browsers fall back to the SW push event handler
  const payload = JSON.stringify({
    web_push: '8030',
    notification: {
      title: 'Timer Complete',
      body: `${label} is done!`,
      navigate_url: appUrl,
      tag: `timer-${timerId}`,
      sound: 'default',
    },
  })

  try {
    await webpush.sendNotification(subscription, payload)
  } catch (err) {
    const { statusCode } = err as { statusCode?: number }
    // The browser dropped the subscription, so there's no one to tell.
    if (statusCode === 404 || statusCode === 410) return
    // Any other rejection from the push service won't change on a retry.
    if (statusCode && statusCode >= 400 && statusCode < 500 && statusCode !== 429) {
      throw new FatalError(`Push rejected for timer ${timerId}: ${statusCode}`)
    }
    throw err
  }
}
