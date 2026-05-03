import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const url = process.env.SLACK_WEBHOOK_URL || ''
  if (!url) return NextResponse.json({ error: 'not_configured' }, { status: 400 })
  const payload = { text: 'Trendzo: Slack integration test ping ✅' }
  const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  return NextResponse.json({ status: resp.status })
}


