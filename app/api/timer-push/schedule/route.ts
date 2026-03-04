import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { timerId, label, fireAt, subscription } = await request.json()

    if (!timerId || !label || !fireAt || !subscription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase.from('push_timers').upsert(
      {
        timer_id: timerId,
        endpoint: subscription.endpoint,
        subscription,
        label,
        fire_at: fireAt,
      },
      { onConflict: 'timer_id' }
    )

    if (error) {
      console.error('Error scheduling push timer:', error)
      return NextResponse.json({ error: 'Failed to schedule' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Schedule push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
