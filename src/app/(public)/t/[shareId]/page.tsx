import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import TrendzoCard from '@/components/cards/TrendzoCard'

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

interface CardRow {
  id: string
  share_id: string
  agency_id: string
  creator_name: string
  creator_handle: string | null
  creator_avatar_url: string | null
  creator_niche: string
  vps_score: number | null
  dps_score: number | null
  follower_count: number | null
  trend_direction: string | null
  niche_rank: number | null
  agency_name: string
  agency_logo_url: string | null
  agent_enabled: boolean
  agent_system_prompt: string | null
  total_views: number
  total_shares: number
  is_active: boolean
}

async function getCard(shareId: string): Promise<CardRow | null> {
  const supabase = getServiceSupabase()
  if (!supabase) return null

  const { data, error } = await supabase
    .from('agent_cards')
    .select(
      'id, share_id, agency_id, creator_name, creator_handle, creator_avatar_url, creator_niche, vps_score, dps_score, follower_count, trend_direction, niche_rank, agency_name, agency_logo_url, agent_enabled, agent_system_prompt, total_views, total_shares, is_active'
    )
    .eq('share_id', shareId)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data as CardRow
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ shareId: string }>
}): Promise<Metadata> {
  const { shareId } = await params
  const card = await getCard(shareId)
  if (!card) return { title: 'Card Not Found' }

  return {
    title: `${card.creator_name} — ${card.creator_niche} Creator | ${card.agency_name}`,
    description: `View ${card.creator_name}'s creator card with VPS score and AI niche advisor.`,
    openGraph: {
      title: `${card.creator_name} — ${card.creator_niche} Creator`,
      description: `${card.creator_name} scores ${card.vps_score ?? '—'} VPS in ${card.creator_niche}`,
      type: 'profile',
    },
  }
}

export default async function AgentCardPage({
  params,
}: {
  params: Promise<{ shareId: string }>
}) {
  const { shareId } = await params

  if (!/^[0-9a-f]{16}$/i.test(shareId)) notFound()

  const card = await getCard(shareId)
  if (!card) notFound()

  // Fire-and-forget view increment
  const supabase = getServiceSupabase()
  if (supabase) {
    void supabase.rpc('increment_card_views', { card_share_id: shareId })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: '#08080d' }}
    >
      <TrendzoCard
        card={{
          id: card.id,
          shareId: card.share_id,
          creatorName: card.creator_name,
          creatorHandle: card.creator_handle,
          creatorAvatarUrl: card.creator_avatar_url,
          creatorNiche: card.creator_niche,
          vpsScore: card.vps_score,
          dpsScore: card.dps_score,
          followerCount: card.follower_count,
          trendDirection: card.trend_direction as 'up' | 'down' | 'stable' | null,
          nicheRank: card.niche_rank,
          agencyName: card.agency_name,
          agencyLogoUrl: card.agency_logo_url,
          agentEnabled: card.agent_enabled,
        }}
      />
    </div>
  )
}
