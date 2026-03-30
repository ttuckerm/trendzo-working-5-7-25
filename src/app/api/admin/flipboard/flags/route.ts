import { NextRequest, NextResponse } from 'next/server'
import { initDemoMode, getFlagsFromEnv, persistFlags, applyFlagsToEnv, FlipboardFlags } from '@/lib/runtime/demo_mode'

export async function GET() {
  await initDemoMode()
  return NextResponse.json({ ok: true, flags: getFlagsFromEnv() })
}

export async function POST(req: NextRequest) {
  await initDemoMode()
  try {
    const body = (await req.json()) as Partial<FlipboardFlags>
    // Require explicit demo_mode field; when demo_mode is true, all live switches must be false
    const nextFlags: FlipboardFlags = {
      demo_mode: body.demo_mode !== undefined ? Boolean(body.demo_mode) : getFlagsFromEnv().demo_mode,
      allow_live_db_writes: Boolean(body.allow_live_db_writes ?? getFlagsFromEnv().allow_live_db_writes),
      allow_external_api_calls: Boolean(body.allow_external_api_calls ?? getFlagsFromEnv().allow_external_api_calls),
      allow_billing: Boolean(body.allow_billing ?? getFlagsFromEnv().allow_billing),
      allow_webhooks: Boolean(body.allow_webhooks ?? getFlagsFromEnv().allow_webhooks),
    }
    if (nextFlags.demo_mode) {
      nextFlags.allow_live_db_writes = false
      nextFlags.allow_external_api_calls = false
      nextFlags.allow_billing = false
      nextFlags.allow_webhooks = false
    }
    applyFlagsToEnv(nextFlags)
    await persistFlags(nextFlags)
    return NextResponse.json({ ok: true, flags: nextFlags })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'invalid_payload' }, { status: 400 })
  }
}







