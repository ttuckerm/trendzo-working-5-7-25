import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  return NextResponse.json({
    leaderboard: [
      { template_id: 'tpl_1', title: 'Template 1', metric_value: 987, rank: 1 },
      { template_id: 'tpl_2', title: 'Template 2', metric_value: 876, rank: 2 }
    ]
  })
}



