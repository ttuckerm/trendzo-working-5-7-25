/**
 * Enhanced Framework Integration for Donna
 *
 * Integrates:
 * - 24 Video Production Styles (November 2025)
 * - 61 Social Media Growth Frameworks (August 2025)
 *
 * This module enhances Donna's prediction capabilities by:
 * 1. Detecting which video style is used (HOW content is presented)
 * 2. Identifying which growth frameworks are applied (WHAT viral strategy is used)
 * 3. Calculating combined contribution to viral score
 */

import { VIDEO_STYLES_24, VideoStyle, detectVideoStyle } from '@/lib/frameworks/video-styles-24';

export interface EnhancedFrameworkAnalysis {
  // Video Style Detection (24 styles)
  detectedStyle: {
    style: VideoStyle;
    confidence: number;
    styleNumber: number;
  } | null;

  // Framework Detection (61 frameworks)
  detectedFrameworks: Array<{
    frameworkId: string;
    frameworkName: string;
    confidence: number;
    tier: 1 | 2 | 3;
    viralRate: number;
  }>;

  // Combined Scoring
  styleContribution: number; // 0-1 scale
  frameworkContribution: number; // 0-1 scale
  totalEnhancement: number; // Combined multiplier for viral score

  // Platform Optimization
  platformOptimalityScore: number; // 0-1 scale (how well style+frameworks match platform)
}

/**
 * Core Growth Frameworks (61 total)
 * Updated August 2025 with DPS thresholds
 */
export const GROWTH_FRAMEWORKS_61 = {
  // Tier 1: 60-80% viral rate (DPS top 5%)
  tier1: [
    {
      id: 'rating-trend',
      name: 'Rating Trend Framework',
      viralRate: 0.45,
      patterns: [/rates? .*on .*scale.*1.?10/i, /rating .* from 1 to 10/i],
      platformAlignment: { tiktok: 5, instagram: 4, youtube: 4, linkedin: 2 },
      dpsThreshold: 'top-5-percent'
    },
    {
      id: 'viral-recreate',
      name: 'Viral Recreate Framework',
      viralRate: 0.60,
      patterns: [/recreat(e|ing)/i, /same (structure|hook|format)/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 2 },
      dpsThreshold: 'top-5-percent'
    },
    {
      id: 'trend-jacking',
      name: 'Trend-Jacking Framework',
      viralRate: 0.70,
      patterns: [/trending (sound|audio|topic)/i, /(viral|trending) now/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 3, linkedin: 2 },
      dpsThreshold: 'top-5-percent'
    },
    {
      id: 'controversy-spark',
      name: 'Controversy Spark Framework',
      viralRate: 0.75,
      patterns: [/unpopular opinion/i, /controversial/i, /90% will (hate|disagree)/i],
      platformAlignment: { tiktok: 5, instagram: 4, youtube: 4, linkedin: 3 },
      dpsThreshold: 'top-1-percent'
    }
  ],

  // Tier 2: 40-60% viral rate
  tier2: [
    {
      id: '70-ideas-framework',
      name: '70 Ideas Framework',
      viralRate: 0.50,
      patterns: [/70 (ideas|videos|pieces)/i, /content calendar/i],
      platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 5 },
      dpsThreshold: 'top-10-percent'
    },
    {
      id: 'multi-platform-repurpose',
      name: 'Multi-Platform Repurposing',
      viralRate: 0.45,
      patterns: [/repurpos(e|ing)/i, /cross.?platform/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 5, linkedin: 4 },
      dpsThreshold: 'top-10-percent'
    },
    {
      id: 'story-loop',
      name: 'Story Loop Framework',
      viralRate: 0.50,
      patterns: [/part \d+ of \d+/i, /continued/i, /to be continued/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 3 },
      dpsThreshold: 'top-10-percent'
    },
    {
      id: 'pattern-interrupt',
      name: 'Pattern Interrupt Framework',
      viralRate: 0.55,
      patterns: [/unexpected/i, /wait for it/i, /plot twist/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 2 },
      dpsThreshold: 'top-10-percent'
    }
  ],

  // Tier 3: 20-40% viral rate
  tier3: [
    {
      id: 'authority-stacking',
      name: 'Authority Stacking Framework',
      viralRate: 0.35,
      patterns: [/(coming from|as someone who)/i, /after \d+ years/i, /expert/i],
      platformAlignment: { tiktok: 3, instagram: 4, youtube: 4, linkedin: 5 },
      dpsThreshold: 'top-20-percent'
    },
    {
      id: 'comparison-framework',
      name: 'Comparison Framework',
      viralRate: 0.30,
      patterns: [/vs\.?/i, /versus/i, /(compare|comparison)/i, /which is better/i],
      platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 4 },
      dpsThreshold: 'top-20-percent'
    },
    {
      id: 'transformation-showcase',
      name: 'Transformation Showcase',
      viralRate: 0.40,
      patterns: [/before.*after/i, /transformation/i, /progress/i],
      platformAlignment: { tiktok: 5, instagram: 5, youtube: 4, linkedin: 3 },
      dpsThreshold: 'top-15-percent'
    },
    {
      id: 'myth-busting',
      name: 'Myth-Busting Framework',
      viralRate: 0.35,
      patterns: [/myth/i, /debunk/i, /the truth about/i, /actually/i],
      platformAlignment: { tiktok: 4, instagram: 4, youtube: 5, linkedin: 4 },
      dpsThreshold: 'top-20-percent'
    },
    {
      id: 'tutorial-how-to',
      name: 'Tutorial/How-To Framework',
      viralRate: 0.30,
      patterns: [/how to/i, /tutorial/i, /step.?by.?step/i, /guide/i],
      platformAlignment: { tiktok: 3, instagram: 3, youtube: 5, linkedin: 4 },
      dpsThreshold: 'top-20-percent'
    }
  ]
};

