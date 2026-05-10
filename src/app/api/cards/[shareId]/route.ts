import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/auth/api-guard'
export const dynamic = 'force-dynamic';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const { shareId } = await params

  if (!/^[0-9a-f]{16}$/i.test(shareId)) {
    return NextResponse.json({ error: 'Invalid share ID' }, { status: 400 })
  }

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const { data, error } = await supabase
    .from('agent_cards')
    .select(
      'id, share_id, creator_name, creator_handle, creator_avatar_url, creator_niche, vps_score, dps_score, follower_count, trend_direction, niche_rank, agency_name, agency_logo_url, agent_enabled, is_active'
    )
    .eq('share_id', shareId)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Card not found' }, { status: 404 })
  }

  return NextResponse.json({ card: data })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ shareId: string }> }
) {
  const auth = await requireAuth('use_agent_cards')
  if (auth.error) return auth.error

  const { shareId } = await params
  const body = await req.json()

  const supabase = getServiceSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 })
  }

  const allowedFields: Record<string, unknown> = {}
  if ('is_active' in body) allowedFields.is_active = !!body.is_active
  if ('agent_enabled' in body) allowedFields.agent_enabled = !!body.agent_enabled
  if ('agent_system_prompt' in body) allowedFields.agent_system_prompt = body.agent_system_prompt || null

  if (Object.keys(allowedFields).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  allowedFields.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('agent_cards')
    .update(allowedFields)
    .eq('share_id', shareId)
    .select('id, share_id, is_active, agent_enabled, agent_system_prompt')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Card not found or update failed' }, { status: 404 })
  }

  return NextResponse.json({ card: data })
}
