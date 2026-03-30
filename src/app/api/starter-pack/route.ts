import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche') || ''
  const goal = searchParams.get('goal') || ''
  // Deterministic 3 templates
  const items = [
    { id: 'cta_forward_01', name: 'CTA Forward Momentum', success_pct: 92, delta7d: '+9%', recommended: true },
    { id: 'transformation', name: 'Transformation Reveal', success_pct: 94, delta7d: '+12%', recommended: false },
    { id: 'list', name: '5 Things List', success_pct: 89, delta7d: '+8%', recommended: false }
  ]
  return NextResponse.json({ niche, goal, templates: items.slice(0,3) })
}


