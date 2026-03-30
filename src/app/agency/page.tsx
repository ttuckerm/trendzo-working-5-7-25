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

  if (user) {
    const agencyId = await getUserAgencyId(user.id);

    if (agencyId) {
      const creatorIds = await getAgencyCreators(agencyId);
      const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

      // Step 1: Fetch profiles and briefs by user_id
      const [profilesResult, briefsResult] = await Promise.all([
        serviceClient
          .from('onboarding_profiles')
          .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
          .in('user_id', creatorIds.length > 0 ? creatorIds : ['']),
        serviceClient
          .from('content_briefs')
          .select('id, user_id, status')
          .in('user_id', creatorIds.length > 0 ? creatorIds : ['']),
      ]);

      const profiles = profilesResult.data || [];
      const briefs = briefsResult.data || [];

      // Step 2: Fetch scripts by profile IDs (onboarding_profile_id != user_id)
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
    },
    creators,
    recentScripts,
  };

  return <AgencyClient initialState={initialState} />;
}
