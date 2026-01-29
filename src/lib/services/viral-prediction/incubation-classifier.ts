export type IncubationLabel = 'now' | 'incubation' | 'unlikely';

export interface IncubationFeatures {
  hoursSinceUpload: number;
  cohortPercentile: number;     // 0..100 from DPS
  likesPerHour: number;
  sharesPerHour: number;
  commentsPerHour: number;
  accel: number;                // derivative of engagement/hour
  trendSimilarity: number;      // 0..1 cosine vs. live niche exemplars
  frameworkMatch: number;       // 0..1 aggregated framework score
}

export function classifyIncubation(f: IncubationFeatures): IncubationLabel {
  const isNow =
    (f.cohortPercentile >= 95 && f.accel >= 0.20) ||
    (f.trendSimilarity >= 0.85 && f.frameworkMatch >= 0.70 && f.accel >= 0.15);

  if (isNow) return 'now';

  const isIncubation =
    (f.cohortPercentile >= 85 && f.cohortPercentile < 95 && f.accel >= 0.12) ||
    (f.trendSimilarity >= 0.75 && f.frameworkMatch >= 0.60 && f.accel >= 0.10);

  return isIncubation ? 'incubation' : 'unlikely';
}










