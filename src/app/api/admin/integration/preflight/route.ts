import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const checks: Array<{ name: string; ok: boolean }> = []
  const envs = ['SUPABASE_URL','SUPABASE_SERVICE_KEY']
  for (const k of envs) checks.push({ name: `env:${k}`, ok: Boolean(process.env[k]) })
  try { const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY); const { error } = await db.from('usage_events').select('id').limit(1); checks.push({ name: 'db:usage_events', ok: !error }) } catch { checks.push({ name: 'db:connect', ok: false }) }
  const ok = checks.every(c=>c.ok)
  return NextResponse.json({ ok, checks })
}












