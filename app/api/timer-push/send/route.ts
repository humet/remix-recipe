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

  const { timerId, label, subscription, appUrl } = JSON.parse(body)

  // Use Declarative Web Push format (RFC 8030) — Safari handles natively,
  // other browsers fall back to the SW push event handler
  const payload = JSON.stringify({
    web_push: '8030',
    notification: {
      title: 'Timer Complete',
      body: `${label} is done!`,
      navigate_url: appUrl || 'https://localhost:3000',
      tag: `timer-${timerId}`,
      sound: 'default',
    },
  })

  try {
    await webpush.sendNotification(subscription, payload)
  } catch (err: any) {
    if (err.statusCode !== 410 && err.statusCode !== 404) {
      console.error(`Push failed for timer ${timerId}:`, err.message)
    }
  }

  return NextResponse.json({ ok: true })
}
