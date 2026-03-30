import { getSupabaseClient } from '@/lib/supabase/client';

/**
 * Given an onboarding_profile id, the authenticated user_id, a step name,
 * and a data payload:
 * 1. Update the onboarding_profiles record with the new data
 * 2. Set onboarding_step to the provided step name
 * 3. Set updated_at to now()
 *
 * Scoped by BOTH profileId AND userId to prevent cross-user updates.
 * Called at the end of every onboarding step.
 * Uses client-side Supabase — safe to call from 'use client' components.
 */
export async function updateProfileStep(
  profileId: string,
  userId: string,
  step: string,
  data: Record<string, unknown>
): Promise<{ error: string | null }> {
  if (!userId) {
    return { error: 'Authentication required — userId must be provided' };
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('onboarding_profiles')
    .update({
      ...data,
      onboarding_step: step,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profileId)
    .eq('user_id', userId);

  if (error) {
    return { error: error.message };
  }

  return { error: null };
}
