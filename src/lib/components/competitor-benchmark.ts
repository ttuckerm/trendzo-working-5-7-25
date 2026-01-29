/**
 * Component 22: Competitor Benchmarking
 *
 * Provides competitive intelligence by comparing a video being predicted
 * against top performers (80+ DPS) in the same niche.
 *
 * Returns:
 * - competitiveScore (0-100): How this video compares to niche leaders
 * - missingElements: What top videos have that this lacks
 * - opportunities: Specific improvements based on niche leaders
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  { db: { schema: 'public' }, auth: { persistSession: false } }
);

export interface VideoContext {
  niche: string;
  goal?: string;
  accountSize?: string;
  predictedDps?: number;
  featureSnapshot?: {
    top_features?: Array<{
      name: string;
      value: number;
      importance: number;
    }>;
  };
}

export interface CompetitorBenchmarkResult {
  competitiveScore: number; // 0-100
  missingElements: string[];
  opportunities: string[];
  benchmarkStats: {
    topPerformerCount: number;
    avgTopPerformerDps: number;
    topPerformerDpsRange: [number, number];
    yourPredictedDps: number;
  };
}

/**
 * Normalize niche values to handle case inconsistencies
 */
function normalizeNiche(niche: string): string {
  return niche.toLowerCase().trim().replace(/\s+/g, '-');
}

/**
 * Analyze a video against top performers in the same niche
 */
export async function benchmarkAgainstCompetitors(
  videoContext: VideoContext
): Promise<CompetitorBenchmarkResult> {
  const { niche, goal, accountSize, predictedDps = 0, featureSnapshot } = videoContext;

  // Step 1: Query top performers (80+ DPS) in the same niche
  const normalizedNiche = normalizeNiche(niche);

  // Query creator_video_history for actual top performers
  const { data: topVideos, error: historyError } = await supabase
    .from('creator_video_history')
    .select('actual_dps, actual_views, actual_likes, actual_comments, actual_shares, actual_saves, duration_seconds')
    .gte('actual_dps', 80)
    .order('actual_dps', { ascending: false })
    .limit(50);

  // Also query prediction_events for videos in this niche
  const { data: predictedVideos, error: predError } = await supabase
    .from('prediction_events')
    .select(`
      predicted_dps,
      feature_snapshot,
      video_id,
      video_files!inner(niche, goal, account_size_band)
    `)
    .gte('predicted_dps', 80)
    .limit(50);

  // Filter predicted videos by normalized niche
  const nicheTopVideos = predictedVideos?.filter(v =>
    normalizeNiche(v.video_files.niche) === normalizedNiche
  ) || [];

  // Combine both data sources
  const allTopPerformers = [
    ...(topVideos || []).map(v => ({
      dps: v.actual_dps,
      source: 'actual' as const,
      features: null
    })),
    ...nicheTopVideos.map(v => ({
      dps: v.predicted_dps,
      source: 'predicted' as const,
      features: v.feature_snapshot
    }))
  ];

  if (allTopPerformers.length === 0) {
    // No benchmarks available in this niche
    return {
      competitiveScore: 50, // Neutral score
      missingElements: ['No competitor data available in this niche yet'],
      opportunities: ['Be the first to set the benchmark in this niche!'],
      benchmarkStats: {
        topPerformerCount: 0,
        avgTopPerformerDps: 0,
        topPerformerDpsRange: [0, 0],
        yourPredictedDps: predictedDps
      }
    };
  }

  // Step 2: Calculate benchmark statistics
  const dpsScores = allTopPerformers.map(v => v.dps);
  const avgDps = dpsScores.reduce((sum, dps) => sum + dps, 0) / dpsScores.length;
  const minDps = Math.min(...dpsScores);
  const maxDps = Math.max(...dpsScores);

  // Step 3: Calculate competitive score (0-100)
  // Score based on how close predicted DPS is to top performer average
  let competitiveScore = 0;
  if (predictedDps >= avgDps) {
    // Above average: scale from 70-100
    const ratio = Math.min(predictedDps / maxDps, 1);
    competitiveScore = 70 + (ratio * 30);
  } else {
    // Below average: scale from 0-70
    const ratio = predictedDps / avgDps;
    competitiveScore = ratio * 70;
  }
  competitiveScore = Math.round(competitiveScore);

  // Step 4: Analyze missing elements
  const missingElements: string[] = [];
  const opportunities: string[] = [];

  // Analyze feature patterns from top performers
  const topPerformerFeatures = allTopPerformers
    .filter(v => v.features?.top_features)
    .map(v => v.features!.top_features!);

  if (topPerformerFeatures.length > 0 && featureSnapshot?.top_features) {
    const yourFeatures = featureSnapshot.top_features;

    // Aggregate top performer feature statistics
    const featureStats = new Map<string, { values: number[], importance: number[] }>();

    topPerformerFeatures.forEach(features => {
      features.forEach(f => {
        if (!featureStats.has(f.name)) {
          featureStats.set(f.name, { values: [], importance: [] });
        }
        featureStats.get(f.name)!.values.push(f.value);
        featureStats.get(f.name)!.importance.push(f.importance);
      });
    });

    // Compare against your features
    const yourFeatureMap = new Map(yourFeatures.map(f => [f.name, f]));

    // Check critical features from top performers
    const criticalFeatures = Array.from(featureStats.entries())
      .sort((a, b) => {
        const avgImpA = a[1].importance.reduce((s, v) => s + v, 0) / a[1].importance.length;
        const avgImpB = b[1].importance.reduce((s, v) => s + v, 0) / b[1].importance.length;
        return avgImpB - avgImpA;
      })
      .slice(0, 10); // Top 10 most important features

    criticalFeatures.forEach(([featureName, stats]) => {
      const avgValue = stats.values.reduce((s, v) => s + v, 0) / stats.values.length;
      const yourFeature = yourFeatureMap.get(featureName);

      if (!yourFeature) {
        missingElements.push(`Missing feature analysis: ${featureName}`);
      } else {
        // Check if significantly below average
        const difference = ((yourFeature.value - avgValue) / avgValue) * 100;

        if (difference < -30) { // 30% or more below average
          missingElements.push(getFeatureInsight(featureName, yourFeature.value, avgValue, 'below'));
          opportunities.push(getFeatureOpportunity(featureName, avgValue));
        }
      }
    });
  }

  // Generic insights based on competitive score
  if (competitiveScore < 40) {
    opportunities.push('Focus on improving hook strength - top performers grab attention in first 3 seconds');
    opportunities.push('Increase emotional resonance - connect with viewer pain points or desires');
    opportunities.push('Optimize pacing - top videos maintain engagement throughout');
  } else if (competitiveScore < 70) {
    opportunities.push('Study top performer structures - analyze their narrative flow');
    opportunities.push('Enhance call-to-action clarity - guide viewers on next steps');
    opportunities.push('Test different formats - experiment with what works in this niche');
  } else {
    opportunities.push('You\'re competitive! Focus on consistency and slight refinements');
    opportunities.push('Consider testing new angles to differentiate from other top performers');
  }

  // If no specific missing elements found, add generic ones
  if (missingElements.length === 0) {
    missingElements.push('Feature analysis unavailable - upload video for detailed comparison');
  }

  return {
    competitiveScore,
    missingElements: missingElements.slice(0, 5), // Top 5 most important
    opportunities: opportunities.slice(0, 5), // Top 5 opportunities
    benchmarkStats: {
      topPerformerCount: allTopPerformers.length,
      avgTopPerformerDps: Math.round(avgDps * 100) / 100,
      topPerformerDpsRange: [Math.round(minDps * 100) / 100, Math.round(maxDps * 100) / 100],
      yourPredictedDps: Math.round(predictedDps * 100) / 100
    }
  };
}

