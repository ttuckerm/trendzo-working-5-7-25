import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import { getUserAgencyId, getAgencyCreators } from '@/lib/auth/agency-utils';
import AgencyClient from './AgencyClient';

export default async function AgencyPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let creators: Record<string, unknown>[] = [];
  let recentScripts: Record<string, unknown>[] = [];
  let totalScripts = 0;
  let totalBriefs = 0;
  let agencyId: string | null = null;
  let cardsSummary: {
    totalCards: number;
    totalViews: number;
    totalLeads: number;
    topCards: Array<{ share_id: string; creator_name: string; creator_niche: string; vps_score: number | null; total_views: number; total_leads: number }>;
  } = { totalCards: 0, totalViews: 0, totalLeads: 0, topCards: [] };

  if (user) {
    agencyId = await getUserAgencyId(user.id);

    if (agencyId) {
      const creatorIds = await getAgencyCreators(agencyId);
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const safeIds = creatorIds.length > 0 ? creatorIds : [''];

      // ALL independent queries in one parallel batch
      const [profilesResult, briefsResult, cardsResult] = await Promise.all([
        serviceClient.from('onboarding_profiles')
          .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
          .in('user_id', safeIds),
        serviceClient.from('content_briefs')
          .select('id, user_id, status')
          .in('user_id', safeIds),
        serviceClient.from('agent_cards')
          .select('share_id, creator_name, creator_niche, vps_score, total_views, total_leads, total_agent_sessions, is_active')
          .eq('agency_id', agencyId).eq('is_active', true)
          .order('total_views', { ascending: false }).limit(8),
      ]);

      const profiles = profilesResult.data || [];
      const briefs = briefsResult.data || [];
      const agencyCards = cardsResult.data || [];

      if (agencyCards.length > 0) {
        cardsSummary = {
          totalCards: agencyCards.length,
          totalViews: agencyCards.reduce((s: number, c: any) => s + (c.total_views || 0), 0),
          totalLeads: agencyCards.reduce((s: number, c: any) => s + (c.total_leads || 0), 0),
          topCards: agencyCards.slice(0, 4),
        };
      }

      // Scripts depend on profile IDs — second wave
      const profileIds = profiles.map(p => p.id);
      const { data: scriptsData } = await serviceClient
        .from('generated_scripts')
        .select('id, script_text, vps_score, status, created_at, onboarding_profile_id, niche_key, user_id')
        .in('onboarding_profile_id', profileIds.length > 0 ? profileIds : [''])
        .order('created_at', { ascending: false })
        .limit(50);

      const scripts = scriptsData || [];

      totalScripts = scripts.length;
      totalBriefs = briefs.length;

      creators = profiles.map(p => {
        const creatorScripts = scripts.filter(s => s.onboarding_profile_id === p.id);
        const vpsScores = creatorScripts.map(s => s.vps_score || 0).filter((v: number) => v > 0);
        const rawStatus = p.creator_stage || p.onboarding_step || '';
        const cardStatus = (rawStatus === 'complete' || rawStatus === 'completed') ? 'active'
          : (rawStatus === 'foundation' || rawStatus === 'onboarding' || rawStatus === 'migrated') ? 'onboarding'
          : rawStatus === '' ? 'inactive' : 'active';
        return {
          name: p.business_name || 'Unknown',
          userId: p.user_id,
          niche: p.selected_niche || p.niche_key || 'unknown',
          status: cardStatus,
          scriptCount: creatorScripts.length,
          latestVPS: vpsScores.length > 0 ? Math.max(...vpsScores) : 0,
          avgVPS: vpsScores.length > 0
            ? Math.round(vpsScores.reduce((a: number, b: number) => a + b, 0) / vpsScores.length)
            : 0,
          activeBriefs: briefs.filter(b => b.user_id === p.user_id).length,
        };
      });

      recentScripts = scripts.slice(0, 10).map(s => ({
        title: (s.script_text || '').slice(0, 80),
        vpsScore: s.vps_score,
        status: s.status,
        createdAt: s.created_at,
      }));
    }
  }

  const sortedCreators = [...creators].sort(
    (a, b) => ((b.latestVPS as number) || 0) - ((a.latestVPS as number) || 0)
  );

  const initialState = {
    agency: {
      totalCreators: creators.length,
      activeCreators: creators.filter(c => c.status !== 'inactive').length,
      averageVPS: creators.length > 0
        ? Math.round(creators.reduce((sum, c) => sum + ((c.latestVPS as number) || 0), 0) / creators.length)
        : 0,
      topPerformer: sortedCreators[0]?.name || 'N/A',
      totalScripts,
      totalBriefs,
      cardsShared: cardsSummary.totalCards,
      leadsFromCards: cardsSummary.totalLeads,
    },
    creators,
    recentScripts,
    cardsSummary,
  };

  return (
    <AgencyClient
      initialState={initialState}
      userId={user?.id ?? ''}
      agencyId={agencyId ?? ''}
    />
  );
}

