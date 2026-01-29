import { NextRequest, NextResponse } from 'next/server'
import { getAll as devGetAll } from '@/lib/dev/accuracyStore'

export async function GET(_req: NextRequest) {
  try {
    const dev = devGetAll()
    return NextResponse.json({
      predictions: dev.predictions.length,
      outcomes: dev.outcomes.length,
      labels: dev.labels.length
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


