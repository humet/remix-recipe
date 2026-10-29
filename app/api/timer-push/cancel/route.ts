import { NextResponse } from 'next/server'
import { getRun } from 'workflow/api'
import { requireUser } from '@/lib/auth/require-user'

export async function POST(request: Request) {
  const { response: unauthorized } = await requireUser()
  if (unauthorized) return unauthorized

  try {
    const { runId } = await request.json()

    if (!runId || typeof runId !== 'string') {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
    }

    try {
      await getRun(runId).cancel()
    } catch {
      // The run may have already sent its push or been cancelled
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Cancel push error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
