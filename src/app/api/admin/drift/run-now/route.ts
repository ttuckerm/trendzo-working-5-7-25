import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'
import { computeFeatureImportance } from '@/lib/drift/feature-importance'

export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const now = new Date()
  const windowEnd = now.toISOString()
  const windowStart = new Date(now.getTime() - 7*24*3600*1000).toISOString()
  const out = await computeFeatureImportance(windowStart, windowEnd)
  return NextResponse.json({ ok: true, windowStart, windowEnd, inserted: out.inserted, alerts: out.alerts, top: out.top.slice(0,5) })
}


