import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function ensureFederatedTables(): Promise<void> {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists federated_rounds(
    round_id uuid primary key default gen_random_uuid(),
    model_name text,
    model_version text,
    status text check (status in ('open','aggregating','finalized','aborted')) default 'open',
    min_participants int default 5,
    clip_norm numeric default 1.0,
    dp_sigma numeric default 0,
    started_at timestamptz default now(),
    finalized_at timestamptz,
    artifact_url text,
    notes text
  );
  create table if not exists federated_updates(
    round_id uuid,
    client_id text,
    weights_delta jsonb,
    n_examples int,
    grad_norm numeric,
    received_at timestamptz default now(),
    accepted boolean default false,
    rejection_reason text,
    unique(round_id, client_id)
  );
  create table if not exists global_personalization_models(
    model_version text primary key,
    weights jsonb,
    created_at timestamptz default now(),
    baseline_version text,
    checksum text
  );
  alter table if exists creator_profiles add column if not exists personalization_model_version text;
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
}


