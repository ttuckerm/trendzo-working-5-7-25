import { NextResponse } from 'next/server'
import { generateRecipeBook } from '@/lib/templates/service'
import { ensureFixtures } from '@/lib/data/init-fixtures'
import { isMock } from '@/lib/data/source'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const window = (url.searchParams.get('window') as any) || '30d'
    const platform = url.searchParams.get('platform') || undefined
    const niche = url.searchParams.get('niche') || undefined
    if (isMock()) ensureFixtures()
    try {
      const rb = await generateRecipeBook({ window, platform, niche })
      return NextResponse.json(rb)
    } catch (e) {
      // fallback to mock
      ensureFixtures()
      const rb = await generateRecipeBook({ window, platform, niche })
      return NextResponse.json(rb)
    }
  } catch (err: any) {
    // last resort mock
    try {
      ensureFixtures()
      const rb = await generateRecipeBook({ window: '30d' as any })
      return NextResponse.json(rb)
    } catch {
      return NextResponse.json({ generatedAtISO: new Date().toISOString(), counts:{hot:0,cooling:0,newly:0,uses:0,viral:0}, hot:[], cooling:[], newly:[] })
    }
  }
}