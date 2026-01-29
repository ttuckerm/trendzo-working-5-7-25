import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists release_note(
      id bigserial primary key,
      version text,
      channel text,
      notes_md text,
      created_at timestamptz default now()
    );
    create table if not exists post_release_action(
      id bigserial primary key,
      release_id bigint references release_note(id),
      owner text,
      due_at timestamptz,
      done boolean default false
    );
  ` })
  const { data } = await supabase.from('release_note').select('*').order('created_at', { ascending: false } as any).limit(1)
  if (!data || !data[0]) return NextResponse.json({ error: 'none' }, { status: 404 })
  const note = data[0]
  const actions = await supabase.from('post_release_action').select('*').eq('release_id', note.id)
  return NextResponse.json({ note, actions: actions.data || [] })
}



