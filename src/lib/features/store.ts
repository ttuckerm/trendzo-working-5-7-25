import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { FEATURE_SCHEMA_V1, computeSchemaHash } from '@/lib/features/schema'

async function ensureTables() {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const sql = `
  create table if not exists feature_store (
    id uuid default gen_random_uuid() primary key,
    video_id text,
    features jsonb,
    schema_version text,
    schema_hash text,
    quality jsonb,
    created_at timestamptz default now()
  );
  create table if not exists feature_schema_versions (
    version text primary key,
    dim int,
    fields jsonb,
    created_at timestamptz default now()
  );
  `
  try { await (db as any).rpc?.('exec_sql', { query: sql }) } catch {}
  // Upsert current schema metadata
  try { await db.from('feature_schema_versions').upsert({ version: FEATURE_SCHEMA_V1.version, dim: FEATURE_SCHEMA_V1.dim, fields: FEATURE_SCHEMA_V1.fields } as any) } catch {}
}

export async function writeFeatures(videoId: string, features: Record<string, any>, quality: any = null): Promise<void> {
  await ensureTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const schema_hash = computeSchemaHash(FEATURE_SCHEMA_V1)
  await db.from('feature_store').insert({ video_id: videoId, features, schema_version: FEATURE_SCHEMA_V1.version, schema_hash, quality } as any)
}

export async function readFeatures(videoId: string): Promise<any | null> {
  await ensureTables()
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('feature_store').select('*').eq('video_id', videoId).order('created_at', { ascending: false }).limit(1)
  return (data||[])[0] || null
}












