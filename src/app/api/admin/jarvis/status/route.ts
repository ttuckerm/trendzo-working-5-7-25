import { NextResponse } from 'next/server'
import { orchestrator } from '@/lib/jarvis/orchestrator'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const status = orchestrator.getStatus()
    return NextResponse.json(status, { status: 200 })
  } catch (e: any) {
    // Always return a harmless status to avoid crashing client overlays
    return NextResponse.json(
      { overlay_enabled: false, pending_confirms: [], skills_registered: 0, ws_mode: 'event_bus', error: String(e?.message || e) },
      { status: 200 }
    )
  }
}

