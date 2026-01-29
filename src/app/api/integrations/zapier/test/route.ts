import { NextRequest, NextResponse } from 'next/server'

export async function POST(_req: NextRequest) {
  const samples = {
    triggers: {
      'telemetry.ingested': { event: 'telemetry.ingested', video_id: 'vid_demo', event_count: 10, ts: new Date().toISOString() },
      'prediction.published': { event: 'prediction.published', id: 'pred_demo', score: 0.72, ts: new Date().toISOString() },
      'conversion.recorded': { event: 'conversion.recorded', template_id: 'tpl_demo', amount_cents: 1299, ts: new Date().toISOString() },
      'preflight.passed': { event: 'preflight.passed', at: new Date().toISOString() }
    },
    actions: {
      'score.video': { ok: true, score: 0.64 },
      'publish.prediction': { ok: true, id: 'pred_demo' },
      'export.leaderboard': { ok: true, items: 10 }
    }
  }
  return NextResponse.json(samples)
}


