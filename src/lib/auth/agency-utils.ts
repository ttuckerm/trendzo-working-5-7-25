import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env'

/**
 * Get all creator user_ids associated with an agency.
 * Uses service role to bypass RLS — for server-side use only.
 */
export async function getAgencyCreators(agencyId: string): Promise<string[]> {
  if (!agencyId) return []

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await serviceClient
    .from('agency_members')
    .select('user_id')
    .eq('agency_id', agencyId)
    .eq('is_active', true)

  if (error) {
    console.error('[agency-utils] Error fetching agency creators:', error)
    return []
  }

  return (data || []).map((row: any) => row.user_id)
}

/**
 * Get the agency_id for a given user, if they belong to one.
 * Returns null if the user is not in any agency.
 */
export async function getUserAgencyId(userId: string): Promise<string | null> {
  if (!userId) return null

  const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  const { data, error } = await serviceClient
    .from('agency_members')
    .select('agency_id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  return data.agency_id
}
