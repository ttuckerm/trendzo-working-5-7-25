/**
 * FEAT-007: Pattern Matching Service
 * Matches extracted Idea Legos against viral_patterns database
 * Calculates pattern match scores weighted by success rate and frequency
 */

import { createClient } from '@supabase/supabase-js';
import { IdeaLegos, PatternMatch, PatternMatchingResult } from '@/types/pre-content-prediction';

// ============================================================================
// Configuration
// ============================================================================

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// Pattern matching cache (5 minute TTL)
const patternCache = new Map<string, { patterns: any[]; timestamp: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// Pattern Fetching with Caching
// ============================================================================

/**
 * Fetch viral patterns from database with caching
 */
async function fetchViralPatterns(
  niche: string,
  platform: string,
  minSuccessRate: number = 0.8
): Promise<any[]> {
  const cacheKey = `${niche}:${platform}:${minSuccessRate}`;
  const cached = patternCache.get(cacheKey);

  // Check cache
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.patterns;
  }

  // Query database
  const { data, error } = await supabase
    .from('viral_patterns')
    .select('*')
    .eq('niche', niche)
    .gte('success_rate', minSuccessRate)
    .order('success_rate', { ascending: false });

  if (error) {
    console.error('Failed to fetch viral patterns:', error);
    throw new Error(`Database query failed: ${error.message}`);
  }

  const patterns = data || [];

  // Cache results
  patternCache.set(cacheKey, { patterns, timestamp: Date.now() });

  return patterns;
}

// ============================================================================
// Text Similarity Helpers
// ============================================================================

/**
 * Calculate Jaccard similarity between two text strings
 * Returns 0-1 score based on word overlap
 */
function calculateTextSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 0;

  return intersection.size / union.size;
}

/**
 * Calculate fuzzy match score for a Lego field against a pattern
 * Returns 0-100 score
 */
function calculateLegoPatternMatch(
  legoValue: string,
  patternDescription: string
): number {
  // Exact match
  if (legoValue.toLowerCase() === patternDescription.toLowerCase()) {
    return 100;
  }

  // Contains match (substring)
  if (legoValue.toLowerCase().includes(patternDescription.toLowerCase()) ||
      patternDescription.toLowerCase().includes(legoValue.toLowerCase())) {
    return 85;
  }

  // Jaccard similarity
  const similarity = calculateTextSimilarity(legoValue, patternDescription);
  return Math.round(similarity * 100);
}

// ============================================================================
// Pattern Matching Logic
// ============================================================================

/**
 * Match a single Lego type against viral patterns
 */
async function matchLegoType(
  legoType: keyof IdeaLegos,
  legoValue: string,
  patterns: any[]
): Promise<PatternMatch[]> {
  // Map Lego field names to pattern_type values
  const typeMapping: Record<keyof IdeaLegos, string> = {
    topic: 'topic',
    angle: 'angle',
    hookStructure: 'hook_structure',
    storyStructure: 'story_structure',
    visualFormat: 'visual_format',
    keyVisuals: 'key_visuals',
    audio: 'audio',
  };

  const patternType = typeMapping[legoType];

  // Filter patterns for this type
  const relevantPatterns = patterns.filter(p => p.pattern_type === patternType);

  // Calculate match score for each pattern
  const matches: PatternMatch[] = relevantPatterns.map(pattern => {
    const matchScore = calculateLegoPatternMatch(legoValue, pattern.pattern_description);

    return {
      type: patternType,
      description: pattern.pattern_description,
      successRate: parseFloat(pattern.success_rate || 0),
      avgDPS: parseFloat(pattern.avg_dps_score || 0),
      matchScore,
    };
  });

  // Sort by match score descending
  matches.sort((a, b) => b.matchScore - a.matchScore);

  return matches;
}

/**
 * Calculate weighted overall pattern match score
 */
function calculateOverallScore(allMatches: PatternMatch[]): number {
  if (allMatches.length === 0) return 0;

  // Weight by success rate, avg DPS, and match score
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const match of allMatches) {
    // Weight = success_rate * (1 + log(avgDPS))
    const weight = match.successRate * (1 + Math.log10(Math.max(1, match.avgDPS)));
    const score = match.matchScore * weight;

    totalWeightedScore += score;
    totalWeight += weight;
  }

  if (totalWeight === 0) return 0;

  return Math.min(100, Math.round(totalWeightedScore / totalWeight));
}

/**
 * Get top N patterns across all Lego types
 */
function getTopPatterns(allMatches: PatternMatch[], topN: number = 5): PatternMatch[] {
  // Sort by weighted score (matchScore * successRate * avgDPS)
  const scored = allMatches.map(match => ({
    ...match,
    weightedScore: match.matchScore * match.successRate * (match.avgDPS / 100),
  }));

  scored.sort((a, b) => b.weightedScore - a.weightedScore);

  return scored.slice(0, topN);
}

// ============================================================================
// Main Pattern Matching Service
// ============================================================================

/**
 * Find matching viral patterns for extracted Idea Legos
 */
export async function findMatchingPatterns(
  legos: IdeaLegos,
  niche: string,
  platform: string
): Promise<PatternMatchingResult> {
  try {
    // Fetch viral patterns (cached)
    const patterns = await fetchViralPatterns(niche, platform, 0.8);

    if (patterns.length === 0) {
      console.warn(`No viral patterns found for niche: ${niche}, platform: ${platform}`);
      return {
        overallScore: 0,
        topPatterns: [],
      };
    }

    // Match each Lego type
    const legoTypes: (keyof IdeaLegos)[] = [
      'topic',
      'angle',
      'hookStructure',
      'storyStructure',
      'visualFormat',
      'keyVisuals',
      'audio',
    ];

    const allMatches: PatternMatch[] = [];

    for (const legoType of legoTypes) {
      const legoValue = legos[legoType];
      const matches = await matchLegoType(legoType, legoValue, patterns);

      // Take top 3 matches per Lego type
      allMatches.push(...matches.slice(0, 3));
    }

    // Calculate overall score
    const overallScore = calculateOverallScore(allMatches);

    // Get top patterns
    const topPatterns = getTopPatterns(allMatches, 5);

    return {
      overallScore,
      topPatterns,
    };
  } catch (error) {
    console.error('Pattern matching failed:', error);
    throw error;
  }
}

/**
 * Clear pattern cache (useful for testing or manual refresh)
 */
export function clearPatternCache(): void {
  patternCache.clear();
}

/**
 * Get cache statistics
 */
export function getPatternCacheStats(): {
  entries: number;
  oldestEntry: number | null;
} {
  if (patternCache.size === 0) {
    return { entries: 0, oldestEntry: null };
  }

  let oldestTimestamp = Date.now();
  for (const [, value] of patternCache) {
    if (value.timestamp < oldestTimestamp) {
      oldestTimestamp = value.timestamp;
    }
  }

  return {
    entries: patternCache.size,
    oldestEntry: Date.now() - oldestTimestamp,
  };
}
