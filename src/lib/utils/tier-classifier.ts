/**
 * TIER-BASED VIRAL CLASSIFICATION SYSTEM
 * 
 * Classifies viral potential into tiers based on DPS (Dynamic Performance Score)
 * Replaces exact score predictions with tier-based classification for improved accuracy
 */

// ============================================================================
// Tier Definitions
// ============================================================================

export type ViralTier = 'mega_viral' | 'hyper_viral' | 'viral' | 'strong' | 'average';

export interface TierDefinition {
  tier: ViralTier;
  label: string;
  dpsMin: number;
  dpsMax: number;
  percentileRange: string;
  description: string;
  color: string; // For UI display
}

export const TIER_DEFINITIONS: Record<ViralTier, TierDefinition> = {
  mega_viral: {
    tier: 'mega_viral',
    label: 'Mega Viral',
    dpsMin: 90,
    dpsMax: 100,
    percentileRange: 'Top 0.1%',
    description: 'Exceptional viral potential - extremely rare',
    color: '#FF0080', // Hot pink
  },
  hyper_viral: {
    tier: 'hyper_viral',
    label: 'Hyper Viral',
    dpsMin: 80,
    dpsMax: 89,
    percentileRange: 'Top 1%',
    description: 'Very high viral potential - rare',
    color: '#FF4500', // Orange-red
  },
  viral: {
    tier: 'viral',
    label: 'Viral',
    dpsMin: 70,
    dpsMax: 79,
    percentileRange: 'Top 5%',
    description: 'Strong viral potential - good odds',
    color: '#FFD700', // Gold
  },
  strong: {
    tier: 'strong',
    label: 'Strong',
    dpsMin: 60,
    dpsMax: 69,
    percentileRange: 'Top 10%',
    description: 'Solid performance expected',
    color: '#32CD32', // Lime green
  },
  average: {
    tier: 'average',
    label: 'Average',
    dpsMin: 0,
    dpsMax: 59,
    percentileRange: 'Below Top 10%',
    description: 'Standard performance expected',
    color: '#808080', // Gray
  },
};

// ============================================================================
// Tier Classification
// ============================================================================

/**
 * Classify DPS score into a viral tier
 */
export function classifyDPSToTier(dps: number): ViralTier {
  if (dps >= 90) return 'mega_viral';
  if (dps >= 80) return 'hyper_viral';
  if (dps >= 70) return 'viral';
  if (dps >= 60) return 'strong';
  return 'average';
}

/**
 * Get tier definition for a given DPS score
 */
export function getTierDefinition(dps: number): TierDefinition {
  const tier = classifyDPSToTier(dps);
  return TIER_DEFINITIONS[tier];
}

// ============================================================================
// Tier Probabilities
// ============================================================================

export interface TierProbabilities {
  mega_viral: number;
  hyper_viral: number;
  viral: number;
  strong: number;
  average: number;
}

/**
 * Calculate tier probabilities based on pattern match strength and LLM confidence
 * 
 * Logic:
 * - Strong pattern match (8-9 Legos) → viral or hyper_viral tier
 * - Medium match (6-7 Legos) → strong tier  
 * - Weak match (4-5 Legos) → average tier
 * - LLM consensus adjusts the probability distribution within tiers
 */
export function calculateTierProbabilities(
  patternMatchScore: number,  // 0-100
  llmConsensusScore: number,  // 0-100
  patternLegoMatchCount: number // How many of 9 Legos matched
): TierProbabilities {
  // Initialize probabilities
  const probs: TierProbabilities = {
    mega_viral: 0,
    hyper_viral: 0,
    viral: 0,
    strong: 0,
    average: 0,
  };

  // Calculate base DPS to determine primary tier
  const baseDPS = (patternMatchScore * 0.4) + (llmConsensusScore * 0.6);
  const primaryTier = classifyDPSToTier(baseDPS);

  // Calculate confidence factor from pattern match count
  // 9 Legos = 1.0 confidence, 7 Legos = 0.78, 5 Legos = 0.56, etc.
  const confidenceFactor = Math.min(patternLegoMatchCount / 9, 1.0);

  // Calculate LLM consensus strength (how confident the LLMs are)
  const llmStrength = llmConsensusScore / 100;

  // Distribute probability based on pattern match strength
  if (patternLegoMatchCount >= 8) {
    // Strong match → viral or hyper_viral tier
    if (baseDPS >= 85) {
      probs.mega_viral = 0.05 * confidenceFactor;
      probs.hyper_viral = 0.30 * confidenceFactor;
      probs.viral = 0.50 * confidenceFactor;
      probs.strong = 0.12 * (1 - confidenceFactor);
      probs.average = 0.03 * (1 - confidenceFactor);
    } else if (baseDPS >= 75) {
      probs.hyper_viral = 0.18 * confidenceFactor;
      probs.viral = 0.64 * confidenceFactor;
      probs.strong = 0.15 * (1 - confidenceFactor);
      probs.average = 0.03 * (1 - confidenceFactor);
    } else {
      probs.viral = 0.50 * confidenceFactor;
      probs.strong = 0.35 * confidenceFactor;
      probs.average = 0.15 * (1 - confidenceFactor);
    }
  } else if (patternLegoMatchCount >= 6) {
    // Medium match → strong tier
    if (baseDPS >= 70) {
      probs.viral = 0.25 * confidenceFactor;
      probs.strong = 0.60 * confidenceFactor;
      probs.average = 0.15 * (1 - confidenceFactor);
    } else {
      probs.strong = 0.70 * confidenceFactor;
      probs.average = 0.30 * (1 - confidenceFactor);
    }
  } else {
    // Weak match → average tier
    if (baseDPS >= 65) {
      probs.strong = 0.30 * confidenceFactor;
      probs.average = 0.70 * (1 - confidenceFactor);
    } else {
      probs.average = 0.85;
      probs.strong = 0.15 * confidenceFactor;
    }
  }

  // Normalize to ensure probabilities sum to 1.0
  const total = Object.values(probs).reduce((sum, p) => sum + p, 0);
  if (total > 0) {
    Object.keys(probs).forEach(key => {
      probs[key as keyof TierProbabilities] /= total;
    });
  }

  // Round to 2 decimal places
  Object.keys(probs).forEach(key => {
    probs[key as keyof TierProbabilities] = Math.round(probs[key as keyof TierProbabilities] * 100) / 100;
  });

  return probs;
}

