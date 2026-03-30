import { NextRequest, NextResponse } from 'next/server'
import { computeDailyRecipeBook } from '@/lib/services/recipes/compute'

export async function GET(_req: NextRequest) {
  const out = await computeDailyRecipeBook().catch(()=> ({ day: new Date().toISOString().slice(0,10), counts: { hot: 0, cooling: 0, new: 0 } }))
  return NextResponse.json({ ok: true, day: out.day, counts: out.counts, recipes_last_run: new Date().toISOString() })
}


