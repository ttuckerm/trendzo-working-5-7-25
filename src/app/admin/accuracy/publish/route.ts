import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try { await (db as any).rpc?.('exec_sql', { query: "create table if not exists feature_flags (key text primary key, enabled boolean not null default false, updated_at timestamptz default now());" }) } catch {}
  const { enabled } = await req.json().catch(()=>({ enabled:false })) as any
  try { await db.from('feature_flags').upsert({ key:'accuracy_public', enabled: !!enabled, updated_at: new Date().toISOString() } as any) } catch {}
  return NextResponse.json({ ok:true, accuracy_public_enabled: !!enabled })
}


