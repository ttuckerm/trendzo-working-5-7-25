import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, Permission } from '@/lib/security/auth-middleware'
import { ensureTelemetryKeysTable, mintTelemetryKey } from '@/lib/security/telemetry-keys'

export async function POST(req: NextRequest) {
  const { response } = await requireAuth([Permission.ADMIN_API_KEYS])(req)
  if (response) return response
  const { name } = await req.json().catch(()=>({})) as any
  if (!name) return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 })
  const minted = await mintTelemetryKey(String(name))
  if (!minted) return NextResponse.json({ ok: false, error: 'mint_failed' }, { status: 500 })
  return NextResponse.json({ ok: true, id: minted.id, key: minted.key })
}

export async function GET(_req: NextRequest) {
  const { response } = await requireAuth([Permission.ADMIN_API_KEYS])( _req as any)
  if (response) return response
  await ensureTelemetryKeysTable()
  return NextResponse.json({ ok: true })
}


