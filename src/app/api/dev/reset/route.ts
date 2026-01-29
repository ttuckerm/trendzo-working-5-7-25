import { NextRequest, NextResponse } from 'next/server'
import { reset as devReset, getAll as devGetAll } from '@/lib/dev/accuracyStore'

export async function POST(_req: NextRequest) {
  try {
    const before = devGetAll()
    const cleared = devReset()
    const after = devGetAll()
    return NextResponse.json({ ok: true, cleared, remaining: { predictions: after.predictions.length, outcomes: after.outcomes.length, labels: after.labels.length } })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


