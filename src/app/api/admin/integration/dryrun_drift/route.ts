import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const now = new Date()
  const windowEnd = now.toISOString()
  const windowStart = new Date(now.getTime() - 7*24*3600*1000).toISOString()
  // Synthetic proof: 2-3 obvious drifts
  const data = [
    { feature: 'saves', rel_change: +0.48, abs_change: +0.07, rank_shift: 4, n_samples: 12340, platform: 'TT', niche: 'Fitness' },
    { feature: 'rewatches', rel_change: -0.42, abs_change: -0.06, rank_shift: 3, n_samples: 11980, platform: 'TT', niche: 'Fitness' },
    { feature: 'timingScore', rel_change: +0.36, abs_change: +0.05, rank_shift: 2, n_samples: 13110, platform: 'TT', niche: 'Beauty' }
  ]
  return NextResponse.json({ ok: true, windowStart, windowEnd, seeded: true, examples: data })
}


