// ─── Types ───────────────────────────────────────────────────────────────────

export type SwipeDirection = 'up' | 'down';

export interface CalibrationVideoAttributes {
  hook_style: string;
  tone: string;
  content_format: string;
  niche_signal: string;
  editing_style: string;
  audience_pain: string;
}

export type PerformanceTier = 'high' | 'average' | 'underperformer';

export interface CalibrationVideo {
  id: string;
  title: string;
  creator: string;
  niche_tags: string[];
  attribute_tags: CalibrationVideoAttributes;
  thumbnail_color: string;
  views: number;
  likes: number;
  performance_tier: PerformanceTier;
  placeholder?: boolean;
}

export interface CalibrationProfile {
  nicheAffinity: Record<string, number>;
  hookStylePreference: Record<string, number>;
  toneMatch: Record<string, number>;
  audiencePainAlignment: Record<string, number>;
  editingStyleFit: Record<string, number>;
  contentFormatPreference: Record<string, number>;
}

export interface InferredProfile {
  inferredNiche: string;
  inferredAudience: { ageRange: string; description: string };
  inferredContentStyle: string;
  inferredCompetitors: string[];
  inferredOffer: string | null;
  inferredExclusions: string[];
}

// ─── Dimension-to-attribute mapping ──────────────────────────────────────────

const DIMENSION_MAP: Record<keyof CalibrationProfile, keyof CalibrationVideoAttributes> = {
  nicheAffinity: 'niche_signal',
  hookStylePreference: 'hook_style',
  toneMatch: 'tone',
  audiencePainAlignment: 'audience_pain',
  editingStyleFit: 'editing_style',
  contentFormatPreference: 'content_format',
};

// ─── Audience inference rules ────────────────────────────────────────────────

const PAIN_TO_AUDIENCE: Record<string, { ageRange: string; description: string }> = {
  'time-scarcity': { ageRange: '25-40', description: 'Busy professionals who want quick, actionable results' },
  'money-anxiety': { ageRange: '22-35', description: 'People looking to increase income or reduce financial stress' },
  'body-image': { ageRange: '18-30', description: 'People seeking physical transformation and confidence' },
  'information-overload': { ageRange: '20-35', description: 'Learners who want clear, structured guidance' },
  'imposter-syndrome': { ageRange: '25-40', description: 'Professionals doubting their expertise despite results' },
  'low-engagement': { ageRange: '22-35', description: 'Creators struggling to grow their audience' },
  'no-leads': { ageRange: '28-45', description: 'Business owners who need a reliable client pipeline' },
  'burnout': { ageRange: '25-40', description: 'High performers who need sustainable systems' },
  'loneliness': { ageRange: '20-35', description: 'Seeking deeper connection and relationship skills' },
  'parenting-guilt': { ageRange: '28-42', description: 'Parents who feel they\'re not doing enough' },
  'career-stagnation': { ageRange: '25-40', description: 'Professionals feeling stuck with no clear path' },
  'health-anxiety': { ageRange: '25-45', description: 'People worried about health seeking reliable guidance' },
  'language-barrier': { ageRange: '18-40', description: 'Struggling to communicate in a new language' },
  'style-insecurity': { ageRange: '18-30', description: 'Want to look better but feel lost with fashion' },
  'wanderlust': { ageRange: '22-35', description: 'Craving travel experiences on a realistic budget' },
  'meal-fatigue': { ageRange: '22-40', description: 'Home cooks tired of the same recipes' },
  'decision-paralysis': { ageRange: '22-35', description: 'Overwhelmed by too many tech choices' },
  'home-frustration': { ageRange: '25-45', description: 'Homeowners wanting to improve their space' },
};

const DEFAULT_AUDIENCE = { ageRange: '20-35', description: 'Growth-minded individuals seeking transformation' };

// ─── Hook Cluster Map (mirrors HOOK_CLUSTERS from system-registry.ts) ────────

const HOOK_CLUSTERS_MAP: Record<string, string[]> = {
  curiosity_trigger:    ['question', 'list_preview'],
  cognitive_challenge:  ['contrarian', 'myth_bust'],
  credibility_signal:   ['statistic', 'authority', 'result_preview'],
  emotional_connection: ['personal_story', 'problem_identification'],
  urgency_scarcity:     ['urgency'],
};

