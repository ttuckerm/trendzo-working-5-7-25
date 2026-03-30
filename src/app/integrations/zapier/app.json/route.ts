import { NextResponse } from 'next/server'

export async function GET() {
  const spec = {
    name: 'Trendzo',
    version: '0.1.0',
    auth: { type: 'api_key', header: 'X-API-Key', docs: 'Send your API key in the X-API-Key header. Example: curl -H "X-API-Key: YOUR_KEY" https://yourdomain.com/api/public/score' },
    triggers: [
      { key: 'telemetry.ingested', type: 'poll|webhook' },
      { key: 'prediction.published', type: 'poll|webhook' },
      { key: 'conversion.recorded', type: 'poll|webhook' },
      { key: 'preflight.passed', type: 'poll|webhook' }
    ],
    actions: [
      { key: 'score.video', inputs: ['video_url','video_id'] },
      { key: 'publish.prediction', inputs: ['payload'] },
      { key: 'export.leaderboard', inputs: ['window'] }
    ]
  }
  return NextResponse.json(spec)
}


