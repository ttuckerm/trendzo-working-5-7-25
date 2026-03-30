/**
 * Delivery Baseline — Types and Scoring (browser-safe)
 *
 * This file contains ONLY the DeliveryBaseline type and the pure scoring
 * function. No Node.js dependencies (fs, ffmpeg, etc.).
 *
 * The server-only analysis logic lives in delivery-analyzer.ts.
 */

export interface DeliveryBaseline {
  speakingRateWpm: number;
  speakingRateVariance: number;
  energyLevel: number;
  silenceRatio: number;
  sampleCount: number;
  analyzedAt: string;
}

/**
 * Convert a DeliveryBaseline into a single 0-100 technicalCompetency score.
 * Weights: WPM normalization (30%), energy (30%), silence penalty (20%), variance (20%).
 */
export function deliveryBaselineToScore(baseline: DeliveryBaseline): number {
  const wpmScore = baseline.speakingRateWpm;
  const energyScore = baseline.energyLevel;
  const silenceScore = Math.max(0, 100 - baseline.silenceRatio * 200);
  const varianceScore = baseline.speakingRateVariance;

  const weighted = wpmScore * 0.3 + energyScore * 0.3 + silenceScore * 0.2 + varianceScore * 0.2;
  return Math.round(Math.max(0, Math.min(100, weighted)));
}
