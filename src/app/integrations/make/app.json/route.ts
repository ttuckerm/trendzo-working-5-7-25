import { NextResponse } from 'next/server'

export async function GET() {
  const spec = {
    name: 'Trendzo',
    version: '0.1.0',
    auth: { type: 'api_key', header: 'X-API-Key' },
    triggers: ['telemetry.ingested', 'prediction.published', 'conversion.recorded', 'preflight.passed'],
    actions: ['score.video', 'publish.prediction', 'export.leaderboard']
  }
  return NextResponse.json(spec)
}


