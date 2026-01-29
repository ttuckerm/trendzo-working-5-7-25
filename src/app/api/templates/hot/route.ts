import { NextRequest, NextResponse } from 'next/server'
import { generateRecipeBook } from '@/lib/templates/service'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const range = (url.searchParams.get('range') as any) || '30d'
  const platform = url.searchParams.get('platform') || undefined
  const niche = url.searchParams.get('niche') || undefined
  const rb = await generateRecipeBook({ window: (range === '7d' || range === '90d' ? range : '30d') as any, platform, niche })
  const items = rb.hot.map((t:any)=> ({ id: String(t.id), name: t.name, sr: t.successRate, uses: t.uses }))
  return NextResponse.json(items)
}


