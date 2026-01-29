import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'
import { commonRateLimiters } from '@/lib/security/rate-limiter'

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const url = new URL(req.url)
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit')||'30')))
  const { data } = await db.from('daily_recipe_book').select('day,hot,cooling,new,created_at').order('day', { ascending: false }).limit(limit)
  return NextResponse.json({ rows: data||[] })
}


