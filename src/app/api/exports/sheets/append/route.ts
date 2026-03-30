import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export async function POST(_req: NextRequest) {
  const sheetUrl = process.env.GSHEET_LEADERBOARD_URL || ''
  if (!sheetUrl) return NextResponse.json({ error: 'not_configured' }, { status: 400 })
  // Minimal mock: return last 3 leaderboard rows that would be appended
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const { data } = await db.from('template_metric_snapshot').select('template_id,title,metric,metric_value,rank').order('rank').limit(3)
  return NextResponse.json({ would_append: data || [] })
}


