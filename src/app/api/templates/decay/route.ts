import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const range = (url.searchParams.get('range') as any) || '30d'
  const points = range === '7d' ? 7 : range === '90d' ? 90 : 30
  const series = Array.from({length: points}).map((_,i)=> Math.max(0, 1 - i/(points*1.2)))
  return NextResponse.json({ template_id: 'tpl_demo', decay_series: series })
}


