import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getUserAgencyId } from '@/lib/auth/agency-utils'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'
import CardsManager from './CardsManager'
export const dynamic = 'force-dynamic';

export default async function AgencyCardsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#7a7889] text-sm">Please sign in to manage cards.</p>
      </div>
    )
  }

  const agencyId = await getUserAgencyId(user.id)
  if (!agencyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#7a7889] text-sm">Agency not configured.</p>
      </div>
    )
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data: cards } = await serviceClient
    .from('agent_cards')
    .select('id, share_id, creator_name, creator_handle, creator_niche, vps_score, follower_count, trend_direction, agency_name, agent_enabled, agent_system_prompt, total_views, total_shares, total_agent_sessions, total_leads, is_active, created_at')
    .eq('agency_id', agencyId)
    .order('created_at', { ascending: false })

  return <CardsManager cards={cards || []} agencyId={agencyId} />
}
