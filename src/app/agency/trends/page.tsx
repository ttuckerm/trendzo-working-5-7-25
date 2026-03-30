import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getUserAgencyId } from '@/lib/auth/agency-utils';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';
import TrendRadar from './TrendRadar';

export default async function TrendsPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-[#7a7889] text-sm">Please sign in.</p>
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

  // Try to get real trend data from scraped_videos (highest DPS = trending patterns)
  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let trends: { name: string; velocity: number; score: number }[] = [];

  try {
    const { data: trendingVideos } = await serviceClient
      .from('scraped_videos')
      .select('title, niche_key, dps_score')
      .not('dps_score', 'is', null)
      .order('dps_score', { ascending: false })
      .limit(20);

    if (trendingVideos && trendingVideos.length > 0) {
      // Extract trend patterns from video titles/niches
      const nicheGroups = new Map<string, { count: number; avgDps: number; titles: string[] }>();
      for (const v of trendingVideos) {
        const key = v.niche_key || 'general';
        const group = nicheGroups.get(key) || { count: 0, avgDps: 0, titles: [] };
        group.count++;
        group.avgDps = (group.avgDps * (group.count - 1) + (v.dps_score || 0)) / group.count;
        group.titles.push(v.title || '');
        nicheGroups.set(key, group);
      }

      trends = Array.from(nicheGroups.entries())
        .map(([niche, data]) => ({
          name: `${niche.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} Content`,
          velocity: Math.round(data.count * 12 + Math.random() * 20),
          score: Math.min(99, Math.round(data.avgDps)),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 8);
    }
  } catch {
    // Fall through to placeholder data
  }

  // Placeholder data if no real trends
  if (trends.length === 0) {
    trends = [
      { name: 'Day-in-the-Life Vlogs', velocity: 34, score: 94 },
      { name: 'Quick Recipe Transitions', velocity: 28, score: 87 },
      { name: 'POV Storytelling', velocity: 22, score: 82 },
      { name: 'Before/After Reveals', velocity: 19, score: 76 },
      { name: 'Duet Challenges', velocity: 15, score: 71 },
      { name: 'ASMR Unboxing', velocity: 12, score: 65 },
      { name: 'Behind the Scenes', velocity: 10, score: 58 },
      { name: 'Tutorial Shorts', velocity: 8, score: 52 },
    ];
  }

  return <TrendRadar trends={trends} />;
}