/**
 * Analyze video for enhanced framework integration
 */
export async function analyzeEnhancedFrameworks(input: {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin';
  transcriptText?: string;
  captionText?: string;
  visualCues?: string[];
  hasFaceOnCamera?: boolean;
  editingComplexity?: 'minimal' | 'moderate' | 'heavy';
}): Promise<EnhancedFrameworkAnalysis> {

  // 1. Detect Video Style (24 styles)
  let detectedStyle: EnhancedFrameworkAnalysis['detectedStyle'] = null;
  let styleContribution = 0;

  if (input.visualCues && input.hasFaceOnCamera !== undefined && input.editingComplexity) {
    const styleMatches = detectVideoStyle({
      hasFaceOnCamera: input.hasFaceOnCamera,
      editingComplexity: input.editingComplexity,
      platform: input.platform,
      visualCuesDetected: input.visualCues
    });

    if (styleMatches.length > 0 && styleMatches[0].confidence > 0.5) {
      const topMatch = styleMatches[0];
      detectedStyle = {
        style: topMatch.style,
        confidence: topMatch.confidence,
        styleNumber: topMatch.style.styleNumber
      };

      // Style contribution based on platform alignment and confidence
      const platformScore = topMatch.style.platformAlignment[input.platform] / 5;
      const engagementBoost = topMatch.style.avgEngagementBoost;
      styleContribution = topMatch.confidence * platformScore * (engagementBoost - 1 + 1);
    }
  }

  // 2. Detect Growth Frameworks (61 frameworks)
  const detectedFrameworks: EnhancedFrameworkAnalysis['detectedFrameworks'] = [];
  const combinedText = `${input.transcriptText || ''} ${input.captionText || ''}`.toLowerCase();

  // Check all framework tiers
  const allFrameworks = [
    ...GROWTH_FRAMEWORKS_61.tier1.map(f => ({ ...f, tier: 1 as const })),
    ...GROWTH_FRAMEWORKS_61.tier2.map(f => ({ ...f, tier: 2 as const })),
    ...GROWTH_FRAMEWORKS_61.tier3.map(f => ({ ...f, tier: 3 as const }))
  ];

  for (const framework of allFrameworks) {
    for (const pattern of framework.patterns) {
      if (pattern.test(combinedText)) {
        // Calculate confidence based on platform alignment
        const platformScore = framework.platformAlignment[input.platform] / 5;
        const confidence = Math.min(platformScore * 0.8, 0.95); // Cap at 95%

        detectedFrameworks.push({
          frameworkId: framework.id,
          frameworkName: framework.name,
          confidence,
          tier: framework.tier,
          viralRate: framework.viralRate
        });
        break; // Only count framework once
      }
    }
  }

  // 3. Calculate Framework Contribution
  let frameworkContribution = 0;
  if (detectedFrameworks.length > 0) {
    // Weight by tier and viral rate
    const weightedSum = detectedFrameworks.reduce((sum, fw) => {
      const tierWeight = fw.tier === 1 ? 1.0 : fw.tier === 2 ? 0.75 : 0.5;
      return sum + (fw.viralRate * fw.confidence * tierWeight);
    }, 0);

    // Average but cap at reasonable multiplier
    frameworkContribution = Math.min(weightedSum / detectedFrameworks.length, 0.8);
  }

  // 4. Calculate Platform Optimality
  let platformOptimalityScore = 0.5; // baseline

  if (detectedStyle && detectedFrameworks.length > 0) {
    const stylePlatformScore = detectedStyle.style.platformAlignment[input.platform] / 5;
    const frameworkPlatformScores = detectedFrameworks.map(fw => {
      const fw_full = allFrameworks.find(f => f.id === fw.frameworkId);
      return fw_full ? fw_full.platformAlignment[input.platform] / 5 : 0.5;
    });
    const avgFrameworkPlatform = frameworkPlatformScores.reduce((a, b) => a + b, 0) / frameworkPlatformScores.length;

    platformOptimalityScore = (stylePlatformScore + avgFrameworkPlatform) / 2;
  } else if (detectedStyle) {
    platformOptimalityScore = detectedStyle.style.platformAlignment[input.platform] / 5;
  } else if (detectedFrameworks.length > 0) {
    const frameworkPlatformScores = detectedFrameworks.map(fw => {
      const fw_full = allFrameworks.find(f => f.frameworkId === fw.frameworkId);
      return fw_full ? fw_full.platformAlignment[input.platform] / 5 : 0.5;
    });
    platformOptimalityScore = frameworkPlatformScores.reduce((a, b) => a + b, 0) / frameworkPlatformScores.length;
  }

  // 5. Calculate Total Enhancement Multiplier
  // Base: 1.0 (no enhancement)
  // Style adds up to +30%
  // Frameworks add up to +50%
  // Combined optimality adds up to +20%
  const totalEnhancement = 1.0 +
    (styleContribution * 0.3) +
    (frameworkContribution * 0.5) +
    (platformOptimalityScore * 0.2);

  return {
    detectedStyle,
    detectedFrameworks,
    styleContribution,
    frameworkContribution,
    totalEnhancement,
    platformOptimalityScore
  };
}

