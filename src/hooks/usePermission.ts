'use client'

import { useAuth } from '@/hooks/useAuth'
import { canAccess, FeatureAction } from '@/lib/auth/permissions'
import { UserRole } from '@/types/admin'

/**
 * Check if the current user has access to a feature-level action.
 * Uses the centralized canAccess() gate from permissions.ts.
 */
export function usePermission(action: FeatureAction): boolean {
  const { role } = useAuth()
  if (!role) return false
  return canAccess(role as UserRole, action)
}
