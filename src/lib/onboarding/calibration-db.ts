import { getSupabaseClient } from '@/lib/supabase/client';
import type { CalibrationProfile, InferredProfile } from './calibration-scorer';
import type { StagingResult } from './creator-stage';

export interface SavedCalibrationProfile {
  rawScores: CalibrationProfile;
  inferredProfile: InferredProfile;
  selectedNiche: string;
  selectedGoal: string;
  selectedSubtopics: string[];
  audienceLocation: string | null;
  audienceOccupation: string | null;
  qualityDiscernmentScore: number | null;
  updatedAt: string;
}

export async function saveCalibrationProfile(
  userId: string,
  rawScores: CalibrationProfile,
  inferredProfile: InferredProfile,
  selectedNiche: string,
  selectedGoal: string,
  selectedSubtopics?: string[],
  qualityDiscernmentScore?: number
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_profiles')
    .upsert(
      {
        user_id: userId,
        niche_affinity: rawScores.nicheAffinity,
        cal_hook_style_preference: rawScores.hookStylePreference,
        cal_tone_match: rawScores.toneMatch,
        audience_pain_alignment: rawScores.audiencePainAlignment,
        editing_style_fit: rawScores.editingStyleFit,
        content_format_preference: rawScores.contentFormatPreference,
        inferred_niche: inferredProfile.inferredNiche,
        inferred_audience_age_range: inferredProfile.inferredAudience.ageRange,
        inferred_audience_description: inferredProfile.inferredAudience.description,
        inferred_content_style: inferredProfile.inferredContentStyle,
        inferred_competitors: inferredProfile.inferredCompetitors,
        offer: inferredProfile.inferredOffer,
        exclusions: inferredProfile.inferredExclusions,
        selected_niche: selectedNiche,
        selected_goal: selectedGoal,
        selected_subtopics: selectedSubtopics ?? null,
        quality_discernment_score: qualityDiscernmentScore ?? null,
      },
      { onConflict: 'user_id' }
    );

  return { error: error?.message ?? null };
}

export async function loadCalibrationProfile(
  userId: string
): Promise<SavedCalibrationProfile | null> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('onboarding_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;

  return {
    rawScores: {
      nicheAffinity: data.niche_affinity ?? {},
      hookStylePreference: data.cal_hook_style_preference ?? {},
      toneMatch: data.cal_tone_match ?? {},
      audiencePainAlignment: data.audience_pain_alignment ?? {},
      editingStyleFit: data.editing_style_fit ?? {},
      contentFormatPreference: data.content_format_preference ?? {},
    },
    inferredProfile: {
      inferredNiche: data.inferred_niche,
      inferredAudience: {
        ageRange: data.inferred_audience_age_range,
        description: data.inferred_audience_description,
      },
      inferredContentStyle: data.inferred_content_style,
      inferredCompetitors: data.inferred_competitors ?? [],
      inferredOffer: data.offer ?? null,
      inferredExclusions: data.exclusions ?? [],
    },
    selectedNiche: data.selected_niche ?? '',
    selectedGoal: data.selected_goal ?? '',
    selectedSubtopics: data.selected_subtopics ?? [],
    audienceLocation: data.audience_location ?? null,
    audienceOccupation: data.audience_occupation ?? null,
    qualityDiscernmentScore: data.quality_discernment_score ?? null,
    updatedAt: data.updated_at,
  };
}

export async function saveCreatorStage(
  userId: string,
  stagingResult: StagingResult
): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_profiles')
    .update({
      creator_stage: stagingResult.stage,
      dimension_scores: stagingResult.dimensions,
      staged_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return { error: error?.message ?? null };
}