// ─── Scorer ──────────────────────────────────────────────────────────────────

const ACCEPT_WEIGHTS: Record<PerformanceTier, number> = {
  high: 20,
  average: 15,
  underperformer: 10,
};
const REJECT_WEIGHTS: Record<PerformanceTier, number> = {
  high: -5,
  average: -10,
  underperformer: -12,
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class CalibrationScorer {
  private profile: CalibrationProfile;
  private acceptedCreators: string[];
  private highAccepted = 0;
  private underperformerRejected = 0;
  private totalSwipes = 0;

  constructor() {
    this.profile = {
      nicheAffinity: {},
      hookStylePreference: {},
      toneMatch: {},
      audiencePainAlignment: {},
      editingStyleFit: {},
      contentFormatPreference: {},
    };
    this.acceptedCreators = [];
  }

  recordSwipe(video: CalibrationVideo, direction: SwipeDirection): void {
    const delta = direction === 'up'
      ? ACCEPT_WEIGHTS[video.performance_tier]
      : REJECT_WEIGHTS[video.performance_tier];

    this.totalSwipes++;

    // Track quality discernment tallies
    if (direction === 'up' && video.performance_tier === 'high') this.highAccepted++;
    if (direction === 'down' && video.performance_tier === 'underperformer') this.underperformerRejected++;

    for (const [dimension, attrKey] of Object.entries(DIMENSION_MAP)) {
      const value = video.attribute_tags[attrKey];
      const dim = dimension as keyof CalibrationProfile;
      const current = this.profile[dim][value] ?? 50;
      this.profile[dim][value] = clamp(current + delta, 0, 100);
    }

    // Cluster-level scoring for hook styles
    const hookType = video.attribute_tags.hook_style;
    const clusterDelta = direction === 'up' ? 5 : -3;
    for (const cluster of Object.values(HOOK_CLUSTERS_MAP)) {
      if (cluster.includes(hookType)) {
        for (const sibling of cluster) {
          if (sibling !== hookType) {
            const current = this.profile.hookStylePreference[sibling] ?? 50;
            this.profile.hookStylePreference[sibling] = clamp(current + clusterDelta, 0, 100);
          }
        }
        break;
      }
    }

    // Also boost niche_tags into nicheAffinity
    for (const tag of video.niche_tags) {
      const current = this.profile.nicheAffinity[tag] ?? 50;
      this.profile.nicheAffinity[tag] = clamp(current + delta, 0, 100);
    }

    if (direction === 'up') {
      this.acceptedCreators.push(video.creator);
    }
  }

  getProfile(): CalibrationProfile {
    return structuredClone(this.profile);
  }

  getAcceptedCreators(): string[] {
    return [...new Set(this.acceptedCreators)];
  }

  getQualityDiscernmentScore(): number {
    if (this.totalSwipes === 0) return 50;
    return Math.round((this.highAccepted + this.underperformerRejected) / this.totalSwipes * 100);
  }
}

// ─── Profile Inference ───────────────────────────────────────────────────────

function topKey(record: Record<string, number>): string | null {
  let best: string | null = null;
  let bestScore = -Infinity;
  for (const [key, score] of Object.entries(record)) {
    if (score > bestScore) {
      bestScore = score;
      best = key;
    }
  }
  return best;
}

export function inferProfile(
  profile: CalibrationProfile,
  acceptedCreators: string[]
): InferredProfile {
  const inferredNiche = topKey(profile.nicheAffinity) ?? 'general';

  const topPain = topKey(profile.audiencePainAlignment);
  const inferredAudience = (topPain && PAIN_TO_AUDIENCE[topPain]) ?? DEFAULT_AUDIENCE;

  const topFormat = topKey(profile.contentFormatPreference) ?? 'talking-head';
  const topEditing = topKey(profile.editingStyleFit) ?? 'standard';
  const topTone = topKey(profile.toneMatch) ?? 'authority';
  const inferredContentStyle = `${topTone} ${topFormat} with ${topEditing} editing`;

  return {
    inferredNiche,
    inferredAudience,
    inferredContentStyle,
    inferredCompetitors: [...new Set(acceptedCreators)],
    inferredOffer: null,
    inferredExclusions: [],
  };
}
