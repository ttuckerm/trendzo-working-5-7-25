import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'
import { requireRole } from '@/lib/auth/server-auth'

export const RangeSchema = z.enum(['1h','6h','24h','7d']).default('24h')

export type TimeRange = z.infer<typeof RangeSchema>

export function parseRange(req: NextRequest): TimeRange {
  const url = new URL(req.url)
  const r = url.searchParams.get('range') as TimeRange | null
  try { return RangeSchema.parse(r ?? undefined) } catch { return '24h' }
}

export function getWindow(range: TimeRange): { start: Date; end: Date; bucketSec: number } {
  const end = new Date()
  let start = new Date(end)
  let bucketSec = 60
  if (range === '1h') { start = new Date(end.getTime() - 1*3600*1000); bucketSec = 60 }
  else if (range === '6h') { start = new Date(end.getTime() - 6*3600*1000); bucketSec = 5*60 }
  else if (range === '24h') { start = new Date(end.getTime() - 24*3600*1000); bucketSec = 15*60 }
  else if (range === '7d') { start = new Date(end.getTime() - 7*24*3600*1000); bucketSec = 60*60 }
  return { start, end, bucketSec }
}

// Development fallbacks to keep local API working if env not set
const DEV_FALLBACK_URL = process.env.NEXT_PUBLIC_SUPABASE_URL_FALLBACK || 'https://vyeiyccrageckeehyhj.supabase.co'
const DEV_FALLBACK_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_FALLBACK || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5ZWl5Y2NyYWdlY2tlZWh5aGoiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcxNjI0NzUyMCwiZXhwIjoyMDMxODIzNTIwfQ.YNgDgRya_1fvWOmO6j59aSuPLt6QVe0AAoVZkJ0iJx0'

export function getAdminDb(): SupabaseClient {
  const url = SUPABASE_URL || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_URL : '')
  const key = (SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY) || (process.env.NODE_ENV !== 'production' ? DEV_FALLBACK_KEY : '')
  if (!url || !key) {
    // As a last resort, throw; callers should catch and render 503
    throw new Error('supabaseUrl is required.')
  }
  return createClient(url, key)
}

export async function guardAdmin(req: NextRequest): Promise<NextResponse | null> {
  return await requireRole(req, ['chairman', 'sub_admin'])
}

export function withCache(json: any, seconds = 5): NextResponse {
  const res = NextResponse.json(json)
  res.headers.set('Cache-Control', `public, max-age=${seconds}`)
  return res
}

export function toBuckets(start: Date, end: Date, bucketSec: number): { t: string }[] {
  const out: { t: string }[] = []
  for (let t = start.getTime(); t <= end.getTime(); t += bucketSec*1000) {
    out.push({ t: new Date(t).toISOString() })
  }
  return out
}

export function clamp<T>(v: T | null | undefined, d: T): T { return (v ?? d) }

export function parsePaging(req: NextRequest): { limit: number; offset: number } {
  const u = new URL(req.url)
  const limit = Math.min(200, Math.max(1, Number(u.searchParams.get('limit') || 50)))
  const offset = Math.max(0, Number(u.searchParams.get('offset') || 0))
  return { limit, offset }
}

export async function rateLimitAction(db: SupabaseClient, userId: string | null, action: string, windowSec = 60, maxPerWindow = 5): Promise<boolean> {
  try {
    const since = new Date(Date.now() - windowSec*1000).toISOString()
    const { data, error } = await db
      .from('pipeline_control_actions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .eq('action', action)
      .eq('user_id', userId)
    if (error) return true
    const used = (data as any)?.length || 0
    return used < maxPerWindow
  } catch { return true }
}


