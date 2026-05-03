import { NextRequest, NextResponse } from 'next/server'
import { suggestTimes } from '@/lib/services/schedule-service'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche') || undefined
  const goal = searchParams.get('goal') || undefined
  const platforms = (searchParams.get('platforms')||'').split(',').filter(Boolean)
  const items = suggestTimes({ niche, goal, platforms })
  return NextResponse.json(items)
}


