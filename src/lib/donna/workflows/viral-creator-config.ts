/**
 * Viral Creator & Hashtag Configuration
 *
 * Curated lists of high-performing creators and hashtags to monitor
 */

import { ViralCreator, ViralHashtag } from './viral-scraping-workflow';

// ============================================================================
// VIRAL CREATORS - Top performers to monitor
// ============================================================================

export const VIRAL_CREATORS: ViralCreator[] = [
  // Business & Finance
  {
    username: 'alexhormozi',
    platform: 'tiktok',
    followerCount: 5200000,
    niche: 'business',
    historicalDPS: 78.5
  },
  {
    username: 'garyvee',
    platform: 'tiktok',
    followerCount: 18500000,
    niche: 'business',
    historicalDPS: 75.2
  },
  {
    username: 'danhenryy',
    platform: 'tiktok',
    followerCount: 350000,
    niche: 'business',
    historicalDPS: 72.3
  },

  // Entertainment
  {
    username: 'mrbeast',
    platform: 'tiktok',
    followerCount: 95000000,
    niche: 'entertainment',
    historicalDPS: 85.3
  },
  {
    username: 'zachking',
    platform: 'tiktok',
    followerCount: 72000000,
    niche: 'entertainment',
    historicalDPS: 81.4
  },
  {
    username: 'khaby.lame',
    platform: 'tiktok',
    followerCount: 162000000,
    niche: 'entertainment',
    historicalDPS: 83.7
  },

  // Lifestyle & Motivation
  {
    username: 'ryantrahan',
    platform: 'tiktok',
    followerCount: 4300000,
    niche: 'lifestyle',
    historicalDPS: 72.8
  },
  {
    username: 'davidgoggins',
    platform: 'tiktok',
    followerCount: 7800000,
    niche: 'motivation',
    historicalDPS: 76.9
  },

  // Education
  {
    username: 'markrober',
    platform: 'tiktok',
    followerCount: 18200000,
    niche: 'education',
    historicalDPS: 79.4
  },
  {
    username: 'veritasium',
    platform: 'tiktok',
    followerCount: 3200000,
    niche: 'education',
    historicalDPS: 74.1
  }
];

// ============================================================================
// VIRAL HASHTAGS - High-performing hashtags by niche
// ============================================================================

export const VIRAL_HASHTAGS: ViralHashtag[] = [
  // Business & Finance
  {
    tag: 'moneyadvice',
    platform: 'tiktok',
    niche: 'finance',
    avgDPS: 72.3
  },
  {
    tag: 'businesstips',
    platform: 'tiktok',
    niche: 'business',
    avgDPS: 71.5
  },
  {
    tag: 'entrepreneur',
    platform: 'tiktok',
    niche: 'business',
    avgDPS: 69.8
  },
  {
    tag: 'sidehustle',
    platform: 'tiktok',
    niche: 'business',
    avgDPS: 70.2
  },

  // Motivation & Lifestyle
  {
    tag: 'motivation',
    platform: 'tiktok',
    niche: 'lifestyle',
    avgDPS: 68.9
  },
  {
    tag: 'mindset',
    platform: 'tiktok',
    niche: 'motivation',
    avgDPS: 67.4
  },
  {
    tag: 'selfdevelopment',
    platform: 'tiktok',
    niche: 'motivation',
    avgDPS: 66.8
  },

  // Transformation & Fitness
  {
    tag: 'transformation',
    platform: 'tiktok',
    niche: 'fitness',
    avgDPS: 74.2
  },
  {
    tag: 'beforeandafter',
    platform: 'tiktok',
    niche: 'fitness',
    avgDPS: 73.5
  },
  {
    tag: 'fitnessjourney',
    platform: 'tiktok',
    niche: 'fitness',
    avgDPS: 71.9
  },

  // Lifestyle & Tips
  {
    tag: 'lifehacks',
    platform: 'tiktok',
    niche: 'lifestyle',
    avgDPS: 69.8
  },
  {
    tag: 'productivity',
    platform: 'tiktok',
    niche: 'lifestyle',
    avgDPS: 68.3
  },

  // General Viral
  {
    tag: 'viral',
    platform: 'tiktok',
    niche: 'general',
    avgDPS: 75.1
  },
  {
    tag: 'trending',
    platform: 'tiktok',
    niche: 'general',
    avgDPS: 73.6
  },
  {
    tag: 'foryou',
    platform: 'tiktok',
    niche: 'general',
    avgDPS: 72.8
  }
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get creators by niche
 */
export function getCreatorsByNiche(niche: string): ViralCreator[] {
  return VIRAL_CREATORS.filter(c => c.niche === niche);
}

/**
 * Get hashtags by niche
 */
export function getHashtagsByNiche(niche: string): ViralHashtag[] {
  return VIRAL_HASHTAGS.filter(h => h.niche === niche);
}

/**
 * Get top N creators by historical DPS
 */
export function getTopCreators(n: number = 10): ViralCreator[] {
  return [...VIRAL_CREATORS]
    .sort((a, b) => b.historicalDPS - a.historicalDPS)
    .slice(0, n);
}

/**
 * Get top N hashtags by avg DPS
 */
export function getTopHashtags(n: number = 10): ViralHashtag[] {
  return [...VIRAL_HASHTAGS]
    .sort((a, b) => b.avgDPS - a.avgDPS)
    .slice(0, n);
}

/**
 * Get all niches
 */
export function getAllNiches(): string[] {
  const niches = new Set<string>();
  VIRAL_CREATORS.forEach(c => niches.add(c.niche));
  VIRAL_HASHTAGS.forEach(h => niches.add(h.niche));
  return Array.from(niches).sort();
}
