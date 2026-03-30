/**
 * Creator Staging System
 *
 * Assigns each creator a precise insertion point across 5 dimensions
 * and routes them to the optimal onboarding path.
 *
 * Runs client-side in the Viral Studio workflow after calibration completes.
 */

import type { CalibrationProfile, InferredProfile } from './calibration-scorer';
import type { ChannelVerificationResult } from './channel-verifier';
import { deliveryBaselineToScore } from './delivery-baseline';

// ============================================================================
// Types
// ============================================================================

export type OnboardingStage =
  | 'ready-to-ship'
  | 'audience-first'
  | 'style-refinement'
  | 'foundation'
  | 'advanced'
  | 'delivery-improvement';

export interface DimensionScores {
  nicheAuthority: number; // 0-100
  audienceClarity: number; // 0-100
  contentMaturity: number; // 0-100
  styleDefinition: number; // 0-100
  technicalCompetency: number; // 0-100
}

export interface StagingResult {
  dimensions: DimensionScores;
  stage: OnboardingStage;
  recommendedPath: string;
}

export interface AudienceDiagnosticAnswers {
  idealViewer: string;
  problemSolved: string;
  uniqueAngle: string;
}

// ============================================================================
// Main Calculator
// ============================================================================

export function calculateCreatorStage(
  rawScores: CalibrationProfile | null,
  inferredProfile: InferredProfile | null,
  channelData: ChannelVerificationResult | null
): StagingResult {
  const hasChannel = channelData != null;

  const dimensions: DimensionScores = {
    nicheAuthority: scoreNicheAuthority(rawScores, channelData),
    audienceClarity: scoreAudienceClarity(rawScores, inferredProfile, channelData),
    contentMaturity: hasChannel ? scoreContentMaturity(channelData) : 50,
    styleDefinition: hasChannel ? scoreStyleDefinition(rawScores, channelData) : 50,
    technicalCompetency: channelData?.deliveryBaseline
      ? deliveryBaselineToScore(channelData.deliveryBaseline)
      : 50,
  };

  const stage = classifyStage(dimensions);

  return { dimensions, stage, recommendedPath: stageToPath(stage) };
}

// ============================================================================
// Dimension Scorers
// ============================================================================

function scoreNicheAuthority(
  rawScores: CalibrationProfile | null,
  channelData: ChannelVerificationResult | null
): number {
  // Base: top nicheAffinity score from calibration
  let score = topScore(rawScores?.nicheAffinity);

  if (channelData) {
    // Bonus: channel niche matches inferred niche from calibration
    if (
      channelData.inferredNicheKey &&
      rawScores?.nicheAffinity &&
      channelData.inferredNicheKey in rawScores.nicheAffinity
    ) {
      const affinityForChannelNiche = rawScores.nicheAffinity[channelData.inferredNicheKey] ?? 0;
      if (affinityForChannelNiche > 50) {
        score += 15;
      }
    }

    // Bonus: high niche confidence from channel hashtags
    if (channelData.inferredNicheConfidence > 0.5) {
      score += 10;
    }
  }

  return clamp(score);
}

function scoreAudienceClarity(
  rawScores: CalibrationProfile | null,
  inferredProfile: InferredProfile | null,
  channelData: ChannelVerificationResult | null
): number {
  // Base: top audiencePainAlignment score
  let score = topScore(rawScores?.audiencePainAlignment);

  // Bonus: user specified an offer (shows they know their audience)
  if (inferredProfile?.inferredOffer && inferredProfile.inferredOffer.trim().length > 0) {
    score += 15;
  }

  // Bonus: user specified exclusions (shows audience awareness)
  if (inferredProfile?.inferredExclusions && inferredProfile.inferredExclusions.length > 0) {
    score += 10;
  }

  // Bonus: high engagement rate suggests audience understanding
  if (channelData && channelData.avgEngagementRate > 0.05) {
    score += 10;
  }

  return clamp(score);
}

function scoreContentMaturity(channelData: ChannelVerificationResult): number {
  const count = channelData.videoCount ?? 0;
  if (count === 0) return 10;
  if (count <= 10) return 20;
  if (count <= 50) return 40;
  if (count <= 100) return 60;
  if (count <= 200) return 75;
  if (count <= 500) return 85;
  return 95;
}

function scoreStyleDefinition(
  rawScores: CalibrationProfile | null,
  channelData: ChannelVerificationResult | null
): number {
  if (!rawScores) return 50;

  // Average of top editing style and top hook style preference
  const topEditing = topScore(rawScores.editingStyleFit);
  const topHook = topScore(rawScores.hookStylePreference);
  let score = (topEditing + topHook) / 2;

  // Bonus: clear preference (large gap between top and 2nd choice)
  const editingGap = topGap(rawScores.editingStyleFit);
  const hookGap = topGap(rawScores.hookStylePreference);
  if (editingGap > 20 || hookGap > 20) {
    score += 15;
  }

  // Bonus: channel niche confidence as style consistency proxy
  if (channelData && channelData.inferredNicheConfidence > 0.5) {
    score += 10;
  }

  return clamp(score);
}

// ============================================================================
// Stage Classification
// ============================================================================

function classifyStage(d: DimensionScores): OnboardingStage {
  // Priority 1: Delivery Improvement — weak delivery overrides everything else
  if (d.technicalCompetency < 40) {
    return 'delivery-improvement';
  }

  // Priority 2: Advanced — high across the board
  if (d.nicheAuthority >= 65 && d.audienceClarity >= 65 && d.contentMaturity >= 65 && d.styleDefinition >= 65) {
    return 'advanced';
  }

  // Priority 3: Ready to Ship — knows niche & audience, low content output
  if (d.nicheAuthority >= 65 && d.audienceClarity >= 65 && d.contentMaturity < 40) {
    return 'ready-to-ship';
  }

  // Priority 4: Audience First — unclear audience (any other scores)
  if (d.audienceClarity < 40) {
    return 'audience-first';
  }

  // Priority 5: Style Refinement — lots of content, undefined style
  if (d.contentMaturity >= 65 && d.styleDefinition < 40) {
    return 'style-refinement';
  }

  // Priority 6: Foundation — default
  return 'foundation';
}

function stageToPath(stage: OnboardingStage): string {
  switch (stage) {
    case 'advanced':
      return 'Direct to Pattern Library for opportunity hunting';
    case 'delivery-improvement':
      return 'Delivery coaching before content strategy';
    case 'ready-to-ship':
      return 'Skip education, straight to content calendar';
    case 'audience-first':
      return 'Audience diagnostic before templates';
    case 'style-refinement':
      return 'Format experimentation briefs';
    case 'foundation':
      return 'Full onboarding sequence';
  }
}

// ============================================================================
// Helpers
// ============================================================================

function topScore(scores: Record<string, number> | undefined): number {
  if (!scores) return 0;
  const values = Object.values(scores);
  if (values.length === 0) return 0;
  return Math.max(...values);
}

function topGap(scores: Record<string, number> | undefined): number {
  if (!scores) return 0;
  const values = Object.values(scores).sort((a, b) => b - a);
  if (values.length < 2) return 0;
  return values[0] - values[1];
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
