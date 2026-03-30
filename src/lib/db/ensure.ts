import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function supabaseAvailable(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_KEY)
}

export function getServerDb(): any | null {
  try {
    if (!supabaseAvailable()) return null
    return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  } catch {
    return null
  }
}

export async function ensureP1AccuracyTables(): Promise<void> {
  const db = getServerDb()
  if (!db) return
  const sql = `
    create extension if not exists pgcrypto;

    create table if not exists prediction_event (
      id uuid default gen_random_uuid() primary key,
      template_id text not null,
      variant_id text,
      cohort_snapshot jsonb,
      predicted_prob numeric,
      model_version text,
      created_at timestamptz default now()
    );

    create table if not exists post_publish_outcome (
      id uuid default gen_random_uuid() primary key,
      template_id text not null,
      variant_id text,
      platform text not null,
      views int not null,
      watch_time_pct numeric not null,
      retention_3s numeric not null,
      retention_8s numeric,
      ctr numeric,
      shares_per_1k numeric,
      saves_per_1k numeric,
      completion_rate numeric,
      captured_at timestamptz not null,
      window_hours int default 48
    );

    create table if not exists viral_label (
      id uuid default gen_random_uuid() primary key,
      template_id text not null,
      variant_id text,
      platform text not null,
      label boolean not null,
      percentile numeric not null,
      computed_at timestamptz not null,
      cohort_key text
    );

    create table if not exists calibration_snapshot (
      id uuid default gen_random_uuid() primary key,
      cohort_key text not null,
      model_version text,
      ece numeric not null,
      auc numeric not null,
      bins jsonb not null,
      created_at timestamptz default now()
    );

    create table if not exists ab_events (
      id uuid default gen_random_uuid() primary key,
      template_id text not null,
      variant_id text not null,
      event_type text not null,
      payload jsonb,
      ts timestamptz default now()
    );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}



