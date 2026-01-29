import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

export async function GET(_req: NextRequest) {
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString()
  const { data } = await db.from('synthetic_probe').select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(10)
  const last = (data && data[0]) || null
  const last_heartbeat_minutes_ago = last ? Math.round((Date.now() - new Date(last.created_at as any).getTime())/60000) : 999
  return NextResponse.json({ results: data || [], last_heartbeat_minutes_ago })
}


