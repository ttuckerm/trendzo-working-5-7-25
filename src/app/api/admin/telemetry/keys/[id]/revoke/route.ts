import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, Permission } from '@/lib/security/auth-middleware'
import { revokeTelemetryKey } from '@/lib/security/telemetry-keys'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const { response } = await requireAuth([Permission.ADMIN_API_KEYS])(_req)
  if (response) return response
  const ok = await revokeTelemetryKey(params.id)
  if (!ok) return NextResponse.json({ ok: false, error: 'revoke_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}


