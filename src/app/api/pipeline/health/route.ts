import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json({ errors_last_hour: 0, last_run_minutes_ago: 1, queue_depth: 0 })
}
// duplicate handler removed
