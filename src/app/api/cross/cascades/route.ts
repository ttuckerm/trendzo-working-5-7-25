import { NextRequest, NextResponse } from 'next/server'
import { buildCascades, ensureCrossFixtures, readFixtureCascades } from '@/lib/cross/service'
import { getSource } from '@/lib/data'

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const window = url.searchParams.get('window') ?? '30d'
  const niche = url.searchParams.get('niche') ?? ''
  const creator = url.searchParams.get('creator') ?? ''
  try {
    const src = getSource()
    await ensureCrossFixtures()
    const cascades = await buildCascades(src as any, { window, niche, creator })
    return NextResponse.json({ window, source: process.env.MOCK === '1' ? 'mock' : 'live', cascades })
  } catch (err) {
    try { await ensureCrossFixtures() } catch {}
    const cascades = await readFixtureCascades()
    return NextResponse.json({ window, source: 'mock-fallback', cascades })
  }
}