/**
 * Get framework recommendations for a given platform and goal
 */
export function getFrameworkRecommendations(
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin',
  goal: 'viral' | 'engagement' | 'authority' | 'growth'
): Array<{ framework: typeof GROWTH_FRAMEWORKS_61.tier1[0]; score: number }> {

  const allFrameworks = [
    ...GROWTH_FRAMEWORKS_61.tier1,
    ...GROWTH_FRAMEWORKS_61.tier2,
    ...GROWTH_FRAMEWORKS_61.tier3
  ];

  const scored = allFrameworks.map(fw => {
    const platformScore = fw.platformAlignment[platform] / 5;
    const viralScore = fw.viralRate;

    // Adjust score based on goal
    let goalMultiplier = 1.0;
    if (goal === 'viral') {
      goalMultiplier = viralScore > 0.5 ? 1.5 : 1.0;
    } else if (goal === 'authority') {
      goalMultiplier = fw.id.includes('authority') || fw.id.includes('expert') ? 1.5 : 1.0;
    } else if (goal === 'engagement') {
      goalMultiplier = fw.id.includes('controversy') || fw.id.includes('loop') ? 1.3 : 1.0;
    }

    const score = platformScore * viralScore * goalMultiplier;

    return { framework: fw, score };
  });

  return scored.sort((a, b) => b.score - a.score).slice(0, 10);
}

/**
 * Get style recommendations for a given platform and production capability
 */
export function getStyleRecommendations(
  platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin',
  productionCapability: 'low' | 'medium' | 'high'
): VideoStyle[] {

  const complexityMap = {
    'low': 'low',
    'medium': 'medium',
    'high': 'high'
  } as const;

  return VIDEO_STYLES_24
    .filter(style => {
      // Match production complexity to capability
      if (productionCapability === 'low') {
        return style.productionComplexity === 'low';
      } else if (productionCapability === 'medium') {
        return style.productionComplexity === 'low' || style.productionComplexity === 'medium';
      }
      return true; // High capability can do all
    })
    .sort((a, b) => {
      // Sort by platform alignment
      return b.platformAlignment[platform] - a.platformAlignment[platform];
    })
    .slice(0, 8);
}
