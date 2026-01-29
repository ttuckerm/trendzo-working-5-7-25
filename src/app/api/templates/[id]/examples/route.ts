import { NextRequest, NextResponse } from 'next/server'
import { getTemplateDetail } from '@/lib/templates/service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const url = new URL(req.url)
  const range = (url.searchParams.get('range') as any) || '30d'
  const platform = url.searchParams.get('platform') || undefined
  const niche = url.searchParams.get('niche') || undefined
  const limit = Number(url.searchParams.get('limit') || '20')
  const detail = await getTemplateDetail(params.id, { window: (range === '7d' || range === '90d' ? range : '30d') as any, platform, niche })
  if (!detail) return NextResponse.json({ items: [] })
  const items = (detail.examples || []).slice(0, limit).map((v:any)=> ({ id: v.id, title: v.caption||'', views: v.metrics?.find?.((m:any)=> m.window==='7d')?.views || 0 }))
  return NextResponse.json({ items })
}


