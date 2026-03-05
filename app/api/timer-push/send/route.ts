import { NextResponse } from 'next/server'
import { Receiver } from '@upstash/qstash'
import webpush from 'web-push'

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

function initVapid() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
}

export async function POST(request: Request) {
  initVapid()

  // Verify QStash signature
  const body = await request.text()
  const signature = request.headers.get('upstash-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
  }

  try {
    await receiver.verify({ body, signature, url: request.url })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  const { timerId, label, subscription } = JSON.parse(body)

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        title: 'Timer Complete',
        body: `${label} is done!`,
        tag: `timer-${timerId}`,
      })
    )
  } catch (err: any) {
    if (err.statusCode !== 410 && err.statusCode !== 404) {
      console.error(`Push failed for timer ${timerId}:`, err.message)
    }
  }

  return NextResponse.json({ ok: true })
}
