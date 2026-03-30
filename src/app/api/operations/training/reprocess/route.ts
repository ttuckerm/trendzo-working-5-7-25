/**
 * POST /api/operations/training/reprocess
 *   Body: { run_id }
 *   Creates a training_jobs row, then fire-and-forgets the fix work.
 *   Returns the job immediately so the UI can poll.
 *
 * GET /api/operations/training/reprocess?job_id=...
 *   Polls the job row for status updates.
 *
 * Fix strategies (cheapest first, mirrors /api/admin/reprocess-queue):
 *   1. status_fix:            status != 'completed' but has components + raw_result
 *   2. synthesize_raw_result: has components but no raw_result → synthesize + complete
 *   3. rerun:                 no components → full pipeline re-run + copy v2 label (legacy labels skipped)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { runPredictionPipeline } from '@/lib/prediction/runPredictionPipeline';

export const dynamic = 'force-dynamic';

/** Shape of the enriched run row we SELECT */
interface EnrichedRun {
  id: string;
  video_id: string;
  status: string;
  actual_dps: number | null;
  actual_tier: string | null;
  predicted_dps_7d: number | null;
  predicted_tier_7d: string | null;
  confidence: number | null;
  has_components: boolean;
  has_raw_result: boolean;
  component_rows_count: number | null;
  niche: string | null;
  components_used: string[] | null;
  training_ready: boolean;
  // DPS v2 provenance — must be copied alongside actual_dps during reprocessing
  dps_formula_version: string | null;
  dps_label_trust: string | null;
  dps_training_weight: number | null;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── GET: poll job by id ──────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get('job_id');
  if (!jobId) {
    return NextResponse.json({ error: 'job_id required' }, { status: 400 });
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ job: data });
}

// ── POST: enqueue single-run reprocess ───────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const runId: string | undefined = body.run_id;

    if (!runId) {
      return NextResponse.json(
        { success: false, error: 'run_id is required' },
        { status: 400 },
      );
    }

    const supabase = getSupabase();

    // Verify the run exists and is not already training_ready
    const { data: rawRun, error: runErr } = await supabase
      .from('prediction_runs_enriched')
      .select(
        'id, video_id, status, actual_dps, actual_tier, predicted_dps_7d, ' +
        'predicted_tier_7d, confidence, has_components, has_raw_result, ' +
        'component_rows_count, niche, components_used, training_ready, ' +
        'dps_formula_version, dps_label_trust, dps_training_weight',
      )
      .eq('id', runId)
      .single();

    const run = rawRun as unknown as EnrichedRun | null;

    if (runErr || !run) {
      return NextResponse.json(
        { success: false, error: `Run not found: ${runErr?.message || 'unknown'}` },
        { status: 404 },
      );
    }

    if (run.training_ready) {
      return NextResponse.json(
        { success: false, error: 'Run is already training_ready' },
        { status: 409 },
      );
    }

    // Determine strategy
    let strategy: string;
    if (run.has_components && run.has_raw_result && run.status !== 'completed') {
      strategy = 'status_fix';
    } else if (run.has_components && !run.has_raw_result) {
      strategy = 'synthesize_raw_result';
    } else if (!run.has_components) {
      strategy = 'rerun';
    } else {
      strategy = 'unknown';
    }

    // Create training_jobs row
    const { data: job, error: jobErr } = await supabase
      .from('training_jobs')
      .insert({
        status: 'running',
        model_type: 'reprocess_single',
        config: { run_id: runId, video_id: run.video_id, strategy },
        progress: 10,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (jobErr) {
      return NextResponse.json(
        { success: false, error: jobErr.message },
        { status: 500 },
      );
    }

    // Fire-and-forget the actual reprocess work
    processRun(job.id, run).catch((err) => {
      console.error(`[reprocess] Job ${job.id} fatal:`, err);
    });

    return NextResponse.json({ success: true, job });
  } catch (err: any) {
    console.error('[reprocess] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}

// ── Async worker ─────────────────────────────────────────────────────────────

async function processRun(jobId: string, run: any) {
  const supabase = getSupabase();

  try {
    // ── Strategy 1: Status fix ──────────────────────────────────────────
    if (run.has_components && run.has_raw_result && run.status !== 'completed') {
      const { error } = await supabase
        .from('prediction_runs')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', run.id);

      await supabase
        .from('training_jobs')
        .update({
          status: error ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          results: { strategy: 'status_fix', success: !error },
          ...(error ? { error_message: error.message } : {}),
        })
        .eq('id', jobId);
      return;
    }

    // ── Strategy 2: Synthesize raw_result ────────────────────────────────
    if (run.has_components && !run.has_raw_result) {
      const synthesized = {
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
          raw_result: synthesized,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);

      await supabase
        .from('training_jobs')
        .update({
          status: error ? 'failed' : 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          results: { strategy: 'synthesize_raw_result', success: !error },
          ...(error ? { error_message: error.message } : {}),
        })
        .eq('id', jobId);
      return;
    }

    // ── Strategy 3: Full re-run ─────────────────────────────────────────
    if (!run.has_components) {
      await supabase
        .from('training_jobs')
        .update({ progress: 30 })
        .eq('id', jobId);

      // Find the video_files row
      const { data: vf } = await supabase
        .from('video_files')
        .select('id, niche, goal, account_size_band, storage_path')
        .eq('id', run.video_id)
        .single();

      if (!vf) {
        await supabase
          .from('training_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            progress: 100,
            error_message: 'video_files row not found',
            results: { strategy: 'rerun', success: false },
          })
          .eq('id', jobId);
        return;
      }

      await supabase
        .from('training_jobs')
        .update({ progress: 50 })
        .eq('id', jobId);

      const pipelineResult = await runPredictionPipeline(vf.id, {
        mode: 'standard',
        niche: vf.niche,
        goal: vf.goal,
        accountSize: vf.account_size_band,
        videoFilePath: vf.storage_path,
      });

      if (pipelineResult.success) {
        // Copy actuals from old run to new run — only if the source label is v2.
        // Legacy labels (dps_formula_version != '2.x') use a different score scale
        // and must not be blindly copied. Those runs should be re-labeled through
        // the canonical v2 path (auto-labeler or rescore-legacy-to-v2.ts).
        const isV2Label = run.dps_formula_version != null
          && run.dps_formula_version.startsWith('2');
        if (run.actual_dps != null && isV2Label) {
          await supabase
            .from('prediction_runs')
            .update({
              actual_dps: run.actual_dps,
              actual_tier: run.actual_tier,
              dps_formula_version: run.dps_formula_version,
              dps_label_trust: run.dps_label_trust,
              dps_training_weight: run.dps_training_weight,
            })
            .eq('id', pipelineResult.run_id);
        }

        await supabase
          .from('training_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            progress: 100,
            results: {
              strategy: 'rerun',
              success: true,
              new_run_id: pipelineResult.run_id,
            },
          })
          .eq('id', jobId);
      } else {
        await supabase
          .from('training_jobs')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            progress: 100,
            error_message: pipelineResult.error || 'Pipeline returned success=false',
            results: { strategy: 'rerun', success: false },
          })
          .eq('id', jobId);
      }
      return;
    }

    // Fallback — unknown state
    await supabase
      .from('training_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        progress: 100,
        error_message: 'Could not determine fix strategy',
        results: { strategy: 'unknown', success: false },
      })
      .eq('id', jobId);
  } catch (err: any) {
    await supabase
      .from('training_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        progress: 100,
        error_message: err.message,
      })
      .eq('id', jobId);
  }
}
