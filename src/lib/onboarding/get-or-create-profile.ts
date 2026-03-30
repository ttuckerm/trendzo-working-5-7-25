import { getSupabaseClient } from '@/lib/supabase/client';

export interface OnboardingProfile {
  id: string;
  user_id: string;
  agency_id: string | null;
  onboarding_step: string;
  onboarding_completed_at: string | null;
  account_type: string | null;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

/**
 * Given an authenticated user_id, either:
 * 1. Find their existing onboarding_profiles record and return it
 *    (so the UI can resume at onboarding_step)
 * 2. Create a new one with onboarding_step: 'entry' and return it
 *
 * user_id is REQUIRED — onboarding requires authentication.
 * Called on mount of the onboarding flow.
 * Uses client-side Supabase — safe to call from 'use client' components.
 */
export async function getOrCreateProfile(
  userId: string
): Promise<{ profile: OnboardingProfile | null; error: string | null }> {
  if (!userId) {
    return { profile: null, error: 'Authentication required — user_id must be provided' };
  }

  const supabase = getSupabaseClient();

  // Try to find their existing profile by user_id
  const { data: existing, error: fetchError } = await supabase
    .from('onboarding_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (fetchError) {
    return { profile: null, error: fetchError.message };
  }

  if (existing) {
    return { profile: existing as OnboardingProfile, error: null };
  }

  // No existing profile found — create a new one
  const { data: created, error: createError } = await supabase
    .from('onboarding_profiles')
    .insert({
      user_id: userId,
      onboarding_step: 'entry',
    })
    .select('*')
    .single();

  if (createError) {
    return { profile: null, error: createError.message };
  }

  return { profile: created as OnboardingProfile, error: null };
}
