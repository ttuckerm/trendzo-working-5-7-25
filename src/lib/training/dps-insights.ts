/**
 * DPS Performance Insights Generator
 *
 * Translates DPS v2.1.0 breakdown signals into plain-language strengths,
 * improvements, and coaching suggestions for agency-facing display.
 *
 * NEVER exposes signal names, weights, formulas, or scoring mechanics.
 * Pure function — no database calls, no side effects.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DpsInsightsInput {
  breakdown: Record<string, any>; // dps_v2_breakdown JSONB from prediction_runs
  display_score: number;          // 0-100 display score
  tier: string;                   // mega-viral, hyper-viral, viral, normal
}

export interface DpsInsights {
  headline: string;              // One-line summary
  strengths: string[];           // 1-4 plain-language strength statements
  improvements: string[];        // 0-4 actionable improvement suggestions
  unlock_prompt: string | null;  // Upsell message when signals are missing
}

// ── Strength Thresholds ────────────────────────────────────────────────────────

const STRENGTH_THRESHOLDS = {
  share_rate: [
    { min: 0.03,  text: 'Exceptional shareability — viewers actively sent this to others' },
    { min: 0.015, text: 'Strong sharing behavior — this content resonated enough to forward' },
    { min: 0.008, text: 'Healthy share activity' },
  ],
  save_rate: [
    { min: 0.04, text: 'High bookmark rate — people saved this as reference content worth revisiting' },
    { min: 0.02, text: 'Good save behavior — viewers found lasting value in this content' },
  ],
  view_to_follower_ratio: [
    { min: 20, text: 'Massive reach beyond your typical audience — the algorithm pushed this hard' },
    { min: 5,  text: 'Strong reach beyond your existing followers' },
    { min: 2,  text: 'Solid audience expansion — reached beyond your core followers' },
  ],
  reach_score: [
    { min: 0.85, text: 'Exceptional view volume — this reached a massive audience' },
    { min: 0.70, text: 'Strong view count — significant audience reached' },
  ],
  view_percentile_within_cohort: [
    { min: 0.95, text: 'Top-tier performance compared to similar creators in your niche' },
    { min: 0.80, text: 'Outperformed most creators of your size in this content category' },
    { min: 0.60, text: 'Performed above average for your creator tier' },
  ],
  comment_rate: [
    { min: 0.02, text: 'High conversation rate — this content sparked real discussion' },
    { min: 0.01, text: 'Good engagement in comments — viewers had something to say' },
  ],
  velocity_score: [
    { min: 500, text: 'Explosive early traction — strong first-hour performance' },
    { min: 200, text: 'Solid early momentum after posting' },
  ],
  completion_rate: [
    { min: 0.80, text: 'Excellent retention — viewers watched almost the entire video' },
    { min: 0.60, text: 'Good watch-through rate — content held attention well' },
  ],
} as const;

// ── Improvement Thresholds ─────────────────────────────────────────────────────

const IMPROVEMENT_RULES = [
  {
    signal: 'share_rate' as const,
    below: 0.005,
    text: 'Try ending with a moment viewers would want to share — a surprising reveal, a relatable punchline, or a hot take',
    priority: 1,
  },
  {
    signal: 'completion_rate' as const,
    below: 0.40,
    text: 'Viewers dropped off early — tighten the opening, cut the intro, and front-load the payoff',
    priority: 2,
  },
  {
    signal: 'save_rate' as const,
    below: 0.01,
    text: 'Add a tip, stat, or framework worth bookmarking — saves signal content with lasting value',
    priority: 3,
  },
  {
    signal: 'view_to_follower_ratio' as const,
    below: 1.0,
    text: 'This reached fewer people than your follower count — a stronger hook in the first 2 seconds can help the algorithm push it further',
    priority: 4,
  },
  {
    signal: 'comment_rate' as const,
    below: 0.003,
    text: 'Low conversation — try asking a direct question or presenting a take that invites debate',
    priority: 5,
  },
  {
    signal: 'view_percentile_within_cohort' as const,
    below: 0.30,
    text: 'Below average for creators of your size in this niche — study what top performers in your category are doing differently',
    priority: 6,
  },
];

// Priority order for sorting strengths (by impact, highest first)
const SIGNAL_PRIORITY: Record<string, number> = {
  share_rate: 1,
  view_percentile_within_cohort: 2,
  reach_score: 3,
  save_rate: 4,
  view_to_follower_ratio: 5,
  velocity_score: 6,
  completion_rate: 7,
  comment_rate: 8,
};

const MAX_STRENGTHS = 4;
const MAX_IMPROVEMENTS = 4;

// ── Main Generator ─────────────────────────────────────────────────────────────

export function generateDpsInsights(input: DpsInsightsInput): DpsInsights {
  const { breakdown, display_score, tier } = input;
  const signals: Record<string, number | null> = breakdown?.signals ?? {};

  return {
    headline: generateHeadline(display_score, tier),
    strengths: generateStrengths(signals, display_score),
    improvements: generateImprovements(signals),
    unlock_prompt: generateUnlockPrompt(signals),
  };
}

// ── Headline ───────────────────────────────────────────────────────────────────

function generateHeadline(display_score: number, tier: string): string {
  if (tier === 'mega-viral') return 'Exceptional performance — top 0.1% of your niche';
  if (tier === 'hyper-viral') return 'Outstanding performance — top 1% of your niche';
  if (tier === 'viral') return 'Strong viral performance — top 5% of your niche';
  if (tier === 'above-average') return 'Above average — outperforming most content in your niche';
  if (tier === 'average') return 'Solid performance — in line with your niche benchmarks';
  if (tier === 'below-average') return 'Below average — room for improvement in this niche';
  if (tier === 'poor') return 'Underperforming — see improvement suggestions below';
  // Fallback for legacy tiers without the 7-tier classification
  if (display_score >= 80) return 'Above average — outperforming most content in your niche';
  if (display_score >= 60) return 'Solid performance — in line with your niche benchmarks';
  if (display_score >= 40) return 'Below average — room for improvement in this niche';
  return 'Underperforming — see improvement suggestions below';
}

// ── Strengths ──────────────────────────────────────────────────────────────────

function generateStrengths(signals: Record<string, number | null>, display_score: number): string[] {
  const matched: Array<{ text: string; priority: number }> = [];

  for (const [signalName, thresholds] of Object.entries(STRENGTH_THRESHOLDS)) {
    const value = signals[signalName];
    if (value == null) continue;

    // Pick the highest matching threshold
    for (const threshold of thresholds) {
      if (value >= threshold.min) {
        matched.push({
          text: threshold.text,
          priority: SIGNAL_PRIORITY[signalName] ?? 99,
        });
        break; // Only the highest match per signal
      }
    }
  }

  // Sort by priority (lower = more important)
  matched.sort((a, b) => a.priority - b.priority);

  return matched.slice(0, MAX_STRENGTHS).map(m => m.text);
}

// ── Improvements ───────────────────────────────────────────────────────────────

function generateImprovements(signals: Record<string, number | null>): string[] {
  const matched: Array<{ text: string; priority: number }> = [];

  for (const rule of IMPROVEMENT_RULES) {
    const value = signals[rule.signal];
    if (value !== null && value !== undefined && value < rule.below) {
      matched.push({ text: rule.text, priority: rule.priority });
    }
  }

  // Sort by priority (lower = higher impact)
  matched.sort((a, b) => a.priority - b.priority);

  return matched.slice(0, MAX_IMPROVEMENTS).map(m => m.text);
}

// ── Unlock Prompt ──────────────────────────────────────────────────────────────

function generateUnlockPrompt(signals: Record<string, number | null>): string | null {
  const velocityMissing = signals.velocity_score == null;
  const completionMissing = signals.completion_rate == null;

  if (velocityMissing || completionMissing) {
    return 'Connect your TikTok account to unlock deeper performance analysis — including early velocity tracking and audience retention insights';
  }

  return null;
}
