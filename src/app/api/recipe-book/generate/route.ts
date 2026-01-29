import { NextRequest, NextResponse } from 'next/server'
import { generateRecipeBook } from '@/lib/templates/service'
import { ensureFixtures } from '@/lib/data/init-fixtures'
import { isMock } from '@/lib/data/source'

export async function POST(req: NextRequest) {
  const sec = process.env.RECIPE_SECRET
  if (sec) {
    const header = req.headers.get('x-recipe-secret')
    if (header !== sec) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const url = new URL(req.url)
    const window = (url.searchParams.get('window') as any) || '30d'
    const platform = url.searchParams.get('platform') || undefined
    const niche = url.searchParams.get('niche') || undefined
    if (isMock()) ensureFixtures()
    try {
      const rb = await generateRecipeBook({ window, platform, niche })
      return NextResponse.json({ ok: true, generatedAt: rb.generatedAtISO, counts: rb.counts })
    } catch {
      ensureFixtures()
      const rb = await generateRecipeBook({ window, platform, niche })
      return NextResponse.json({ ok: true, generatedAt: rb.generatedAtISO, counts: rb.counts })
    }
  } catch (e: any) {
    try {
      ensureFixtures()
      const rb = await generateRecipeBook({ window: '30d' as any })
      return NextResponse.json({ ok: true, generatedAt: rb.generatedAtISO, counts: rb.counts })
    } catch (err:any) {
      return NextResponse.json({ ok: false, error: err?.message||'error' })
    }
  }
}


