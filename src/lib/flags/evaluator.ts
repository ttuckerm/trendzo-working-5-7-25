import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

type EvalInput = { userId: string; plan?: string | null; cohorts?: string[] | null }

const cache: Map<string, { ts: number; value: Record<string, boolean> }> = new Map()
const TTL_MS = 5 * 60 * 1000

function hasSupabase(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY)
}

async function ensureTables() {
  if (!hasSupabase()) return
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists feature_flags (
    id text primary key,
    description text,
    created_at timestamptz default now()
  );
  create table if not exists feature_assignments (
    user_id uuid,
    flag_id text references feature_flags(id),
    allow boolean not null,
    cohort text,
    plan text,
    rollout int,
    created_at timestamptz default now()
  );
  create table if not exists feature_audit (
    id bigserial primary key,
    actor text,
    action text,
    flag_id text,
    user_id uuid,
    meta jsonb,
    ts timestamptz default now()
  );`;
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}

export async function evaluateFlags(input: EvalInput): Promise<Record<string, boolean>> {
  // In environments without Supabase configured, default to no flags and avoid runtime errors
  if (!hasSupabase()) return {}
  await ensureTables()
  const key = JSON.stringify({ u: input.userId, p: input.plan || '', c: (input.cohorts||[]).slice().sort() })
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < TTL_MS) return hit.value
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data: flags } = await db.from('feature_flags').select('id')
  const allFlags: string[] = Array.isArray(flags) ? (flags as any[]).map(r => String((r as any).id)) : []
  const out: Record<string, boolean> = {}
  for (const fid of allFlags) out[fid] = false
  const cohorts = (input.cohorts || []) as string[]
  const plan = input.plan || null
  const userId = input.userId
  const { data: assigns } = await db.from('feature_assignments').select('*').eq('flag_id', null as any)
  const { data: rows } = await db.from('feature_assignments').select('*').order('created_at', { ascending: true })
  const list: any[] = Array.isArray(rows) ? rows : []
  for (const fid of allFlags) {
    let decided: boolean | null = null
    // explicit user
    const userRules = list.filter(r => (r as any).flag_id === fid && (r as any).user_id === userId)
    if (userRules.length) decided = Boolean(userRules[userRules.length-1].allow)
    if (decided === null && plan) {
      const planRules = list.filter(r => (r as any).flag_id === fid && (r as any).plan === plan)
      if (planRules.length) decided = Boolean(planRules[planRules.length-1].allow)
    }
    if (decided === null && cohorts.length) {
      const cohortRules = list.filter(r => (r as any).flag_id === fid && cohorts.includes((r as any).cohort))
      if (cohortRules.length) decided = Boolean(cohortRules[cohortRules.length-1].allow)
    }
    if (decided === null) {
      const rolloutRules = list.filter(r => (r as any).flag_id === fid && (r as any).rollout !== null && (r as any).rollout !== undefined)
      if (rolloutRules.length) {
        const pct = Number(rolloutRules[rolloutRules.length-1].rollout || 0)
        const hash = Math.abs(hashString(userId + '|' + fid)) % 100
        decided = hash < pct
      }
    }
    out[fid] = Boolean(decided)
  }
  cache.set(key, { ts: Date.now(), value: out })
  return out
}

function hashString(s: string): number {
  let h = 2166136261
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24) }
  return h >>> 0
}










