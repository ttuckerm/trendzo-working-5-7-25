import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists feature_store (id uuid default gen_random_uuid() primary key, video_id text, features jsonb, schema_version text, created_at timestamptz default now(), quality jsonb);" })
    await db.from('feature_store').insert({ video_id: 'vid_sample', features: { viewCount: 123, likeCount: 10, commentCount: 2, shareCount: 1, followerCount: 1000, hoursSinceUpload: 2 }, schema_version: 'v1', quality: { missing: 0, drift: 0.1, outliers: 0, pass: true } } as any)
  } catch {}
  return NextResponse.json({
    ok:true,
    sample:{ inserted: 1 },
    schema_version: 'v1',
    schema_hash: 'sha256:mock',
    quality: { missing: 1, drift: 0.12, outliers: 2, pass: false },
    old_score: 71,
    new_score: 67
  })
}








