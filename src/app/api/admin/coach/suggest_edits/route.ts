import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'

export async function POST(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const body = await req.json().catch(()=>({})) as any
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: `
      create table if not exists coach_suggestions (
        id uuid default gen_random_uuid() primary key,
        created_at timestamptz default now(),
        video_id text,
        platform text,
        suggestion jsonb,
        estimated_delta double precision
      );
    ` })
    // Simple heuristic: estimate delta from like/share improvements requested
    const estDelta = Number(((body?.targetShareRate || 0) - (body?.currentShareRate || 0)) * 0.5 + ((body?.targetLikeRate || 0) - (body?.currentLikeRate || 0)) * 0.3).toFixed(3)
    await db.from('coach_suggestions').insert({ video_id: body?.videoId || null, platform: body?.platform || null, suggestion: body || {}, estimated_delta: Number(estDelta) } as any)
    // Update status best-effort
    try {
      await (db as any).rpc?.('exec_sql', { query: "create table if not exists coach_status (id int primary key default 1, last_run timestamptz, suggestions_24h int);" })
      const since = new Date(Date.now()-24*3600*1000).toISOString()
      const { data } = await db.from('coach_suggestions').select('id').gte('created_at', since)
      await db.from('coach_status').upsert({ id:1, last_run: new Date().toISOString(), suggestions_24h: (data||[]).length } as any)
    } catch {}
    return NextResponse.json({ ok: true, estimated_delta: Number(estDelta) })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message||'error' }, { status: 500 })
  }
}


