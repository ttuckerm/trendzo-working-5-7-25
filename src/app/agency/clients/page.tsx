import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId, getAgencyCreators } from '@/lib/auth/agency-utils';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import ClientsGrid from './ClientsGrid';

export default async function ClientsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#7a7889] text-sm">Please sign in to view clients.</p>
      </div>
    );
  }

  const agencyId = await getUserAgencyId(user.id);
  if (!agencyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#7a7889] text-sm">Agency not configured.</p>
      </div>
    );
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const creatorIds = await getAgencyCreators(agencyId);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const profilesResult =
    creatorIds.length > 0
      ? await serviceClient
          .from('onboarding_profiles')
          .select('id, user_id, business_name, niche_key')
          .in('user_id', creatorIds)
      : { data: [] };

  const profiles = profilesResult.data || [];
  const profileByUserId = new Map(profiles.map((p: any) => [p.user_id, p]));
  const profileIdToUserId = new Map(profiles.map((p: any) => [p.id, p.user_id]));
  const agencyProfileIds = profiles.map((p: any) => p.id);

  const scriptsResult =
    agencyProfileIds.length > 0
      ? await serviceClient
          .from('generated_scripts')
          .select('id, onboarding_profile_id, vps_score, created_at')
          .in('onboarding_profile_id', agencyProfileIds)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false })
      : { data: [] };

  const agencyScripts = scriptsResult.data || [];

  // Per-creator stats
  const creatorScripts = new Map<string, any[]>();
  for (const script of agencyScripts) {
    const userId = profileIdToUserId.get(script.onboarding_profile_id);
    if (!userId) continue;
    if (!creatorScripts.has(userId)) creatorScripts.set(userId, []);
    creatorScripts.get(userId)!.push(script);
  }

  const clients = creatorIds.map((uid) => {
    const profile = profileByUserId.get(uid);
    const scripts = creatorScripts.get(uid) || [];
    const vpsScores = scripts
      .map((s: any) => s.vps_score)
      .filter((v: any) => v !== null && v !== undefined);
    const lastVPS = vpsScores.length > 0 ? vpsScores[0] : null;
    const latestScript = scripts[0];
    const daysSinceActive = latestScript
      ? Math.floor((Date.now() - new Date(latestScript.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    return {
      userId: uid,
      name: profile?.business_name || 'Unknown Creator',
      niche: profile?.niche_key || null,
      lastVPS,
      status: (daysSinceActive <= 3 ? 'active' : daysSinceActive <= 7 ? 'warning' : 'inactive') as 'active' | 'warning' | 'inactive',
      videoCount: scripts.length,
    };
  });

  // Sort: active first, then by VPS
  clients.sort((a, b) => {
    const statusOrder = { active: 0, warning: 1, inactive: 2 };
    if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
    return (b.lastVPS ?? -1) - (a.lastVPS ?? -1);
  });

  return <ClientsGrid clients={clients} />;
}
