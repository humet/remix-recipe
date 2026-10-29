import { NextResponse } from 'next/server'
import { start } from 'workflow/api'
import { requireUser } from '@/lib/auth/require-user'
import { timerPushWorkflow } from '@/workflows/timer-push'

export async function POST(request: Request) {
  const { response: unauthorized } = await requireUser()
  if (unauthorized) return unauthorized

  try {
    const { timerId, label, fireAt, subscription } = await request.json()

    if (!timerId || !label || !fireAt || !subscription) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // The run sends from this deployment, so a preview's timers open the preview.
    const appUrl = new URL(request.url).origin

    const run = await start(timerPushWorkflow, [{ timerId, label, fireAt, subscription, appUrl }])

    return NextResponse.json({ ok: true, runId: run.runId })
  } catch (err) {
    console.error('Schedule push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
