import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

export async function POST(_req: NextRequest) {
  const sheetUrl = process.env.GSHEET_LEADERBOARD_URL || ''
  if (!sheetUrl) return NextResponse.json({ error: 'not_configured' }, { status: 400 })
  // Minimal mock: return last 3 leaderboard rows that would be appended
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('template_metric_snapshot').select('template_id,title,metric,metric_value,rank').order('rank').limit(3)
  return NextResponse.json({ would_append: data || [] })
}


