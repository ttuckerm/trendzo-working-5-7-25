import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

async function ensureTables(db: any) {
  const sql = `
    create table if not exists experiments (
      id uuid default gen_random_uuid() primary key,
      name text,
      status text,
      created_at timestamptz default now()
    );
    create table if not exists arms (
      id uuid default gen_random_uuid() primary key,
      experiment_id uuid references experiments(id),
      name text,
      prior_alpha double precision default 1,
      prior_beta double precision default 1
    );
    create table if not exists allocations (
      id uuid default gen_random_uuid() primary key,
      experiment_id uuid references experiments(id),
      arm_id uuid references arms(id),
      user_id text,
      ts timestamptz default now()
    );
    create table if not exists metrics (
      id uuid default gen_random_uuid() primary key,
      experiment_id uuid references experiments(id),
      arm_id uuid references arms(id),
      reward double precision,
      ts timestamptz default now()
    );
  `
  await (db as any).rpc?.('exec_sql', { query: sql })
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const body = await req.json().catch(()=>({})) as any
  await ensureTables(db)
  const { name, arms } = body
  if (!name || !Array.isArray(arms) || arms.length < 2) return NextResponse.json({ ok:false, error:'invalid_input' }, { status: 400 })
  const { data: ex } = await db.from('experiments').insert({ name, status: 'active' } as any).select('id').single()
  for (const a of arms) await db.from('arms').insert({ experiment_id: ex!.id, name: String(a) } as any)
  return NextResponse.json({ ok:true, experiment_id: ex!.id })
}


