import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-guard'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET() {
  const auth = await requireAuth('use_agent_cards')
  if (auth.error) return auth.error

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const agencyId = auth.profile?.agency_id as string | undefined
  const role = auth.profile?.role as string

  let query = supabase
    .from('agent_cards')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (role !== 'chairman' && agencyId) {
    query = query.eq('agency_id', agencyId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[cards] List error:', error)
    return NextResponse.json({ error: 'Failed to fetch cards' }, { status: 500 })
  }

  return NextResponse.json({ cards: data || [] })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth('use_agent_cards')
  if (auth.error) return auth.error

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const body = await req.json()

  const {
    creator_name,
    creator_handle,
    creator_avatar_url,
    creator_niche,
    vps_score,
    dps_score,
    follower_count,
    trend_direction,
    niche_rank,
    agency_name,
    agency_logo_url,
    agent_system_prompt,
    creator_id,
  } = body as Record<string, unknown>

  if (!creator_name || typeof creator_name !== 'string') {
    return NextResponse.json({ error: 'creator_name is required' }, { status: 400 })
  }
  if (!creator_niche || typeof creator_niche !== 'string') {
    return NextResponse.json({ error: 'creator_niche is required' }, { status: 400 })
  }

  const agencyId = auth.profile?.agency_id as string | undefined
  const resolvedAgencyName = (agency_name as string) || (auth.profile?.agency_name as string) || 'Agency'

  if (!agencyId) {
    return NextResponse.json({ error: 'No agency associated with your profile' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('agent_cards')
    .insert({
      agency_id: agencyId,
      creator_id: creator_id || null,
      creator_name,
      creator_handle: creator_handle || null,
      creator_avatar_url: creator_avatar_url || null,
      creator_niche,
      vps_score: vps_score ?? null,
      dps_score: dps_score ?? null,
      follower_count: follower_count ?? null,
      trend_direction: trend_direction || null,
      niche_rank: niche_rank ?? null,
      agency_name: resolvedAgencyName,
      agency_logo_url: agency_logo_url || null,
      agent_system_prompt: agent_system_prompt || null,
    })
    .select('id, share_id')
    .single()

  if (error) {
    console.error('[cards] Create error:', error)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }

  return NextResponse.json({ card: data }, { status: 201 })
}
