/**
 * Per-Niche Model Router
 *
 * Looks up model_variants for an active variant matching the content's niche.
 * If found, returns the niche-specific model info.
 * If not found, falls back to the global model (niche IS NULL AND is_active = true).
 *
 * This is a simple lookup at the start of the prediction pipeline.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

export interface ModelRoute {
  variant_id: string
  model_version: string
  niche: string | null
  spearman_score: number | null
  is_niche_specific: boolean
}

// Cache to avoid repeated DB lookups within the same process
const routeCache = new Map<string, { route: ModelRoute; cachedAt: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Resolve which model variant to use for a given niche.
 *
 * 1. Check for active niche-specific variant
 * 2. Fall back to global variant (niche IS NULL)
 * 3. If no variants exist at all, return a default v10 route
 */
export async function resolveModelRoute(
  niche: string | null,
  db?: SupabaseClient,
): Promise<ModelRoute> {
  const cacheKey = niche || '__global__'
  const cached = routeCache.get(cacheKey)
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.route
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return defaultRoute()
  }

  const client = db || createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } })

  // Step 1: Try niche-specific variant
  if (niche) {
    const { data: nicheVariant } = await client
      .from('model_variants')
      .select('id, model_version, niche, spearman_score')
      .eq('niche', niche)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (nicheVariant) {
      const route: ModelRoute = {
        variant_id: nicheVariant.id,
        model_version: nicheVariant.model_version,
        niche: nicheVariant.niche,
        spearman_score: nicheVariant.spearman_score,
        is_niche_specific: true,
      }
      routeCache.set(cacheKey, { route, cachedAt: Date.now() })
      return route
    }
  }

  // Step 2: Fall back to global variant
  const { data: globalVariant } = await client
    .from('model_variants')
    .select('id, model_version, niche, spearman_score')
    .is('niche', null)
    .eq('is_active', true)
    .limit(1)
    .single()

  if (globalVariant) {
    const route: ModelRoute = {
      variant_id: globalVariant.id,
      model_version: globalVariant.model_version,
      niche: null,
      spearman_score: globalVariant.spearman_score,
      is_niche_specific: false,
    }
    routeCache.set(cacheKey, { route, cachedAt: Date.now() })
    return route
  }

  // Step 3: No variants at all — return default
  return defaultRoute()
}

function defaultRoute(): ModelRoute {
  return {
    variant_id: 'default',
    model_version: 'v10',
    niche: null,
    spearman_score: null,
    is_niche_specific: false,
  }
}

/**
 * Invalidate the route cache (call after promoting a model variant)
 */
export function invalidateRouteCache(): void {
  routeCache.clear()
}
