import { NextRequest, NextResponse } from 'next/server'
import { startOfISOWeek, format } from 'date-fns'

export async function GET(_req: NextRequest) {
  const payload = {
    cohort_version: format(startOfISOWeek(new Date()), "yyyy'W'II"),
    last_30d: { n: 123, auroc: 0.76, precision_at_100: 0.62, ece: 0.09 },
    computed_at: new Date().toISOString()
  }
  return NextResponse.json(payload)
}


