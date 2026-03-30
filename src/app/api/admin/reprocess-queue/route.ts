/**
 * Admin Reprocess Queue
 *
 * GET  /api/admin/reprocess-queue         → Dashboard stats + fixable run preview
 * POST /api/admin/reprocess-queue         → Fix non-training-ready runs
 *
 * Fix strategies (cheapest first):
 *   1. status_fix:            status='success' → 'completed' (has everything else)
 *   2. synthesize_raw_result: has components but no raw_result → synthesize + complete
 *   3. rerun:                 no components → full pipeline re-run + copy v2 label (legacy labels skipped)
 *
 * Guardrails:
 *   - Max 25 per request (default 10)
 *   - Idempotent: skips already training_ready rows
 *   - All errors captured per run_id
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { auth: { persistSession: false } },
);

const MAX_BATCH = 25;
const DEFAULT_BATCH = 10;

// ── Types ─────────────────────────────────────────────────────────────────────

type Strategy = 'status_fix' | 'synthesize_raw_result' | 'rerun';

interface FixDetail {
  run_id: string;
  video_id: string;
  strategy: Strategy;
  success: boolean;
  error?: string;
}

// ── GET: Dashboard + fixable preview ──────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const niche = request.nextUrl.searchParams.get('niche') || null;

    // 1. Training readiness summary
    const { data: summary, error: summErr } = await supabase
      .from('training_readiness_summary')
      .select('*');

    if (summErr) {
      return NextResponse.json({ success: false, error: summErr.message }, { status: 500 });
    }

    // 2. Preview fixable runs (non-training-ready with actual_dps)
    let query = supabase
      .from('prediction_runs_enriched')
      .select('id, status, has_components, has_raw_result, component_rows_count, niche, actual_dps')
      .eq('training_ready', false)
      .not('actual_dps', 'is', null);

    if (niche) query = query.eq('niche', niche);

    const { data: fixable, error: fixErr } = await query;

    if (fixErr) {
      return NextResponse.json({ success: false, error: fixErr.message }, { status: 500 });
    }

    // Categorize by fix strategy
    let statusFix = 0;
    let synthesize = 0;
    let rerun = 0;

    for (const r of fixable || []) {
      if (r.has_components && r.has_raw_result && r.status !== 'completed') {
        statusFix++;
      } else if (r.has_components && !r.has_raw_result) {
        synthesize++;
      } else if (!r.has_components) {
        rerun++;
      }
    }

    return NextResponse.json({
      success: true,
      summary: summary || [],
      fixable: {
        total: (fixable || []).length,
        by_strategy: {
          status_fix: statusFix,
          synthesize_raw_result: synthesize,
          needs_rerun: rerun,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── POST: Fix non-training-ready runs ─────────────────────────────────────────

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json().catch(() => ({}));
    const niche = (body.niche as string) || null;
    const limit = Math.min(Math.max(body.limit ?? DEFAULT_BATCH, 1), MAX_BATCH);

    console.log(`[reprocess-queue] Starting: niche=${niche || 'all'}, limit=${limit}`);

    // 1. Fetch non-training-ready runs that have actual_dps (i.e., labeled but broken)
    let query = supabase
      .from('prediction_runs_enriched')
      .select(
        'id, video_id, status, actual_dps, actual_tier, predicted_dps_7d, ' +
        'predicted_tier_7d, confidence, has_components, has_raw_result, ' +
        'component_rows_count, niche, components_used, ' +
        'dps_formula_version, dps_label_trust, dps_training_weight',
      )
      .eq('training_ready', false)
      .not('actual_dps', 'is', null);

    if (niche) query = query.eq('niche', niche);

    const { data: runs, error: fetchErr } = await query
      .order('created_at', { ascending: false })
      .limit(limit);

    if (fetchErr) {
      return NextResponse.json({ success: false, error: fetchErr.message }, { status: 500 });
    }

    if (!runs || runs.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No fixable runs found. All labeled runs are already training_ready.',
        counts: { attempted: 0, quick_fixed: 0, synthesized: 0, rerun_succeeded: 0, rerun_failed: 0, total_fixed: 0 },
        details: [],
        elapsed_ms: Date.now() - startTime,
      });
    }

    console.log(`[reprocess-queue] Found ${runs.length} fixable runs`);

    // 2. Process each run with the cheapest applicable strategy
    const details: FixDetail[] = [];
    let quickFixed = 0;
    let synthesized = 0;
    let rerunSucceeded = 0;
    let rerunFailed = 0;

    for (const run of runs) {
      // ── Strategy 1: Status fix ──────────────────────────────────────────
      // Has components + raw_result, just wrong status
      if (run.has_components && run.has_raw_result && run.status !== 'completed') {
        const { error } = await supabase
          .from('prediction_runs')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', run.id);

        const ok = !error;
        if (ok) quickFixed++;
        details.push({
          run_id: run.id,
          video_id: run.video_id,
          strategy: 'status_fix',
          success: ok,
          error: error?.message,
        });
        console.log(`[reprocess-queue] ${ok ? '✓' : '✗'} status_fix run=${run.id.slice(0, 8)}`);
        continue;
      }

      // ── Strategy 2: Synthesize raw_result ───────────────────────────────
      // Has components but no raw_result
      if (run.has_components && !run.has_raw_result) {
        const synthesizedRawResult = {
          _synthesized: true,
          _synthesized_at: new Date().toISOString(),
          _reason: 'Synthesized from component results for training readiness',
          success: true,
          dps: run.predicted_dps_7d ?? 0,
          confidence: run.confidence ?? 0,
          viralPotential: run.predicted_tier_7d ?? 'unknown',
          componentsUsed: run.components_used ?? [],
        };

        const { error } = await supabase
          .from('prediction_runs')
          .update({
            status: 'completed',
            raw_result: synthesizedRawResult,
            completed_at: new Date().toISOString(),
          })
          .eq('id', run.id);

        const ok = !error;
        if (ok) synthesized++;
        details.push({
          run_id: run.id,
          video_id: run.video_id,
          strategy: 'synthesize_raw_result',
          success: ok,
          error: error?.message,
        });
        console.log(`[reprocess-queue] ${ok ? '✓' : '✗'} synthesize run=${run.id.slice(0, 8)}`);
        continue;
      }

      // ── Strategy 3: Full re-run ─────────────────────────────────────────
      // No components — need to run the full prediction pipeline
      try {
        // Get video_files data to pass as pipeline options
        const { data: vf } = await supabase
          .from('video_files')
          .select('id, niche, goal, account_size_band, storage_path')
          .eq('id', run.video_id)
          .single();

        if (!vf) {
          rerunFailed++;
          details.push({
            run_id: run.id,
            video_id: run.video_id,
            strategy: 'rerun',
            success: false,
            error: 'video_files row not found',
          });
          continue;
        }

        console.log(`[reprocess-queue] Running pipeline for video=${vf.id.slice(0, 8)}...`);

        const pipelineResult = await runPredictionPipeline(vf.id, {
          mode: 'standard',
          niche: vf.niche,
          goal: vf.goal,
          accountSize: vf.account_size_band,
          videoFilePath: vf.storage_path,
        });

        if (pipelineResult.success) {
          // Copy label from old run to new run — only if the source is a v2 label.
          // Legacy labels use a different score scale and must not be blindly copied.
          const isV2Label = (run as any).dps_formula_version != null
            && (run as any).dps_formula_version.startsWith('2');
          if (run.actual_dps != null && isV2Label) {
            await supabase
              .from('prediction_runs')
              .update({
                actual_dps: run.actual_dps,
                actual_tier: run.actual_tier,
                dps_formula_version: (run as any).dps_formula_version,
                dps_label_trust: (run as any).dps_label_trust,
                dps_training_weight: (run as any).dps_training_weight,
              })
              .eq('id', pipelineResult.run_id);
          }

          rerunSucceeded++;
          details.push({
            run_id: pipelineResult.run_id,
            video_id: run.video_id,
            strategy: 'rerun',
            success: true,
          });
          console.log(`[reprocess-queue] ✓ rerun video=${vf.id.slice(0, 8)} → new run=${pipelineResult.run_id.slice(0, 8)}`);
        } else {
          rerunFailed++;
          details.push({
            run_id: run.id,
            video_id: run.video_id,
            strategy: 'rerun',
            success: false,
            error: pipelineResult.error || 'Pipeline returned success=false',
          });
          console.log(`[reprocess-queue] ✗ rerun video=${vf.id.slice(0, 8)}: ${pipelineResult.error}`);
        }
      } catch (err: any) {
        rerunFailed++;
        details.push({
          run_id: run.id,
          video_id: run.video_id,
          strategy: 'rerun',
          success: false,
          error: err.message,
        });
        console.log(`[reprocess-queue] ✗ rerun exception run=${run.id.slice(0, 8)}: ${err.message}`);
      }
    }

    const totalFixed = quickFixed + synthesized + rerunSucceeded;
    const elapsed = Date.now() - startTime;

    console.log(`[reprocess-queue] Done in ${elapsed}ms: ${totalFixed} fixed (${quickFixed} status, ${synthesized} synthesized, ${rerunSucceeded} rerun)`);

    return NextResponse.json({
      success: true,
      counts: {
        attempted: runs.length,
        quick_fixed: quickFixed,
        synthesized,
        rerun_succeeded: rerunSucceeded,
        rerun_failed: rerunFailed,
        total_fixed: totalFixed,
      },
      details,
      elapsed_ms: elapsed,
    });
  } catch (err: any) {
    console.error('[reprocess-queue] Fatal:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
