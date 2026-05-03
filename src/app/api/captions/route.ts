import { NextRequest, NextResponse } from 'next/server'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche') || ''
  const goal = searchParams.get('goal') || ''
  const entities = searchParams.getAll('entities[]')
  const effectiveNiche = niche || 'general'
  const effectiveGoal = goal || 'quick-win'
  const caption = `Ready to level up ${effectiveNiche}? Here’s a fast ${effectiveGoal} playbook.`
  const tags = ['#viral','#growth','#content'].concat((entities||[]).slice(0,3).map(x=>'#'+String(x).replace(/[^a-z0-9_]/gi,'')))
  return NextResponse.json({ caption, hashtags: tags })
}


