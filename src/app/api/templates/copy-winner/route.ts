import { NextRequest, NextResponse } from 'next/server'
import { requireTenantAccess } from '@/middleware/rbac'
import { commonRateLimiters } from '@/lib/security/rate-limiter'

export async function POST(req: NextRequest) {
  const rl = await commonRateLimiters.admin(req)
  if (rl) return rl
  const guard = await requireTenantAccess({ roles: ['admin','super_admin'] })(req)
  if (guard) return guard
  try {
    const body = await req.json().catch(()=> ({})) as any
    const templateId = String(body?.template_id||'')
    if (!templateId) return NextResponse.json({ error: 'template_id_required' }, { status: 400 })
    const draftId = `draft_${Math.random().toString(36).slice(2,8)}${Date.now()}`
    return NextResponse.json({ draft_id: draftId })
  } catch (e:any) {
    return NextResponse.json({ error: 'copy_failed', message: e?.message||'error' }, { status: 500 })
  }
}


