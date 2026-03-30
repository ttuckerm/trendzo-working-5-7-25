/**
 * POST /api/operations/training/export?niche=side_hustles
 *
 * Runs `scripts/export-training-dataset.ts` server-side via child_process,
 * tracks progress in training_jobs, and returns the job row.
 * UI polls GET /api/operations/training/export?job_id=... for status.
 *
 * GET /api/operations/training/export?job_id=...
 *   Returns the job row (status, results, error).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

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

// ── POST: kick off export ────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const niche =
    request.nextUrl.searchParams.get('niche') ||
    ((await request.json().catch(() => ({}))) as any).niche ||
    'side_hustles';

  const supabase = getSupabase();

  // Prevent duplicate running exports
  const { data: running } = await supabase
    .from('training_jobs')
    .select('id')
    .eq('model_type', 'export_dataset')
    .eq('status', 'running')
    .limit(1);

  if (running && running.length > 0) {
    return NextResponse.json(
      { error: 'An export job is already running', job_id: running[0].id },
      { status: 409 },
    );
  }

  // Create job row
  const { data: job, error } = await supabase
    .from('training_jobs')
    .insert({
      status: 'running',
      model_type: 'export_dataset',
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
  executeExportScript(job.id, niche).catch((err) => {
    console.error(`[export] Job ${job.id} error:`, err);
  });

  return NextResponse.json({ job });
}

// ── Script runner ────────────────────────────────────────────────────────────

async function executeExportScript(jobId: string, niche: string) {
  const supabase = getSupabase();

  try {
    const args = ['tsx', 'scripts/export-training-dataset.ts', '--niche', niche];

    const result = await new Promise<{
      code: number | null;
      stdout: string;
      stderr: string;
    }>((resolve) => {
      const child = spawn('npx', args, {
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

      const timer = setTimeout(async () => {
        await supabase
          .from('training_jobs')
          .update({ progress: 50 })
          .eq('id', jobId)
          .eq('status', 'running');
      }, 5000);

      child.on('close', (code) => {
        clearTimeout(timer);
        resolve({ code, stdout, stderr });
      });
      child.on('error', (err) => {
        clearTimeout(timer);
        resolve({ code: 1, stdout, stderr: stderr + '\n' + err.message });
      });
    });

    // Parse output
    const rowCount =
      parseInt(result.stdout.match(/Training CSV:\s*(\d+)\s*rows/)?.[1] || '0', 10) || null;
    const outputPath = result.stdout.match(/Training CSV:.*→\s*(.+)/)?.[1]?.trim() || null;
    const excludedCount =
      parseInt(result.stdout.match(/Excluded CSV:\s*(\d+)\s*rows/)?.[1] || '0', 10) || null;

    if (result.code === 0) {
      await supabase
        .from('training_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          results: {
            niche,
            row_count: rowCount,
            output_path: outputPath,
            excluded_count: excludedCount,
            exit_code: 0,
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
