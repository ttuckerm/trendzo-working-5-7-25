/**
 * POST /api/operations/training/train?niche=side_hustles
 *
 * Runs `python scripts/train-xgboost-v6.py` server-side via child_process.
 * Tracks progress in training_jobs. UI polls GET for status.
 *
 * GET /api/operations/training/train?job_id=...
 *   Returns the job row (status, results, error).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';
import * as path from 'path';
import * as os from 'os';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { persistSession: false } },
  );
}

// ── GET: poll a job by id ────────────────────────────────────────────────────

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

// ── POST: kick off training ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const niche =
    request.nextUrl.searchParams.get('niche') ||
    ((await request.json().catch(() => ({}))) as any).niche ||
    'side_hustles';

  const supabase = getSupabase();

  // Prevent duplicate running training
  const { data: running } = await supabase
    .from('training_jobs')
    .select('id')
    .eq('model_type', 'xgboost_v6_train')
    .eq('status', 'running')
    .limit(1);

  if (running && running.length > 0) {
    return NextResponse.json(
      { error: 'A training job is already running', job_id: running[0].id },
      { status: 409 },
    );
  }

  // Create job row
  const { data: job, error } = await supabase
    .from('training_jobs')
    .insert({
      status: 'running',
      model_type: 'xgboost_v6_train',
      config: { niche },
      progress: 5,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget
  executeTrainScript(job.id, niche).catch((err) => {
    console.error(`[train] Job ${job.id} error:`, err);
  });

  return NextResponse.json({ job });
}

// ── Script runner ────────────────────────────────────────────────────────────

async function executeTrainScript(jobId: string, niche: string) {
  const supabase = getSupabase();

  try {
    // Build the CSV path that export-training-dataset.ts writes to
    const tmpDir = os.platform() === 'win32'
      ? (process.env.TEMP || 'C:\\Temp')
      : '/tmp';
    const csvPath = path.join(tmpDir, `trendzo_${niche}_training.csv`);

    const scriptPath = path.join(process.cwd(), 'scripts', 'train-xgboost-v6.py');

    const result = await new Promise<{
      code: number | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      // Use `python` (not python3) as requested
      const child = spawn('python', [scriptPath, '--input', csvPath], {
        cwd: process.cwd(),
        shell: true,
        env: { ...process.env },
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (chunk: Buffer) => {
        stdout += chunk.toString();
      });
      child.stderr?.on('data', (chunk: Buffer) => {
        stderr += chunk.toString();
      });

      // Mid-progress update
      const timer = setTimeout(async () => {
        await supabase
          .from('training_jobs')
          .update({ progress: 50 })
          .eq('id', jobId)
          .eq('status', 'running');
      }, 8000);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({ code: 1, stdout, stderr: stderr + '\n' + err.message });
      });
    });

    // Parse metrics from stdout
    const evalMae = parseFloat(result.stdout.match(/Eval MAE:\s*([\d.]+)/)?.[1] || '');
    const within5 = parseFloat(result.stdout.match(/Within \+\/-5:\s*([\d.]+)/)?.[1] || '');
    const tierAcc = parseFloat(result.stdout.match(/Tier accuracy:\s*([\d.]+)/)?.[1] || '');

    if (result.code === 0) {
      await supabase
        .from('training_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          results: {
            niche,
            eval_mae: isNaN(evalMae) ? null : evalMae,
            within_5_pct: isNaN(within5) ? null : within5,
            tier_accuracy_pct: isNaN(tierAcc) ? null : tierAcc,
            exit_code: 0,
            stdout_tail: result.stdout.slice(-2000),
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
          error: result.stderr.slice(-1000) || `Exit code ${result.code}`,
          results: {
            niche,
            exit_code: result.code,
            stderr_tail: result.stderr.slice(-500),
            stdout_tail: result.stdout.slice(-500),
          },
        })
        .eq('id', jobId);
    }
  } catch (err: any) {
    await supabase
      .from('training_jobs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        progress: 100,
        error: err.message,
      })
      .eq('id', jobId);
  }
}
