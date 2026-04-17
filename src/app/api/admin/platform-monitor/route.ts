/**
 * Platform Monitor API (Prompt 34)
 *
 * GET  /api/admin/platform-monitor              — run the monitor once, return result JSON
 * GET  /api/admin/platform-monitor?signals_only — collect signals but skip alert writes
 * POST /api/admin/platform-monitor              — same as GET, kept for parity with other admin routes
 *
 * GET is accepted so the Chairman can trigger a run by pasting the URL
 * into the browser address bar — no curl, no DevTools needed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { runPlatformMonitor } from '@/lib/monitoring/platform-monitor'
import { collectAllPlatformSignals } from '@/lib/monitoring/platform-signals'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

async function handle(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const signalsOnly = searchParams.get('signals_only') !== null

  const startTime = Date.now()

  if (signalsOnly) {
    const signals = await collectAllPlatformSignals()
    return NextResponse.json({
      mode: 'signals_only',
      elapsed_ms: Date.now() - startTime,
      ...signals,
    })
  }

  const result = await runPlatformMonitor()
  return NextResponse.json({
    mode: 'full_run',
    elapsed_ms: Date.now() - startTime,
    ...result,
  })
}

export async function GET(request: NextRequest) {
  return handle(request)
}

export async function POST(request: NextRequest) {
  return handle(request)
}
