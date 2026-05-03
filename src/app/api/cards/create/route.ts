import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-guard'

// Phase 1.6: forced dynamic to prevent Vercel build-phase static generation OOM
export const dynamic = 'force-dynamic'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
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
    follower_count,
    trend_direction,
    niche_rank,
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
  if (!agencyId) {
    return NextResponse.json({ error: 'No agency associated with your profile' }, { status: 403 })
  }

  // Resolve agency name from profile or fallback
  const agencyName = (auth.profile?.agency_name as string) || 'Agency'

  // Validate trend_direction if provided
  if (trend_direction && !['up', 'down', 'stable'].includes(trend_direction as string)) {
    return NextResponse.json({ error: 'trend_direction must be up, down, or stable' }, { status: 400 })
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
      follower_count: follower_count ?? null,
      trend_direction: trend_direction || null,
      niche_rank: niche_rank ?? null,
      agency_name: agencyName,
      agent_system_prompt: agent_system_prompt || null,
    })
    .select('id, share_id, creator_name, creator_niche, created_at')
    .single()

  if (error) {
    console.error('[cards/create] Insert error:', error)
    return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const shareLink = `${baseUrl}/t/${data.share_id}`

  return NextResponse.json({
    card: { ...data, share_link: shareLink },
  }, { status: 201 })
}
