import { NextRequest, NextResponse } from 'next/server'
import { putJson } from '@/lib/storage/object_store'

export async function GET(_req: NextRequest) {
  const example_row = {
    template_id: 'fw_POV_HOOK__genes_a1b2',
    window: '7d',
    platform: 'tiktok',
    niche: 'beauty',
    success_rate: 0.82,
    median_score: 74,
    instances: 41,
    velocity: 0.07,
    avg_lift: 0.012
  }
  const stored = await putJson('proof', { seeded: 3, example_row }, { filename: `templates_dryrun_${Date.now()}.json` })
  return NextResponse.json({ ok: true, seeded: 3, leaderboard_rows: 3, example_row, artifact_url: stored.url })
}


