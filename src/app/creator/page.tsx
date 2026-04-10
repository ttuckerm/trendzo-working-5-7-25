import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import CreatorHomeClient from './CreatorHomeClient';

export default async function CreatorHomePage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#08080d' }}>
        <p className="text-sm text-[#8888a0]">Please sign in.</p>
      </div>
    );
  }

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Fetch creator's onboarding profile (niche, name, stage)
  const { data: onboardingProfile } = await serviceClient
    .from('onboarding_profiles')
    .select('id, user_id, business_name, niche_key, selected_niche, creator_stage, onboarding_step')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fetch their scripts with VPS scores
  const profileId = onboardingProfile?.id;
  const { data: scripts } = profileId
    ? await serviceClient
        .from('generated_scripts')
        .select('id, script_text, vps_score, status, created_at, niche_key')
        .eq('onboarding_profile_id', profileId)
        .order('created_at', { ascending: false })
        .limit(20)
    : { data: [] };

  // Fetch briefs assigned to this creator
  const { data: briefs } = await serviceClient
    .from('content_briefs')
    .select('id, title, status, created_at, niche_key')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  // Fetch prediction runs for this creator
  const { data: predictions } = await serviceClient
    .from('prediction_runs')
    .select('id, predicted_dps_7d, predicted_tier_7d, confidence, status, completed_at')
    .eq('source', 'api')
    .order('completed_at', { ascending: false })
    .limit(10);

  const niche = onboardingProfile?.selected_niche || onboardingProfile?.niche_key || null;
  const creatorName = onboardingProfile?.business_name || user.email?.split('@')[0] || 'Creator';

  // Compute VPS stats
  const vpsScores = (scripts || [])
    .map((s: { vps_score: number | null }) => s.vps_score)
    .filter((v): v is number => v != null && v > 0);
  const latestVPS = vpsScores[0] || null;
  const avgVPS = vpsScores.length > 0
    ? Math.round(vpsScores.reduce((a: number, b: number) => a + b, 0) / vpsScores.length)
    : null;

  // Determine trend direction from last 3 scores
  let trendDirection: 'up' | 'down' | 'stable' = 'stable';
  if (vpsScores.length >= 2) {
    const recent = vpsScores.slice(0, 3);
    const avg = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
    const older = vpsScores.slice(3, 6);
    if (older.length > 0) {
      const olderAvg = older.reduce((a: number, b: number) => a + b, 0) / older.length;
      trendDirection = avg > olderAvg + 3 ? 'up' : avg < olderAvg - 3 ? 'down' : 'stable';
    }
  }

  return (
    <CreatorHomeClient
      creatorName={creatorName}
      niche={niche}
      latestVPS={latestVPS}
      avgVPS={avgVPS}
      trendDirection={trendDirection}
      totalScripts={(scripts || []).length}
      recentScripts={(scripts || []).slice(0, 5).map((s: { id: string; script_text: string | null; vps_score: number | null; status: string | null; created_at: string }) => ({
        id: s.id,
        title: (s.script_text || '').slice(0, 80),
        vpsScore: s.vps_score,
        status: s.status || 'draft',
        createdAt: s.created_at,
      }))}
      briefs={(briefs || []).map((b: { id: string; title: string | null; status: string | null; created_at: string }) => ({
        id: b.id,
        title: b.title || 'Untitled Brief',
        status: b.status || 'draft',
        createdAt: b.created_at,
      }))}
      predictionCount={(predictions || []).length}
    />
  );
}
