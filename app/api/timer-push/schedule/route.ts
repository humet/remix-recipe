import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { createClient } from '@/lib/supabase/server'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export async function POST(request: Request) {
  try {
    const { timerId, label, fireAt, subscription } = await request.json()

    if (!timerId || !label || !fireAt || !subscription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate delay in seconds
    const delaySeconds = Math.max(0, Math.round((new Date(fireAt).getTime() - Date.now()) / 1000))

    // Use production URL to avoid Vercel deployment protection on preview URLs
    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'http://localhost:3000'

    // Schedule QStash message to call /api/timer-push/send at fire_at
    const { messageId } = await qstash.publishJSON({
      url: `${baseUrl}/api/timer-push/send`,
      body: { timerId, label, subscription },
      delay: delaySeconds,
    })

    // Store timer_id → qstash_message_id mapping for cancellation
    const supabase = await createClient()
    await supabase.from('push_timers').upsert(
      {
        timer_id: timerId,
        qstash_message_id: messageId,
        label,
        fire_at: fireAt,
      },
      { onConflict: 'timer_id' }
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Schedule push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
