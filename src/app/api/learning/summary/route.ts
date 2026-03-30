import { NextResponse } from 'next/server'
import { getCurrentModel, readCandidate } from '@/lib/learning/store'
import { buildTrend, computeDriftIndex, readCachedSummary, writeCachedSummary } from '@/lib/learning/summary'

export async function GET() {
  try {
    const cached = readCachedSummary()
    const now = Date.now()
    if (cached && now - new Date(cached.lastUpdateISO).getTime() < 10*60*1000) {
      return NextResponse.json(cached)
    }
    const cur = await getCurrentModel()
    const cand = await readCandidate()
    const trend = buildTrend(30)
    const driftIndex = computeDriftIndex()
    const out = {
      currentVersion: cur.version,
      candidateVersion: cand?.version,
      lastUpdateISO: new Date().toISOString(),
      accuracyTrend: trend,
      driftIndex,
      ece: cur.metricsAtBuild?.ece || 0,
      auroc: cur.metricsAtBuild?.auroc || 0,
    }
    writeCachedSummary(out)
    return NextResponse.json(out)
  } catch (e:any) {
    const out = { currentVersion: 1, lastUpdateISO: new Date().toISOString(), accuracyTrend: [], driftIndex: 0, ece: 0, auroc: 0 }
    return NextResponse.json(out)
  }
}








































































































































