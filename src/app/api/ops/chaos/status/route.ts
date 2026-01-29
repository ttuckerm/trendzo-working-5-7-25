import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(_req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('chaos_session').select('*').eq('active', true).order('started_at', { ascending: false }).limit(1)
  const row = data?.[0]
  return NextResponse.json({ active: Boolean(row), latency_ms: row?.latency_ms || 0 })
}