/**
 * Generate human-readable insight for a feature comparison
 */
function getFeatureInsight(
  featureName: string,
  yourValue: number,
  avgValue: number,
  comparison: 'below' | 'above'
): string {
  const featureLabels: Record<string, string> = {
    'word_count': 'Script length',
    'flesch_kincaid_grade': 'Reading complexity',
    'second_person_count': 'Direct address ("you" usage)',
    'sentence_count': 'Sentence variety',
    'sentiment_polarity': 'Emotional tone',
    'first_person_singular_count': 'Personal storytelling ("I" usage)',
    'first_person_plural_count': 'Community building ("we" usage)',
    'sentence_case_ratio': 'Sentence capitalization',
    'second_person_ratio': 'Audience engagement ratio',
    'lexical_diversity': 'Vocabulary richness'
  };

  const label = featureLabels[featureName] || featureName;
  const diff = Math.abs(Math.round(((yourValue - avgValue) / avgValue) * 100));

  if (comparison === 'below') {
    return `${label} is ${diff}% lower than top performers (yours: ${Math.round(yourValue)}, avg: ${Math.round(avgValue)})`;
  } else {
    return `${label} is ${diff}% higher than top performers`;
  }
}

/**
 * Generate actionable opportunity for a feature
 */
function getFeatureOpportunity(featureName: string, targetValue: number): string {
  const opportunities: Record<string, string> = {
    'word_count': `Aim for ~${Math.round(targetValue)} words - top performers use this script length`,
    'second_person_count': `Increase "you" usage to ~${Math.round(targetValue)} times - connect directly with viewers`,
    'sentiment_polarity': 'Boost emotional resonance - use more passionate language',
    'first_person_singular_count': 'Add personal stories - "I" statements build authenticity',
    'lexical_diversity': 'Vary vocabulary - avoid repetitive language',
    'sentence_count': `Structure with ~${Math.round(targetValue)} sentences for better pacing`
  };

  return opportunities[featureName] || `Optimize ${featureName} to match top performer averages`;
}

/**
 * Export for use in Kai Orchestrator
 */
export default {
  benchmarkAgainstCompetitors
};
