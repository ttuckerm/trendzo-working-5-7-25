import { NextRequest, NextResponse } from 'next/server'
import { orchestrator } from '@/lib/jarvis/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const { confirmationId, response } = await request.json()
    if (!confirmationId || response == null) {
      return NextResponse.json({ ok: false, error: 'Missing confirmationId or response' }, { status: 400 })
    }
    orchestrator.emit('confirmation_response', { confirmationId, response })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 })
  }
}









