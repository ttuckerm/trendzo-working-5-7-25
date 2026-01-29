import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function GET(_req: NextRequest) {
  const supabase = getDb()
  await (supabase as any).rpc?.('exec_sql', { query: `
    create table if not exists automation_queue(
      id bigserial primary key,
      kind text,
      payload jsonb,
      status text default 'queued',
      created_at timestamptz default now()
    );
  ` })
  const { data } = await supabase.from('automation_queue').select('id').limit(1)
  return NextResponse.json({ queued: (data?.length || 0) > 0 })
}