/**
 * Get the most likely tier from tier probabilities
 */
export function getMostLikelyTier(probabilities: TierProbabilities): ViralTier {
  let maxProb = 0;
  let mostLikely: ViralTier = 'average';

  Object.entries(probabilities).forEach(([tier, prob]) => {
    if (prob > maxProb) {
      maxProb = prob;
      mostLikely = tier as ViralTier;
    }
  });

  return mostLikely;
}

/**
 * Get confidence in the predicted tier (highest probability)
 */
export function getTierConfidence(probabilities: TierProbabilities): number {
  return Math.max(...Object.values(probabilities));
}

// ============================================================================
// Tier Reasoning
// ============================================================================

/**
 * Generate human-readable reasoning for tier prediction
 */
export function generateTierReasoning(
  predictedTier: ViralTier,
  patternLegoMatchCount: number,
  totalLegos: number,
  topFramework?: string
): string {
  const matchStrength = patternLegoMatchCount >= 8 ? 'Strong' : 
                       patternLegoMatchCount >= 6 ? 'Medium' : 'Weak';
  
  const tierDef = TIER_DEFINITIONS[predictedTier];
  
  let reasoning = `${matchStrength} pattern match (${patternLegoMatchCount}/${totalLegos} Legos)`;
  
  if (topFramework) {
    reasoning += `, matches ${topFramework}`;
  }
  
  reasoning += `. Predicted ${tierDef.percentileRange} performance.`;
  
  return reasoning;
}

// ============================================================================
// Tier Comparison
// ============================================================================

/**
 * Compare predicted tier to actual tier for accuracy tracking
 */
export function compareTiers(predicted: ViralTier, actual: ViralTier): {
  exact: boolean;
  close: boolean; // Within one tier
  difference: number; // Tier difference (0 = exact, 1 = one tier off, etc.)
} {
  const tierOrder: ViralTier[] = ['average', 'strong', 'viral', 'hyper_viral', 'mega_viral'];
  const predictedIndex = tierOrder.indexOf(predicted);
  const actualIndex = tierOrder.indexOf(actual);
  const difference = Math.abs(predictedIndex - actualIndex);

  return {
    exact: predicted === actual,
    close: difference <= 1,
    difference,
  };
}

/**
 * Calculate tier prediction accuracy percentage
 */
export function calculateTierAccuracy(
  predictions: Array<{ predicted: ViralTier; actual: ViralTier }>
): {
  exactAccuracy: number;      // Percentage of exact tier matches
  closeAccuracy: number;       // Percentage within one tier
  avgDifference: number;       // Average tier difference
} {
  if (predictions.length === 0) {
    return { exactAccuracy: 0, closeAccuracy: 0, avgDifference: 0 };
  }

  let exactMatches = 0;
  let closeMatches = 0;
  let totalDifference = 0;

  predictions.forEach(({ predicted, actual }) => {
    const comparison = compareTiers(predicted, actual);
    if (comparison.exact) exactMatches++;
    if (comparison.close) closeMatches++;
    totalDifference += comparison.difference;
  });

  return {
    exactAccuracy: Math.round((exactMatches / predictions.length) * 100),
    closeAccuracy: Math.round((closeMatches / predictions.length) * 100),
    avgDifference: Math.round((totalDifference / predictions.length) * 100) / 100,
  };
}










