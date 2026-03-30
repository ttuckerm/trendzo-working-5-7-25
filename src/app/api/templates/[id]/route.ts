import { NextRequest, NextResponse } from 'next/server'
import { getTemplateDetail } from '@/lib/templates/service'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const url = new URL(req.url)
    const window = (url.searchParams.get('range') as any) || (url.searchParams.get('window') as any) || '30d'
    const platform = url.searchParams.get('platform') || undefined
    const niche = url.searchParams.get('niche') || undefined
    const item = await getTemplateDetail(params.id, { window, platform, niche })
    if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const shape = {
      id: String(item.id),
      name: String(item.name||item.id),
      status: String(item.state||'new').toLowerCase(),
      sr: Number(item.successRate||0),
      uses: Number(item.uses||0),
      examples: Array.isArray(item.examples) ? item.examples.length : 0,
      last_seen_at: String(item.lastSeenTs||new Date().toISOString()),
      trend: Array.from({length: 30}).map((_,i)=> Math.max(0, Math.sin(i/5)+1)),
      safety: { nsfw: 0, copyright: 0 },
      entity: { sound: 'Trending', hashtags: ['#viral','#trendzo'] },
      uplift_pct: 0,
      support: Number(item.uses||0)
    }
    return NextResponse.json(shape)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'error' }, { status: 500 })
  }
} 