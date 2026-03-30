import { NextRequest, NextResponse } from 'next/server'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const body = await req.json().catch(()=>({})) as any
  const variants = Array.from({ length: Math.min(5, Number(body?.numVariants||3)) }).map((_,i)=> ({
    id: `v${i+1}`,
    caption: (body?.caption||'').replace(/\.$/,'') + ` — variant ${i+1}`,
    hook: body?.hook ? `${body.hook} (${i+1})` : undefined
  }))
  return NextResponse.json({ ok: true, variants })
}


