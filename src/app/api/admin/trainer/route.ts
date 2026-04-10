/**
 * Trainer Engine API — Chairman-triggered training experiments
 *
 * POST actions:
 *   (default)                              — Run auto-detected experiment (default sandbox)
 *   ?action=launch                         — Launch a targeted experiment
 *   ?action=promote&variant_id=UUID        — Promote a model variant with backup + log
 *   ?action=promote_sandbox&experiment_id= — Re-run sandbox experiment in production
 *   ?action=rollback&niche=               — Rollback to previous model (niche=null for global)
 *
 * GET views:
 *   (default)                              — Full trainer status
 *   ?view=comparison&a=UUID&b=UUID         — Side-by-side model comparison
 *   ?view=promotion_log                    — Promotion/rollback history
 *   ?mode=sandbox|production               — Filter experiments by mode
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  runTrainerEngine,
  promoteModelVariant,
  rollbackModelVariant,
  launchExperiment,
  promoteSandboxExperiment,
} from '@/lib/training/trainer-engine'
import type { ExperimentMode, LaunchExperimentOptions } from '@/lib/training/trainer-engine'
import { invalidateRouteCache } from '@/lib/prediction/model-router'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

function getServiceDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// ── POST: Run experiment, launch targeted, promote variant/sandbox ──────

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // Action: promote a model variant to active (with backup + log)
  if (action === 'promote') {
    const variantId = searchParams.get('variant_id')
    if (!variantId) {
      return NextResponse.json({ error: 'variant_id required' }, { status: 400 })
    }

    let body: any = {}
    try { body = await request.json() } catch { /* no body is fine */ }
    const reason = body?.reason || undefined

    const result = await promoteModelVariant(variantId, reason)
    if (result.success) invalidateRouteCache()
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  }

  // Action: rollback to previous model
  if (action === 'rollback') {
    const niche = searchParams.get('niche') || null

    let body: any = {}
    try { body = await request.json() } catch { /* no body is fine */ }
    const reason = body?.reason || undefined

    const result = await rollbackModelVariant(niche === '' ? null : niche, reason)
    if (result.success) invalidateRouteCache()
    return NextResponse.json(result, { status: result.success ? 200 : 400 })
  }

  // Action: promote sandbox experiment to production (re-run)
  if (action === 'promote_sandbox') {
    const experimentId = searchParams.get('experiment_id')
    if (!experimentId) {
      return NextResponse.json({ error: 'experiment_id required' }, { status: 400 })
    }

    const startTime = Date.now()
    const result = await promoteSandboxExperiment(experimentId)
    return NextResponse.json({ ...result, elapsed_ms: Date.now() - startTime })
  }

  // Action: launch targeted experiment (from quick-launcher form)
  if (action === 'launch') {
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { experiment_type, niche_scope, description, experiment_mode } = body

    if (!experiment_type || !description) {
      return NextResponse.json(
        { error: 'experiment_type and description are required' },
        { status: 400 },
      )
    }

    const validTypes = ['retrain', 'feature_add', 'feature_remove', 'hyperparameter', 'niche_specific']
    if (!validTypes.includes(experiment_type)) {
      return NextResponse.json(
        { error: `Invalid experiment_type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 },
      )
    }

    const validModes: ExperimentMode[] = ['sandbox', 'production']
    const mode: ExperimentMode = validModes.includes(experiment_mode) ? experiment_mode : 'sandbox'

    const opts: LaunchExperimentOptions = {
      experiment_type,
      niche_scope: niche_scope || null,
      description,
      experiment_mode: mode,
    }

    const startTime = Date.now()
    const result = await launchExperiment(opts)
    return NextResponse.json({ ...result, elapsed_ms: Date.now() - startTime })
  }

  // Default action: run auto-detected experiment (defaults to sandbox)
  let body: any = {}
  try { body = await request.json() } catch { /* no body is fine */ }

  const mode: ExperimentMode = body?.experiment_mode === 'production' ? 'production' : 'sandbox'

  const startTime = Date.now()
  const result = await runTrainerEngine(null, { mode })
  const elapsed = Date.now() - startTime

  return NextResponse.json({ ...result, elapsed_ms: elapsed })
}

// ── GET: Trainer status, comparison view, promotion log ─────────────────

export async function GET(request: NextRequest) {
  const db = getServiceDb()
  if (!db) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { searchParams } = new URL(request.url)
  const view = searchParams.get('view')

  // ── View: Side-by-side model comparison ─────────────────────────────
  if (view === 'comparison') {
    const idA = searchParams.get('a')
    const idB = searchParams.get('b')
    if (!idA || !idB) {
      return NextResponse.json({ error: 'Both a= and b= variant IDs required' }, { status: 400 })
    }

    const [{ data: variantA }, { data: variantB }] = await Promise.all([
      db.from('model_variants').select('*').eq('id', idA).single(),
      db.from('model_variants').select('*').eq('id', idB).single(),
    ])

    if (!variantA || !variantB) {
      return NextResponse.json({ error: 'One or both variants not found' }, { status: 404 })
    }

    // Get experiment data for each variant (if linked)
    const [{ data: expA }, { data: expB }] = await Promise.all([
      variantA.experiment_id
        ? db.from('training_experiments').select('*').eq('id', variantA.experiment_id).single()
        : Promise.resolve({ data: null }),
      variantB.experiment_id
        ? db.from('training_experiments').select('*').eq('id', variantB.experiment_id).single()
        : Promise.resolve({ data: null }),
    ])

    // Compute feature importance diff
    const featuresA: string[] = Array.isArray(variantA.features) ? variantA.features : []
    const featuresB: string[] = Array.isArray(variantB.features) ? variantB.features : []
    const allFeatures = [...new Set([...featuresA, ...featuresB])]
    const featureDiff = allFeatures.map(f => ({
      feature: f,
      in_a: featuresA.includes(f),
      in_b: featuresB.includes(f),
      status: featuresA.includes(f) && featuresB.includes(f) ? 'both'
        : featuresA.includes(f) ? 'only_a' : 'only_b',
    }))

    return NextResponse.json({
      variant_a: {
        ...variantA,
        experiment: expA,
        feature_count: featuresA.length,
      },
      variant_b: {
        ...variantB,
        experiment: expB,
        feature_count: featuresB.length,
      },
      feature_diff: featureDiff,
      spearman_delta: variantA.spearman_score != null && variantB.spearman_score != null
        ? Math.round((variantB.spearman_score - variantA.spearman_score) * 10000) / 10000
        : null,
    })
  }

  // ── View: Promotion log ─────────────────────────────────────────────
  if (view === 'promotion_log') {
    const { data: logs } = await db
      .from('model_promotion_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30)

    return NextResponse.json({ promotion_log: logs || [] })
  }

  // ── Default view: Full trainer status ───────────────────────────────
  const modeFilter = searchParams.get('mode') as ExperimentMode | null

  let experimentsQuery = db
    .from('training_experiments')
    .select('id, experiment_type, experiment_mode, niche_scope, description, training_data_rows, validation_spearman, baseline_spearman, delta, result, error_message, promoted_from_sandbox_id, features_used, hyperparams, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (modeFilter) {
    experimentsQuery = experimentsQuery.eq('experiment_mode', modeFilter)
  }

  const { data: experiments } = await experimentsQuery

  // Active model variants (full data for status card)
  const { data: activeVariants } = await db
    .from('model_variants')
    .select('id, niche, model_version, spearman_score, features, hyperparams, is_active, promoted_at, prediction_count, training_data_stats, created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  // Pending promotion candidates
  const { data: pendingVariants } = await db
    .from('model_variants')
    .select('id, niche, model_version, spearman_score, features, hyperparams, is_active, experiment_id, created_at')
    .eq('is_active', false)
    .not('deactivated_at', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  // All inactive variants (for comparison dropdown + rollback)
  const { data: allInactiveVariants } = await db
    .from('model_variants')
    .select('id, niche, model_version, spearman_score, is_active, experiment_id, deactivated_at, replaced_by, created_at')
    .eq('is_active', false)
    .order('created_at', { ascending: false })
    .limit(20)

  // Active program
  const { data: programs } = await db
    .from('trainer_programs')
    .select('id, program_name, is_active, created_at')
    .eq('is_active', true)
    .limit(1)

  // Feedback data count (since last experiment)
  const { data: lastExp } = await db
    .from('training_experiments')
    .select('created_at')
    .in('result', ['improved', 'no_change', 'degraded', 'pending_promotion'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let feedbackCount = 0
  let feedbackQuery = db
    .from('prediction_runs')
    .select('id', { count: 'exact', head: true })
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)

  if (lastExp?.created_at) {
    feedbackQuery = feedbackQuery.gte('created_at', lastExp.created_at)
  }

  const { count } = await feedbackQuery
  feedbackCount = count || 0

  // Total prediction count (for production status card)
  const { count: totalPredictions } = await db
    .from('prediction_runs')
    .select('id', { count: 'exact', head: true })

  // Niche data availability (for experiment launcher dropdown)
  const { data: nicheData } = await db
    .from('prediction_runs')
    .select('video_id')
    .not('actual_dps', 'is', null)
    .not('predicted_dps_7d', 'is', null)
    .limit(5000)

  const videoIds = [...new Set((nicheData || []).map((r: any) => r.video_id).filter(Boolean))]
  const nicheCounts: Record<string, number> = {}
  if (videoIds.length > 0) {
    for (let i = 0; i < videoIds.length; i += 100) {
      const batch = videoIds.slice(i, i + 100)
      const { data: videos } = await db
        .from('video_files')
        .select('id, niche')
        .in('id', batch)
      for (const v of videos || []) {
        if (v.niche) nicheCounts[v.niche] = (nicheCounts[v.niche] || 0) + 1
      }
    }
  }

  // Recent promotion log (last 5)
  const { data: recentPromotions } = await db
    .from('model_promotion_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5)

  return NextResponse.json({
    active_program: programs?.[0] || null,
    active_variants: activeVariants || [],
    pending_variants: pendingVariants || [],
    inactive_variants: allInactiveVariants || [],
    recent_experiments: experiments || [],
    feedback_rows_since_last_training: feedbackCount,
    total_predictions: totalPredictions || 0,
    niches_with_data: nicheCounts,
    recent_promotions: recentPromotions || [],
  })
}
