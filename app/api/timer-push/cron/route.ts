import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

export const maxDuration = 60

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
  let totalCleaned = 0

  // Loop for ~55 seconds, checking every 5 seconds
  const deadline = Date.now() + 55_000

  while (Date.now() < deadline) {
    // Find timers that are due
    const { data: dueTimers, error } = await supabase
      .from('push_timers')
      .select('*')
      .lte('fire_at', new Date().toISOString())

    if (error) {
      console.error('Error querying due timers:', error)
      break
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
          // 410 = subscription expired, remove it
          if (err.statusCode === 410 || err.statusCode === 404) {
            // Will be deleted below
          } else {
            console.error(`Push failed for timer ${timer.timer_id}:`, err.message)
          }
        }

        // Delete the row after sending (or on failure)
        await supabase.from('push_timers').delete().eq('id', timer.id)
      }
    }

    // Clean up stale rows older than 24h
    const { data: staleRows } = await supabase
      .from('push_timers')
      .delete()
      .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .select('id')

    if (staleRows) totalCleaned += staleRows.length

    // Wait 5 seconds before next check
    if (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 5_000))
    }
  }

  return NextResponse.json({ sent: totalSent, cleaned: totalCleaned })
}
