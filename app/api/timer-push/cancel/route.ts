import { NextResponse } from 'next/server'
import { Client } from '@upstash/qstash'
import { createClient } from '@/lib/supabase/server'

const qstash = new Client({ token: process.env.QSTASH_TOKEN! })

export async function POST(request: Request) {
  try {
    const { timerId } = await request.json()

    if (!timerId) {
      return NextResponse.json({ error: 'Missing timerId' }, { status: 400 })
    }

    const supabase = await createClient()

    // Look up QStash message ID
    const { data } = await supabase
      .from('push_timers')
      .select('qstash_message_id')
      .eq('timer_id', timerId)
      .single()

    if (data?.qstash_message_id) {
      try {
        await qstash.messages.delete(data.qstash_message_id)
      } catch {
        // Message may have already been delivered or expired
      }
    }

    // Delete the row
    await supabase.from('push_timers').delete().eq('timer_id', timerId)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Cancel push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
