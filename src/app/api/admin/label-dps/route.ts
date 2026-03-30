import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { spawn } from 'child_process';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}

// ── GET: List recent label jobs ───────────────────────────────────────────────

export async function GET() {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('training_jobs')
    .select('*')
    .eq('model_type', 'label_dps')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    // Table might not exist yet — return empty
    if (error.code === '42P01') {
      return NextResponse.json({ jobs: [], note: 'training_jobs table not found' });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: data || [] });
}

// ── POST: Start a label job ───────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const body = await request.json();
  const niche: string = body.niche || 'side_hustles';
  const force: boolean = body.force !== false; // default true

  const supabase = getSupabase();

  // Prevent duplicate running jobs
  const { data: running } = await supabase
    .from('training_jobs')
    .select('id')
    .eq('model_type', 'label_dps')
    .eq('status', 'running')
    .limit(1);

  if (running && running.length > 0) {
    return NextResponse.json(
      { error: 'A labeling job is already running', job_id: running[0].id },
      { status: 409 },
    );
  }

  // Create job row — starts as 'running' immediately
  const { data: job, error } = await supabase
    .from('training_jobs')
    .insert({
      status: 'running',
      model_type: 'label_dps',
      config: { niche, force },
      progress: 5,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget: execute the label script
  executeLabelScript(job.id, niche, force).catch((err) => {
    console.error(`[label-dps] Job ${job.id} fire-and-forget error:`, err);
  });

  return NextResponse.json({ job });
}

// ── Script executor ───────────────────────────────────────────────────────────

async function executeLabelScript(
  jobId: string,
  niche: string,
  force: boolean,
): Promise<void> {
  const supabase = getSupabase();

  try {
    const args = ['tsx', 'scripts/label-actual-dps.ts', '--niche', niche];
    if (force) args.push('--force');

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

      // Rough mid-progress update
      const progressTimer = setTimeout(async () => {
        await supabase
          .from('training_jobs')
          .update({ progress: 50 })
          .eq('id', jobId)
          .eq('status', 'running');
      }, 5000);

      child.on('close', (code) => {
        clearTimeout(progressTimer);
        resolve({ code, stdout, stderr });
      });

      child.on('error', (err) => {
        clearTimeout(progressTimer);
        resolve({ code: 1, stdout, stderr: stderr + '\n' + err.message });
      });
    });

    // Parse the structured report from stdout
    const parsed = parseScriptOutput(result.stdout);

    if (result.code === 0) {
      await supabase
        .from('training_jobs')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          progress: 100,
          results: {
            niche,
            ...parsed,
            exit_code: result.code,
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
          error:
            result.stderr.slice(-1000) ||
            `Script exited with code ${result.code}`,
          results: {
            niche,
            ...parsed,
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

// ── Parse the label script's structured report from stdout ────────────────────

function parseScriptOutput(stdout: string) {
  const getNum = (pattern: RegExp): number | null => {
    const m = stdout.match(pattern);
    return m ? parseInt(m[1], 10) : null;
  };
  const getFloat = (pattern: RegExp): number | null => {
    const m = stdout.match(pattern);
    return m ? parseFloat(m[1]) : null;
  };

  return {
    rows_examined: getNum(/Runs examined\s*:\s*(\d+)/),
    rows_labeled: getNum(/Labeled\s*:\s*(\d+)/),
    rows_skipped: getNum(/Missing metrics\s*:\s*(\d+)/),
    error_count: getNum(/Errors\s*:\s*(\d+)/),
    min_dps: getFloat(/MIN\(actual_dps\)\s*:\s*([\d.]+)/),
    max_dps: getFloat(/MAX\(actual_dps\)\s*:\s*([\d.]+)/),
    dps_range: getFloat(/Range\s*:\s*([\d.]+)/),
    distinct_dps: getNum(/Distinct values\s*:\s*(\d+)/),
  };
}
