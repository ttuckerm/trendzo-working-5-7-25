import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { createRateLimiter, RateLimitTiers } from '@/lib/security/rate-limiter'

const limiter = createRateLimiter({ ...RateLimitTiers.GLOBAL_MODERATE, keyPrefix: 'algo_weather' })

export async function GET(req: NextRequest) {
  const rate = await limiter(req)
  if (rate) return rate
  const { searchParams } = new URL(req.url)
  const niche = searchParams.get('niche') || 'general'
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db
    .from('trend_nowcast')
    .select('entity_id,niche,strength')
    .eq('niche', niche)
    .order('strength', { ascending: false })
    .limit(50)
  const sounds = (data||[]).filter((r:any)=> String(r.entity_id).startsWith('s')).slice(0,5).map((r:any)=>r.entity_id)
  const hashtags = (data||[]).filter((r:any)=> String(r.entity_id).startsWith('#')).slice(0,5).map((r:any)=>r.entity_id)
  const timing_index = Math.min(100, Math.round(((data||[]).reduce((a:number,r:any)=>a + Math.max(0,r.strength),0) / 5000) * 100))
  const narrative = timing_index > 70 ? 'Peaking' : timing_index > 40 ? 'Rising' : 'Fading'
  const res = NextResponse.json({ top_sounds: sounds, top_hashtags: hashtags, timing_index, narrative })
  res.headers.set('Cache-Control', 'public, max-age=120')
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  return res
}

export async function OPTIONS() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('Access-Control-Allow-Origin', '*')
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  res.headers.set('Cache-Control', 'public, max-age=120')
  return res
}


