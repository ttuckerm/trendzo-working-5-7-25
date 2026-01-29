import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'canceled'

export async function ensureJobRunsTable(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: `
      create table if not exists job_runs (
        id uuid default gen_random_uuid() primary key,
        type text not null,
        status text not null default 'queued',
        progress_pct numeric default 0,
        started_at timestamptz default now(),
        finished_at timestamptz,
        meta jsonb default '{}'::jsonb
      );
      create index if not exists idx_job_runs_type on job_runs(type);
      create index if not exists idx_job_runs_status on job_runs(status);
      create index if not exists idx_job_runs_started_at on job_runs(started_at);
    ` })
  } catch {}
}

export async function createJobRun(type: string, meta: any = {}): Promise<string> {
  await ensureJobRunsTable()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data, error } = await db.from('job_runs').insert({ type, status: 'running', progress_pct: 0, meta }).select('id').limit(1)
  if (error) throw error
  return String((data as any)?.[0]?.id)
}

export async function updateJobRun(id: string, fields: Partial<{ status: JobStatus; progress_pct: number; meta: any }>, progressEvent?: any): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  let metaUpdate: any = fields.meta
  if (progressEvent) {
    try {
      const { data } = await db.from('job_runs').select('meta').eq('id', id).limit(1)
      const prev = (Array.isArray(data) && data.length ? (data as any)[0].meta : {}) || {}
      const arr = Array.isArray(prev.progress_events) ? prev.progress_events : []
      metaUpdate = { ...(prev||{}), ...(fields.meta||{}), progress_events: [...arr, progressEvent].slice(-200) }
    } catch {}
  }
  await db.from('job_runs').update({ ...fields, meta: metaUpdate ?? fields.meta }).eq('id', id)
}

export async function finishJobRun(id: string, status: JobStatus, meta: any = {}): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await db.from('job_runs').update({ status, progress_pct: status==='success'?100:undefined, finished_at: new Date().toISOString(), meta }).eq('id', id)
}

export async function markCanceled(id: string): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  await db.from('job_runs').update({ status: 'canceled', finished_at: new Date().toISOString() }).eq('id', id)
}

export async function isCanceled(id: string): Promise<boolean> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('job_runs').select('status').eq('id', id).limit(1)
  const st = Array.isArray(data) && data.length ? (data as any)[0].status : 'running'
  return st === 'canceled'
}


