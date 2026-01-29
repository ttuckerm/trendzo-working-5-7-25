import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

function formatBaselineVersion(d = new Date()): string {
  const oneJan = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d as any) - (oneJan as any)) / 86400000 + oneJan.getDay() + 1) / 7)
  return `${d.getFullYear()}W${String(week).padStart(2,'0')}`
}

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  try {
    await (db as any).rpc?.('exec_sql', { query: "create table if not exists baselines_state (id int primary key default 1, baseline_version text, baseline_last_run timestamptz);" })
    const version = formatBaselineVersion()
    await db.from('baselines_state').upsert({ id: 1, baseline_version: version, baseline_last_run: new Date().toISOString() } as any)
    return NextResponse.json({ ok: true, baseline_version: version })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'error' }, { status: 500 })
  }
}


