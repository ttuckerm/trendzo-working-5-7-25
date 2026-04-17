import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ rows: [], error: 'Missing Supabase config' }, { status: 500 })
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } })

  const { data: briefs, error } = await db
    .from('content_briefs')
    .select('id, user_id, brief_content, vps_prediction, predicted_vps, actual_views, performance_delta, performance_measured_at')
    .eq('completion_status', 'published')
    .not('performance_measured_at', 'is', null)
    .order('performance_measured_at', { ascending: false })
    .limit(10)

  if (error) {
    return NextResponse.json({ rows: [], error: error.message }, { status: 500 })
  }

  const userIds = [...new Set((briefs || []).map((b: any) => b.user_id).filter(Boolean))]
  let nameMap: Record<string, string> = {}
  if (userIds.length > 0) {
    const { data: profiles } = await db
      .from('onboarding_profiles')
      .select('user_id, business_name')
      .in('user_id', userIds)
    ;(profiles || []).forEach((p: any) => {
      nameMap[p.user_id] = p.business_name || 'Unknown'
    })
  }

  const rows = (briefs || []).map((b: any) => ({
    id: b.id,
    creator: nameMap[b.user_id] || 'Unknown',
    title: b.brief_content?.title || b.brief_content?.campaign_name || 'Untitled Brief',
    vpsPrediction: b.vps_prediction ?? b.predicted_vps ?? null,
    actualViews: b.actual_views ?? null,
    delta: b.performance_delta ?? null,
    measuredAt: b.performance_measured_at,
  }))

  return NextResponse.json({ rows })
}
