import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const SUPABASE_URL = process.env.SUPABASE_URL as string | undefined
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY as string | undefined
const PERSIST_ENABLED = Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY)

export async function ensureLLMCallsTable(): Promise<void> {
  if (!PERSIST_ENABLED) return
  const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  const sql = `
  create table if not exists llm_calls (
    id text primary key, -- auditId
    role text not null,
    provider text not null,
    model text not null,
    input_digest text not null,
    output_digest text,
    input_tokens integer,
    output_tokens integer,
    cost_usd numeric,
    cache_hit boolean default false,
    status text not null,
    latency_ms integer,
    ts timestamptz default now()
  );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex')
}

export type LLMCallRecord = {
  id: string
  role: string
  provider: string
  model: string
  input_digest: string
  output_digest?: string | null
  input_tokens?: number | null
  output_tokens?: number | null
  cost_usd?: number | null
  cache_hit?: boolean
  status: 'ok' | 'error' | 'budget_exceeded'
  latency_ms?: number | null
}

export async function writeLLMCall(rec: LLMCallRecord): Promise<void> {
  if (!PERSIST_ENABLED) return
  const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  try {
    await db.from('llm_calls').upsert({
      id: rec.id,
      role: rec.role,
      provider: rec.provider,
      model: rec.model,
      input_digest: rec.input_digest,
      output_digest: rec.output_digest ?? null,
      input_tokens: rec.input_tokens ?? null,
      output_tokens: rec.output_tokens ?? null,
      cost_usd: rec.cost_usd ?? null,
      cache_hit: !!rec.cache_hit,
      status: rec.status,
      latency_ms: rec.latency_ms ?? null
    } as any)
  } catch {}
}

// ===== Daily Budgets =====

export async function ensureLLMBudgetTables(): Promise<void> {
  if (!PERSIST_ENABLED) return
  const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  const sql = `
  create table if not exists llm_budget_counters (
    day date not null,
    role text not null,
    calls integer default 0,
    input_tokens integer default 0,
    output_tokens integer default 0,
    cost_usd numeric default 0,
    primary key (day, role)
  );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export type BudgetCaps = { maxCallsPerDay?: number; maxCostPerDayUsd?: number; maxOutputTokensPerDay?: number; maxInputTokensPerDay?: number }

export async function getBudgetCounters(dayISO: string, role: string): Promise<{ calls: number; input_tokens: number; output_tokens: number; cost_usd: number } | null> {
  try {
    const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    const { data, error } = await db.from('llm_budget_counters').select('calls,input_tokens,output_tokens,cost_usd').eq('day', dayISO.slice(0,10)).eq('role', role).limit(1).single()
    if (error) return null
    return {
      calls: Number((data as any)?.calls || 0),
      input_tokens: Number((data as any)?.input_tokens || 0),
      output_tokens: Number((data as any)?.output_tokens || 0),
      cost_usd: Number((data as any)?.cost_usd || 0)
    }
  } catch { return null }
}

export async function incrementBudgetCounters(dayISO: string, role: string, delta: { calls?: number; input_tokens?: number; output_tokens?: number; cost_usd?: number }): Promise<void> {
  try {
    const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
    // Use upsert with conflict and additive update via raw SQL to avoid race conditions
    const sql = `
      insert into llm_budget_counters(day, role, calls, input_tokens, output_tokens, cost_usd)
      values ('${dayISO.slice(0,10)}', '${role.replace(/'/g, "''")}', ${delta.calls||0}, ${delta.input_tokens||0}, ${delta.output_tokens||0}, ${delta.cost_usd||0})
      on conflict (day, role) do update set
        calls = llm_budget_counters.calls + excluded.calls,
        input_tokens = llm_budget_counters.input_tokens + excluded.input_tokens,
        output_tokens = llm_budget_counters.output_tokens + excluded.output_tokens,
        cost_usd = llm_budget_counters.cost_usd + excluded.cost_usd;
    `
    await (db as any).rpc?.('exec_sql', { query: sql })
  } catch {}
}

// ===== Judge Critiques =====

export async function ensureJudgeCritiquesTable(): Promise<void> {
  if (!PERSIST_ENABLED) return
  const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  const sql = `
  create table if not exists judge_critiques (
    id uuid default gen_random_uuid() primary key,
    audit_id text not null,
    prediction_id text,
    verdict text not null,
    issues jsonb not null default '[]'::jsonb,
    recommendations jsonb default '[]'::jsonb,
    created_at timestamptz default now()
  );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function writeJudgeCritique(row: { auditId: string; prediction_id?: string | null; verdict: 'pass'|'fail'|'needs_review'; issues: any[]; recommendations?: any[] }): Promise<void> {
  if (!PERSIST_ENABLED) return
  const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)
  try {
    await db.from('judge_critiques').insert({
      audit_id: row.auditId,
      prediction_id: row.prediction_id || null,
      verdict: row.verdict,
      issues: row.issues || [],
      recommendations: row.recommendations || []
    } as any)
  } catch {}
}



