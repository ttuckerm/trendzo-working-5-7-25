import { NextResponse } from 'next/server'
import { getSummary } from '@/lib/validation/summary'

export async function GET() {
  try {
    const summary = await getSummary()
    // Always 200 with safe shape
    const safe = summary || { total:0, validated:0, correct:0, accuracy:0, tp:0, fp:0, tn:0, fn:0, auroc:0, ece:0, bins:[], computedAtISO: new Date().toISOString() }
    return NextResponse.json({ ok: true, summary: safe })
  } catch {
    return NextResponse.json({ ok: true, summary: { total:0, validated:0, correct:0, accuracy:0, tp:0, fp:0, tn:0, fn:0, auroc:0, ece:0, bins:[], computedAtISO: new Date().toISOString() } })
  }
}
