import { NextRequest, NextResponse } from 'next/server'
import { orchestrator } from '@/lib/jarvis/orchestrator'

export async function POST(request: NextRequest) {
  const { skillId, params, skipConfirmation, actor, idempotencyKey } = await request.json()
  const out = await orchestrator.confirmAndExecute(skillId, params || {}, actor || { id: 'api', role: 'super_admin' }, { skipConfirmation, idempotencyKey })
  return NextResponse.json(out)
}









