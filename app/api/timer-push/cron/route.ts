import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

function initVapid() {
  if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:hello@example.com',
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    )
  }
}

export async function GET(request: Request) {
  initVapid()
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  let totalSent = 0

  // Single check per invocation (~1 minute precision via Vercel cron)
  const { data: dueTimers, error } = await supabase
    .from('push_timers')
    .select('*')
    .lte('fire_at', new Date().toISOString())

  if (error) {
    console.error('Error querying due timers:', error)
    return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  }

  if (dueTimers && dueTimers.length > 0) {
    for (const timer of dueTimers) {
      try {
        await webpush.sendNotification(
          timer.subscription,
          JSON.stringify({
            title: 'Timer Complete',
            body: `${timer.label} is done!`,
            tag: `timer-${timer.timer_id}`,
          })
        )
        totalSent++
      } catch (err: any) {
        if (err.statusCode !== 410 && err.statusCode !== 404) {
          console.error(`Push failed for timer ${timer.timer_id}:`, err.message)
        }
      }

      // Delete the row after sending (or on failure)
      await supabase.from('push_timers').delete().eq('id', timer.id)
    }
  }

  // Clean up stale rows older than 24h
  await supabase
    .from('push_timers')
    .delete()
    .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  return NextResponse.json({ sent: totalSent })
}
