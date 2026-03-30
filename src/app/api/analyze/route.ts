import { NextRequest, NextResponse } from 'next/server'
import { startStopwatch } from '@/lib/analysis/sla'
import { analyze } from '@/lib/services/scoring-service'

export async function POST(req: NextRequest) {
  const timer = startStopwatch()
  try {
    const body = await req.json()
    const analysis = analyze({ beat_timeline: (body?.beat_timeline||[]) })
    const timings = timer.stop()
    return NextResponse.json({ viral_score: analysis.viral_score, fixes: analysis.fixes, timings })
  } catch (e: any) {
    const timings = timer.stop()
    return NextResponse.json({ error: e?.message || 'analyze_failed', timings, viral_score: 0, fixes: [] })
  }
}

export async function GET() {
  // Explicitly disallow GET for analyze
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}


