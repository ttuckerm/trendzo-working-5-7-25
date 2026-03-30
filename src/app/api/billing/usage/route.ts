import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function GET(req: NextRequest) {
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const apiKey = req.headers.get('x-api-key') || ''
  const since24h = new Date(Date.now() - 24*3600*1000).toISOString()
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const { data: d } = await db.from('usage_events').select('id').eq('api_key', apiKey).gte('ts', since24h)
  const { data: m } = await db.from('usage_events').select('id').eq('api_key', apiKey).gte('ts', monthStart)
  const res = NextResponse.json({ last_24h: (d||[]).length, month: (m||[]).length })
  res.headers.set('X-Usage-24h', String((d||[]).length))
  res.headers.set('X-Usage-Month', String((m||[]).length))
  res.headers.set('X-Quota-Remaining', 'unknown')
  return res
}


