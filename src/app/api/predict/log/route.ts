import { NextRequest, NextResponse } from 'next/server'
import { appendPrediction } from '@/lib/validation/store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, videoId, externalId, platform, niche, probability, threshold, features } = body || {}
    if (!platform || typeof probability !== 'number' || typeof threshold !== 'number') {
      return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
    }
    const ev = appendPrediction({ id, videoId, externalId, platform, niche, probability, threshold, features })
    return NextResponse.json({ ok: true, prediction: ev })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'log_failed' }, { status: 500 })
  }
}


