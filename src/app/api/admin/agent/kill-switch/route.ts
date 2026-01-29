import { NextRequest, NextResponse } from 'next/server'
import { getKillSwitch, setKillSwitch } from '@/lib/jarvis/store'
 
async function resolveActor(req: NextRequest, disableAuth: boolean): Promise<string> {
  if (disableAuth) return req.headers.get('x-actor-id') || 'dev@local'
  const mod = await import('@/lib/security/auth-middleware')
  const guard = mod.requireRole(mod.UserRole.ADMIN)
  const { authContext, response } = await guard(req)
  if (response) throw response
  return authContext?.user?.id || 'unknown'
}

export async function GET(req: NextRequest) {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' || process.env.NODE_ENV === 'development'
  if (!disableAuth) {
    try { await resolveActor(req, false) } catch (resp:any) { return resp }
  }
  const ks = getKillSwitch()
  return NextResponse.json({ active: ks.active, updatedAt: ks.updatedAt, updatedBy: ks.updatedBy })
}

export async function POST(req: NextRequest) {
  const disableAuth = process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true' || process.env.NODE_ENV === 'development'
  let userId: string
  try { userId = await resolveActor(req, disableAuth) } catch (resp:any) { return resp }
  try {
    const body = await req.json()
    const { active } = body || {}
    if (typeof active !== 'boolean') {
      return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
    }
    const ks = setKillSwitch(active, userId)
    return NextResponse.json({ active: ks.active, updatedAt: ks.updatedAt, updatedBy: ks.updatedBy })
  } catch (e: any) {
    return NextResponse.json({ error: 'ERROR', message: e?.message }, { status: 400 })
  }
}


