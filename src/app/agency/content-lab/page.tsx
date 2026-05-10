import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId, getAgencyCreators } from '@/lib/auth/agency-utils';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import ContentLabGrid from './ContentLabGrid';
export const dynamic = 'force-dynamic';

export default async function ContentLabPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8888a0] text-sm">Please sign in.</p>
      </div>
    );
  }

  const agencyId = await getUserAgencyId(user.id);
  if (!agencyId) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#8888a0] text-sm">Agency not configured.</p>
      </div>
    );
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const creatorIds = await getAgencyCreators(agencyId);

  // Get profiles for profile IDs
  const profilesResult =
    creatorIds.length > 0
      ? await serviceClient
          .from('onboarding_profiles')
          .select('id, user_id, niche_key')
          .in('user_id', creatorIds)
      : { data: [] };

  const profiles = profilesResult.data || [];
  const agencyProfileIds = profiles.map((p: any) => p.id);
  const primaryNiche = profiles[0]?.niche_key || 'content';

  let concepts: { title: string; tags: string[]; vpsScore: number; gradientFrom: string; gradientTo: string }[] = [];

  // Try to get real concepts from generated_scripts
  if (agencyProfileIds.length > 0) {
    const { data: recentScripts } = await serviceClient
      .from('generated_scripts')
      .select('id, script_text, vps_score, onboarding_profile_id')
      .in('onboarding_profile_id', agencyProfileIds)
      .not('vps_score', 'is', null)
      .order('vps_score', { ascending: false })
      .limit(6);

    if (recentScripts && recentScripts.length > 0) {
      const gradients = [
        ['#f04a4d', '#f04a4d'],
        ['#00d4ff', '#f04a4d'],
        ['#f04a4d', '#f4b942'],
        ['#2dd4a8', '#00d4ff'],
        ['#f4b942', '#f04a4d'],
        ['#f04a4d', '#f04a4d'],
      ];

      concepts = recentScripts.map((s: any, i: number) => {
        const hookLine = s.script_text?.split('\n')[0]?.slice(0, 60) || 'Content Concept';
        const g = gradients[i % gradients.length];
        return {
          title: hookLine,
          tags: [primaryNiche.replace(/_/g, ' '), 'AI Generated'],
          vpsScore: Math.round(s.vps_score),
          gradientFrom: g[0],
          gradientTo: g[1],
        };
      });
    }
  }

  // Placeholder if no real data
  if (concepts.length === 0) {
    concepts = [
      { title: '"Wait for it..." — Satisfying Reveal Format', tags: [primaryNiche, 'trending'], vpsScore: 89, gradientFrom: '#f04a4d', gradientTo: '#f04a4d' },
      { title: 'POV: You just discovered this hack', tags: [primaryNiche, 'hook'], vpsScore: 82, gradientFrom: '#00d4ff', gradientTo: '#f04a4d' },
      { title: 'Day in the life of a [niche] creator', tags: [primaryNiche, 'vlog'], vpsScore: 76, gradientFrom: '#f04a4d', gradientTo: '#f4b942' },
      { title: 'Before vs After: Quick transformation', tags: [primaryNiche, 'transition'], vpsScore: 71, gradientFrom: '#2dd4a8', gradientTo: '#00d4ff' },
      { title: '3 things I wish I knew about [topic]', tags: [primaryNiche, 'educational'], vpsScore: 68, gradientFrom: '#f4b942', gradientTo: '#f04a4d' },
      { title: 'Reacting to my first ever video', tags: [primaryNiche, 'nostalgia'], vpsScore: 64, gradientFrom: '#f04a4d', gradientTo: '#f04a4d' },
    ];
  }

  return <ContentLabGrid concepts={concepts} />;
}
