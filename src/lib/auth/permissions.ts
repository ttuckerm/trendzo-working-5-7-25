// =============================================
// CENTRALIZED PERMISSION GATE
// Feature-level access control — complements the resource-level RBAC in /lib/permissions
// This is the gate Atlas will use for automated actions.
// =============================================

import { UserRole } from '@/types/admin'

/**
 * Feature-level actions that can be checked with canAccess().
 * These map to high-level capabilities, not CRUD on individual resources.
 */
export type FeatureAction =
  | 'view_all_agencies' | 'view_own_agency' | 'view_own_profile'
  | 'manage_creators' | 'manage_briefs' | 'manage_events'
  | 'view_predictions' | 'view_model_internals' | 'view_platform_economics'
  | 'use_clay' | 'use_agent_cards' | 'use_batch_briefs'
  | 'view_reports' | 'export_data'
  | 'admin_users' | 'admin_settings' | 'admin_billing'

/**
 * Feature-level permission matrix.
 * Chairman gets everything; other roles get subsets.
 */
const ROLE_FEATURE_PERMISSIONS: Record<UserRole, FeatureAction[]> = {
  chairman: [
    'view_all_agencies', 'view_own_agency', 'view_own_profile',
    'manage_creators', 'manage_briefs', 'manage_events',
    'view_predictions', 'view_model_internals', 'view_platform_economics',
    'use_clay', 'use_agent_cards', 'use_batch_briefs',
    'view_reports', 'export_data',
    'admin_users', 'admin_settings', 'admin_billing',
  ],
  sub_admin: [
    'view_own_agency', 'view_own_profile',
    'manage_creators', 'manage_briefs', 'manage_events',
    'view_predictions', 'use_clay', 'use_agent_cards',
    'view_reports',
  ],
  agency: [
    'view_own_agency', 'view_own_profile',
    'manage_creators', 'manage_briefs', 'manage_events',
    'view_predictions', 'use_clay', 'use_agent_cards',
    'view_reports', 'export_data',
  ],
  developer: [
    'view_own_profile',
    'view_predictions',
    'view_reports',
  ],
  creator: [
    'view_own_profile',
    'view_predictions',
  ],
  clipper: [
    'view_own_profile',
  ],
}

/**
 * Check if a role has access to a feature-level action.
 * This is the single gate Atlas and API routes use.
 */
export function canAccess(role: UserRole, action: FeatureAction): boolean {
  return ROLE_FEATURE_PERMISSIONS[role]?.includes(action) ?? false
}

/**
 * Check feature access with optional resource ownership.
 * Chairman bypasses ownership checks; creator can only access own resources.
 */
export function canAccessResource(
  role: UserRole,
  action: FeatureAction,
  resourceOwnerId?: string,
  userId?: string
): boolean {
  if (!canAccess(role, action)) return false
  if (role === 'chairman') return true
  if (resourceOwnerId && userId && resourceOwnerId !== userId) {
    if (role === 'creator' || role === 'clipper') return false
  }
  return true
}

export { ROLE_FEATURE_PERMISSIONS }
