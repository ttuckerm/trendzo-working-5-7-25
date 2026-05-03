import { NextResponse } from 'next/server'
import { listPatterns } from '@/lib/script/patterns'
import { readRecipeBook } from '@/lib/templates/cache'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET() {
  const patterns = listPatterns()
  const rb = readRecipeBook()
  const leaderboard: Record<string, number> = {}
  try {
    const lb: any[] = (rb as any)?.leaderboard || []
    lb.forEach((r: any) => { if (r?.patternId) leaderboard[r.patternId] = r.sr || r.successRate || 0 })
  } catch {}
  const out = patterns.map(p => ({ ...p, sr: leaderboard[p.id] || null }))
  return NextResponse.json(out)
}


