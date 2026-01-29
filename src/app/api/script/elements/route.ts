import { NextResponse } from 'next/server'
import { aggregateScriptElements } from '@/lib/services/scriptElementsAggregator'

export async function GET() {
  try {
    const data = aggregateScriptElements()
    return NextResponse.json({ ok: true, data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'aggregation_failed' }, { status: 500 })
  }
}


