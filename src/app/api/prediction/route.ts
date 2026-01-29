import { NextRequest, NextResponse } from 'next/server'
import { writePredictionReceipt } from '@/lib/services/prediction-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    // Persist if available; service gracefully no-ops when DB is not configured
    const out = await writePredictionReceipt({ video_draft_id: body?.video_draft_id, inputs: body })
    return NextResponse.json(out)
  } catch (e: any) {
    // Fallback: issue a local receipt id so the flow continues in dev
    const receipt_id = 'rcpt_' + Math.random().toString(36).slice(2, 10)
    return NextResponse.json({ receipt_id, warning: String(e?.message || e) }, { status: 200 })
  }
}


