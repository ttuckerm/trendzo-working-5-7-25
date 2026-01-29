import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const since = new Date(Date.now() - 24*3600*1000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: d1 } = await db.from('usage_events').select('result').gte('ts', since).limit(100000)
  const { data: d2 } = await db.from('usage_events').select('result').gte('ts', monthStart).limit(100000)
  const last24h = { requests: (d1||[]).length, quota_hits: (d1||[]).filter((r:any)=> r.result==='blocked').length }
  const mtd = { requests: (d2||[]).length, quota_hits: (d2||[]).filter((r:any)=> r.result==='blocked').length }
  return NextResponse.json({ ok: true, last24h, monthToDate: mtd })
}







