export type MetricWindow = '1h' | '2h' | '6h' | '24h' | '48h' | '7d';

export interface VIT {
  id: string;
  platform: 'tiktok' | 'instagram' | 'youtube';
  platformVideoId: string;
  creatorId: string;
  niche?: string;
  publishTs: string;
  durationSec?: number;
  locale?: string;
  caption?: string;
  hashtags?: string[];
  audio?: { id?: string; title?: string; isOriginal?: boolean };

  metrics: Array<{
    window: MetricWindow;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    avgViewDurSec?: number;
    retentionCurve?: number[];
  }>;

  baselines?: {
    cohortSize?: number;
    zScore?: number;
    percentile?: number;
    creator30d?: { views?: number; er?: number; velocity?: number };
  };

  script?: { transcript?: string; patterns?: Array<{ id: string; confidence: number }>; hookType?: string; ctaType?: string };
  features?: Record<string, number>;
  prediction?: { probability: number; confidence: number; rationale?: string; topFactors?: string[]; latencyMs?: number } | null;
  validation48h?: { label: 'viral' | 'nonviral'; wasCorrect?: boolean; errorType?: 'FP' | 'FN' } | null;

  template?: { id?: string; successRate?: number; state?: 'HOT' | 'COOLING' | 'NEW'; examples?: string[] };
  crossPlatform?: { reposts?: Array<{ platform: string; publishTs: string }>; cascadeLagSec?: number; crossPlatformScore?: number };
  ops?: { duplicateOf?: string | null };
  commerce?: { skuIds?: string[]; estRevenueLift?: number; actualRevenue?: number };

  vitVersion: '1.0.0';
  extra?: Record<string, unknown>;
}


