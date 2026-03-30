/**
 * Creator Context Resolver
 *
 * Loads calibration profile + channel data for a user and returns a unified
 * CreatorContext object. Used by the prediction pipeline to:
 * - Override accountSize with real follower count
 * - Personalize Pack 2 suggestions with creator preferences
 *
 * Runs server-side only. Requires a Supabase client with service-role access.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CalibrationProfile, InferredProfile } from '@/lib/onboarding/calibration-scorer';
import { type DeliveryBaseline, deliveryBaselineToScore } from '@/lib/onboarding/delivery-baseline';

// ============================================================================
// Types
// ============================================================================

export type CreatorStage = 'new' | 'growing' | 'established' | 'large' | 'mega';

export interface CreatorStoryData {
  transformation: string;
  nicheMyths: string[];
  audienceDesiredResult: string;
  creatorCredentials: string | null;
  nicheMistakes: string | null;
}

export interface CreatorCalibrationProfile {
  rawScores: CalibrationProfile;
  inferredProfile: InferredProfile;
  selectedNiche: string;
  selectedGoal: string;
  selectedSubtopics: string[];
  creatorStory: CreatorStoryData | null;
  audienceEnrichment: AudienceEnrichment | null;
  qualityDiscernmentScore: number | null;
}

export interface AudienceEnrichment {
  location: string | null;
  occupation: string | null;
}

export interface CreatorChannelData {
  username: string;
  followerCount: number | null;
  avgViews: number | null;
  avgEngagementRate: number | null;
  inferredNicheKey: string | null;
  accountSizeBand: string;
  region: string | null;
  deliveryBaseline: DeliveryBaseline | null;
  deliveryScore: number | null;
}

export interface CreatorContext {
  /** Raw calibration scores + inferred profile (null if no calibration completed) */
  calibrationProfile: CreatorCalibrationProfile | null;
  /** Channel metrics from verified TikTok account (null if no channel connected) */
  channelData: CreatorChannelData | null;
  /** Derived creator stage based on follower count */
  creatorStage: CreatorStage;
}

// ============================================================================
// Resolver
// ============================================================================

/**
 * Load calibration profile + channel data for a user.
 * Returns null if neither exists (pipeline works as today — no regression).
 */
export async function resolveCreatorContext(
  supabase: SupabaseClient,
  userId: string
): Promise<CreatorContext | null> {
  // Run both queries in parallel
  const [calibrationResult, channelResult] = await Promise.all([
    supabase
      .from('onboarding_profiles')
      .select('*')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('user_channels')
      .select('*')
      .eq('user_id', userId)
      .eq('platform', 'tiktok')
      .single(),
  ]);

  const calData = calibrationResult.data;
  const chData = channelResult.data;

  // If neither table has data, return null (no context available)
  if (!calData && !chData) {
    return null;
  }

  // Build calibration profile (if available)
  const calibrationProfile: CreatorCalibrationProfile | null = calData
    ? {
        rawScores: {
          nicheAffinity: calData.niche_affinity ?? {},
          hookStylePreference: calData.cal_hook_style_preference ?? {},
          toneMatch: calData.cal_tone_match ?? {},
          audiencePainAlignment: calData.audience_pain_alignment ?? {},
          editingStyleFit: calData.editing_style_fit ?? {},
          contentFormatPreference: calData.content_format_preference ?? {},
        },
        inferredProfile: {
          inferredNiche: calData.inferred_niche,
          inferredAudience: {
            ageRange: calData.inferred_audience_age_range,
            description: calData.inferred_audience_description,
          },
          inferredContentStyle: calData.inferred_content_style,
          inferredCompetitors: calData.inferred_competitors ?? [],
          inferredOffer: calData.offer ?? null,
          inferredExclusions: calData.exclusions ?? [],
        },
        selectedNiche: calData.selected_niche ?? '',
        selectedGoal: calData.selected_goal ?? '',
        selectedSubtopics: calData.selected_subtopics ?? [],
        creatorStory: calData.cal_creator_story
          ? {
              ...calData.cal_creator_story,
              creatorCredentials: calData.cal_creator_story.creatorCredentials ?? null,
              nicheMistakes: calData.cal_creator_story.nicheMistakes ?? null,
            }
          : null,
        audienceEnrichment: calData.audience_location || calData.audience_occupation
          ? { location: calData.audience_location ?? null, occupation: calData.audience_occupation ?? null }
          : null,
        qualityDiscernmentScore: calData.quality_discernment_score ?? null,
      }
    : null;

  // Build channel data (if available)
  const channelData: CreatorChannelData | null = chData
    ? {
        username: chData.username,
        followerCount: chData.follower_count,
        avgViews: chData.avg_views != null ? Number(chData.avg_views) : null,
        avgEngagementRate:
          chData.avg_engagement_rate != null
            ? Number(chData.avg_engagement_rate)
            : null,
        inferredNicheKey: chData.inferred_niche_key,
        accountSizeBand: followerCountToAccountSizeBand(chData.follower_count),
        region: chData.region ?? null,
        deliveryBaseline: chData.delivery_baseline ?? null,
        deliveryScore: chData.delivery_baseline ? deliveryBaselineToScore(chData.delivery_baseline) : null,
      }
    : null;

  // Derive creator stage from follower count
  const creatorStage = deriveCreatorStage(channelData?.followerCount ?? null);

  return {
    calibrationProfile,
    channelData,
    creatorStage,
  };
}

// ============================================================================
// Helpers
// ============================================================================

function deriveCreatorStage(followers: number | null): CreatorStage {
  if (followers == null || followers === 0) return 'new';
  if (followers < 10_000) return 'growing';
  if (followers < 100_000) return 'established';
  if (followers < 1_000_000) return 'large';
  return 'mega';
}

function followerCountToAccountSizeBand(followers: number | null): string {
  if (followers == null) return 'small (0-10K)';
  if (followers >= 1_000_000) return 'mega (1M+)';
  if (followers >= 100_000) return 'large (100K-1M)';
  if (followers >= 10_000) return 'medium (10K-100K)';
  return 'small (0-10K)';
}
