import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { aggregateRound } from '@/lib/federated/aggregate'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const body = await req.json().catch(()=>({})) as any
  const roundId = String(body?.roundId || '')
  if (!roundId) return NextResponse.json({ error: 'missing_round' }, { status: 400 })
  const out = await aggregateRound(roundId)
  return NextResponse.json(out)
}


