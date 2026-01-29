import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { requireRole, UserRole } from '@/lib/security/auth-middleware'
import { commonRateLimiters } from '@/lib/security/rate-limiter'

function todayUTC(): string { const d=new Date(); return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString().slice(0,10) }

export async function GET(req: NextRequest) {
  const auth = await requireRole(UserRole.ADMIN)(req)
  if (auth.response) return auth.response
  const limited = await commonRateLimiters.admin(req)
  if (limited) return limited
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const day = todayUTC()
  const { data } = await db.from('daily_recipe_book').select('day,hot,cooling,new,created_at').eq('day', day).limit(1)
  return NextResponse.json((Array.isArray(data) && data[0]) ? data[0] : { day, hot: [], cooling: [], new: [] })
}
// duplicate handler removed