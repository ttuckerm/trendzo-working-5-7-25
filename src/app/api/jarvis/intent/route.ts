import { NextRequest, NextResponse } from 'next/server'
import { orchestrator } from '@/lib/jarvis/orchestrator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(()=> ({} as any))
    const utterance: string = typeof body?.utterance === 'string' ? body.utterance : ''
    const mode = body?.mode || 'text'
    const actor = body?.actor
    const idempotencyKey = body?.idempotencyKey
    if (!utterance) {
      return NextResponse.json({ text: 'Please provide an utterance.' }, { status: 400 })
    }
    const res = await orchestrator.dispatchIntent({ utterance, mode, actor, idempotencyKey })
    return NextResponse.json({ text: res.text, actions: (res as any).actions, skillId: (res as any).skillId }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ text: 'Jarvis failed to process the request.', error: String(e?.message || e) }, { status: 500 })
  }
}









