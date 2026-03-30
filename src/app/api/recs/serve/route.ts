import { NextRequest, NextResponse } from 'next/server'
import { evaluateFlag } from '@/lib/flags'
import { recordServe } from '@/lib/recs/metrics'
import { rankCandidates, synthesizeCandidates } from '@/lib/recs/cap320/ranker'
import { applyExploration } from '@/lib/recs/cap330/exploration'
import { emitScoreServed, emitRegretCapped, emitItemPromoted, emitItemDemoted } from '@/lib/recs/events'
import { evaluateGuardrails, recordExposure } from '@/lib/recs/guardrails'

export async function GET(req: NextRequest) {
  const tenantId = req.headers.get('x-tenant-id') || null
  const enabled = await evaluateFlag('algo_aplusplus', tenantId)
  if (!enabled) {
    return NextResponse.json({ error: 'feature_disabled' }, { status: 403 })
  }
  return NextResponse.json({ ok: true, status: 'ready' }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function POST(req: NextRequest) {
  try {
    const t0 = Date.now()
    const tenantId = req.headers.get('x-tenant-id') || null
    const enabled = await evaluateFlag('algo_aplusplus', tenantId)
    if (!enabled) {
      const res = NextResponse.json({ error: 'feature_disabled' }, { status: 403 })
      recordServe(Date.now()-t0, false)
      return res
    }

    const body = await req.json().catch(() => ({}))
    const platform = (body.platform || 'tiktok') as any
    const topK = Math.max(1, Math.min(50, Number(body.topK ?? 10)))
    const candidates = Array.isArray(body.candidates) && body.candidates.length
      ? body.candidates
      : synthesizeCandidates(Math.max(20, topK * 2), platform)

    const base = await rankCandidates({ platform, topK, cohort: body.cohort || null, candidates })

    // CAP-330 exploration overlay
    const exploreCfg = {
      strategy: (body.strategy || 'ucb') as 'ucb' | 'thompson',
      budgetFraction: Math.max(0, Math.min(0.3, Number(body.budgetFraction ?? 0.2))),
      minCandidates: 10,
      perCohortGuard: undefined,
      seed: body.seed != null ? Number(body.seed) : undefined
    }
    const expl = applyExploration(base.items, base.topK, exploreCfg)

    // CAP-350: apply guardrails (penalties/bonuses, exposure caps). For simplicity, we apply after exploration
    const userId = req.headers.get('x-user-id')
    const after = expl.items.map(it => {
      const gr = evaluateGuardrails({ id: it.id, scores: it.scores }, userId)
      const adjusted = { ...it }
      adjusted.scores.composite = adjusted.scores.composite - gr.penalty + gr.bonus
      if (gr.exposureCapped) adjusted.constraintsApplied = [...(adjusted.constraintsApplied||[]), 'exposure_cap']
      return adjusted
    })
    after.sort((a,b)=> b.scores.composite - a.scores.composite)
    for (let i=0;i<after.length;i++) after[i].rank = i+1
    const result = { ...base, items: after, explore_id: expl.explore_id }

    // Emit ScoreServed summary event
    await emitScoreServed({
      auditId: result.auditId,
      tenantId,
      alg_version: result.alg_version,
      calibration_version: result.calibration_version,
      platform,
      topK: result.topK,
      served_count: result.items.length,
    })

    // Emit per-item regret capped events and promotion/demotion
    for (const it of result.items) {
      if (it.constraintsApplied.includes('regret_floor')) {
        await emitRegretCapped({ auditId: result.auditId, itemId: it.id, regret_prob: it.scores.regret_prob })
      }
    }
    for (const id of expl.promoted) await emitItemPromoted({ auditId: result.auditId, itemId: id })
    for (const id of expl.demoted) await emitItemDemoted({ auditId: result.auditId, itemId: id })

    // Record exposure counts for caps
    recordExposure(result.items.map(x => x.id), userId)

    const dur = Date.now() - t0
    recordServe(dur, true)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store', 'X-Alg-Version': result.alg_version, 'X-Cal-Version': result.calibration_version, 'X-Explore-Id': result.explore_id || '' } })
  } catch (e: any) {
    recordServe(0, false)
    return NextResponse.json({ error: 'server_error', message: String(e?.message || e) }, { status: 500 })
  }
}


