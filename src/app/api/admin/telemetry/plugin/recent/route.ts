import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import { verifyAdminAuth } from '@/lib/utils/adminAuth'

export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth(req)
  if (!auth.success) return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, Number(searchParams.get('page') || 1))
  const pageSize = Math.min(200, Math.max(1, Number(searchParams.get('page_size') || 50)))
  const since = new Date(Date.now() - 24*3600*1000).toISOString()

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  // Count
  const { count } = await db
    .from('first_hour_telemetry')
    .select('video_id', { count: 'exact', head: true })
    .gte('created_at', since)
    .eq('source', 'extension')

  // Page
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error } = await db
    .from('first_hour_telemetry')
    .select('*')
    .gte('created_at', since)
    .eq('source','extension')
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    page,
    page_size: pageSize,
    total: count || 0,
    rows: data || []
  })
}


