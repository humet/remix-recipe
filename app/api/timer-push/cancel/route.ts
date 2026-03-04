import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { timerId } = await request.json()

    if (!timerId) {
      return NextResponse.json({ error: 'Missing timerId' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('push_timers')
      .delete()
      .eq('timer_id', timerId)

    if (error) {
      console.error('Error canceling push timer:', error)
      return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Cancel push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
