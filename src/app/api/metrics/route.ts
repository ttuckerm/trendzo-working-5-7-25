import { NextResponse } from 'next/server'
import { source } from '@/lib/data'
import { ensureFixtures } from '@/lib/data/init-fixtures'
import { computeDriftIndex } from '@/lib/learning/summary'
import { GET as ADAPT_SUM } from '@/app/api/adaptation/summary/route'

export async function GET() {
  if (process.env.MOCK === '1') ensureFixtures()
  const m = await source.metrics()
  let driftIndex = 0
  try { driftIndex = computeDriftIndex() } catch {}
  let status: 'Stable'|'Shifting'|'Storm' = driftIndex < 0.15 ? 'Stable' : driftIndex < 0.3 ? 'Shifting' : 'Storm'
  let last = (m.weather as any)?.lastChange || new Date().toISOString()
  try {
    const resp = await ADAPT_SUM()
    if ((resp as any)?.ok !== false) {
      const j = await (resp as any).json()
      status = j?.weather?.status || status
      last = j?.weather?.lastChangeISO || last
      driftIndex = j?.weather?.driftIndex ?? driftIndex
    }
  } catch {}
  const weather = { ...(m.weather||{}), status, lastChange: last, lastChangeISO: last }
  return NextResponse.json({ ...m, weather, driftIndex })
}


