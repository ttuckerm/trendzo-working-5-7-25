import { NextRequest, NextResponse } from 'next/server'
import { applyProposedChange } from '@/lib/adaptation/apply'
import { recordApply, recentChanges } from '@/lib/adaptation/store'
import { promoteCandidate } from '@/lib/learning/store'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(()=>({}))
    let proposed = (body as any)?.proposed
    if (!proposed) {
      const last = recentChanges(1)[0]
      if (!last) return NextResponse.json({ error: 'no_proposal' }, { status: 400 })
      proposed = last.proposed
    }
    const { current, candidate } = await applyProposedChange(proposed)
    recordApply(proposed)
    if (process.env.AUTO_PROMOTE === '1' && String(proposed?.severity||'') !== 'Storm') {
      try { await promoteCandidate() } catch {}
    }
    return NextResponse.json({ current, candidate })
  } catch (e:any) {
    return NextResponse.json({ error: e?.message || 'apply_failed' }, { status: 500 })
  }
}


