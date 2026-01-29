import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists docs_index(
      id bigserial primary key,
      slug text unique,
      title text,
      updated_at timestamptz default now()
    );
    create table if not exists tutorial_asset(
      id bigserial primary key,
      title text,
      url text,
      type text check (type in ('video','gif')),
      duration_s int
    );
  ` })
  const [docs, tutorials] = await Promise.all([
    supabase.from('docs_index').select('slug, title').order('updated_at', { ascending: false } as any),
    supabase.from('tutorial_asset').select('title, url, type, duration_s').order('id', { ascending: false } as any)
  ])
  return NextResponse.json({ items: docs.data || [], tutorials: tutorials.data || [] })
}



