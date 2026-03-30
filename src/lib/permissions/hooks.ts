// =============================================
// CLEANCOPY PERMISSION HOOKS
// React hooks for permission-based access control
// =============================================

'use client';

import { useMemo, useCallback } from 'react';
import { UserRole, Profile } from '@/types/admin';
import { 
  hasPermission, 
  checkPermission,
  canAccessResource, 
  getAccessibleResources,
  getResourceActions,
  filterNavigation,
  roleOutranks,
  canManageUser,
  Resource, 
  Action, 
  PermissionContext,
  PermissionCheckResult,
  NavItem,
  ROLE_HIERARCHY,
} from './index';

// =============================================
// ADMIN USER HOOK IMPORT
// =============================================

import { useAdminUserWithDevFallback } from '@/hooks/useAdminUser';

// =============================================
// MAIN PERMISSION HOOK
// =============================================

/**
 * Hook to access all permission utilities for current user
 */
export function usePermissions() {
  const adminUser = useAdminUserWithDevFallback();
  const { profile, role, isLoading, agencyId, developerId, isAdmin, isChairman } = adminUser;
  
  // Build user context for permission checks
  const userContext = useMemo((): PermissionContext => ({
    userId: profile?.id,
    userAgencyId: agencyId || (profile?.metadata?.agency_id as string),
    userDeveloperId: developerId || (profile?.metadata?.developer_id as string),
    delegatedPermissions: profile?.metadata?.delegated_permissions as string[] | undefined,
  }), [profile, agencyId, developerId]);
  
  /**
   * Check if user has permission for a specific action on a resource
   */
  const checkUserPermission = useCallback((
    resource: Resource,
    action: Action,
    context?: Partial<PermissionContext>
  ): boolean => {
    if (!role) return false;
    
    const fullContext: PermissionContext = {
      ...userContext,
      ...context,
    };
    
    return hasPermission(role, resource, action, fullContext);
  }, [role, userContext]);
  
  /**
   * Get detailed permission check result
   */
  const checkUserPermissionDetailed = useCallback((
    resource: Resource,
    action: Action,
    context?: Partial<PermissionContext>
  ): PermissionCheckResult => {
    if (!role) {
      return { allowed: false, reason: 'Not authenticated' };
    }
    
    const fullContext: PermissionContext = {
      ...userContext,
      ...context,
    };
    
    return checkPermission(role, resource, action, fullContext);
  }, [role, userContext]);
  
  /**
   * Check if user can access a resource at all
   */
  const checkResourceAccess = useCallback((resource: Resource): boolean => {
    if (!role) return false;
    return canAccessResource(role, resource);
  }, [role]);
  
  /**
   * Get all resources user can access
   */
  const accessibleResources = useMemo(() => {
    if (!role) return [];
    return getAccessibleResources(role);
  }, [role]);
  
  /**
   * Get actions user can perform on a resource
   */
  const getActionsForResource = useCallback((resource: Resource): Action[] => {
    if (!role) return [];
    return getResourceActions(role, resource);
  }, [role]);
  
  /**
   * Filter navigation based on user permissions
   */
  const filterNav = useCallback((navItems: NavItem[]): NavItem[] => {
    if (!role) return [];
    return filterNavigation(role, navItems);
  }, [role]);
  
  /**
   * Check if current user outranks another role
   */
  const outranksRole = useCallback((targetRole: UserRole): boolean => {
    if (!role) return false;
    return roleOutranks(role, targetRole);
  }, [role]);
  
  /**
   * Check if current user can manage another user
   */
  const canManage = useCallback((targetRole: UserRole): boolean => {
    if (!role) return false;
    return canManageUser(role, targetRole);
  }, [role]);
  
  // isAdmin and isChairman come from useAdminUser now
  
  /**
   * Get user's role level
   */
  const roleLevel = useMemo(() => {
    if (!role) return 0;
    return ROLE_HIERARCHY[role];
  }, [role]);
  
  return {
    // User info
    profile,
    role,
    isLoading,
    isAdmin,
    isChairman,
    roleLevel,
    userContext,
    
    // Permission checks
    hasPermission: checkUserPermission,
    checkPermission: checkUserPermissionDetailed,
    canAccessResource: checkResourceAccess,
    
    // Resource helpers
    accessibleResources,
    getResourceActions: getActionsForResource,
    
    // Navigation
    filterNavigation: filterNav,
    
    // Role comparisons
    outranksRole,
    canManageUser: canManage,
  };
}

// =============================================
// SINGLE-PURPOSE HOOKS
// =============================================

/**
 * Hook to check a single permission
 */
export function useHasPermission(
  resource: Resource,
  action: Action,
  context?: Partial<PermissionContext>
): boolean {
  const { hasPermission } = usePermissions();
  return useMemo(
    () => hasPermission(resource, action, context),
    [hasPermission, resource, action, context]
  );
}

/**
 * Hook to get detailed permission check
 */
export function usePermissionCheck(
  resource: Resource,
  action: Action,
  context?: Partial<PermissionContext>
): PermissionCheckResult {
  const { checkPermission } = usePermissions();
  return useMemo(
    () => checkPermission(resource, action, context),
    [checkPermission, resource, action, context]
  );
}

/**
 * Hook to check if user can access a resource
 */
export function useCanAccessResource(resource: Resource): boolean {
  const { canAccessResource } = usePermissions();
  return useMemo(
    () => canAccessResource(resource),
    [canAccessResource, resource]
  );
}

/**
 * Hook to get available actions for a resource
 */
export function useResourceActions(resource: Resource): Action[] {
  const { getResourceActions } = usePermissions();
  return useMemo(
    () => getResourceActions(resource),
    [getResourceActions, resource]
  );
}

/**
 * Hook to get filtered navigation
 */
export function useFilteredNavigation(navItems: NavItem[]): NavItem[] {
  const { filterNavigation } = usePermissions();
  return useMemo(
    () => filterNavigation(navItems),
    [filterNavigation, navItems]
  );
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin(): boolean {
  const { isAdmin } = usePermissions();
  return isAdmin;
}

/**
 * Hook to check if user is chairman
 */
export function useIsChairman(): boolean {
  const { isChairman } = usePermissions();
  return isChairman;
}

/**
 * Hook to check if user outranks a role
 */
export function useOutranksRole(targetRole: UserRole): boolean {
  const { outranksRole } = usePermissions();
  return useMemo(
    () => outranksRole(targetRole),
    [outranksRole, targetRole]
  );
}

/**
 * Hook to check if user can manage a role
 */
export function useCanManageRole(targetRole: UserRole): boolean {
  const { canManageUser } = usePermissions();
  return useMemo(
    () => canManageUser(targetRole),
    [canManageUser, targetRole]
  );
}

// =============================================
// PERMISSION QUERY HOOKS
// =============================================

/**
 * Hook that returns all CRUD permissions for a resource
 */
export function useCRUDPermissions(resource: Resource) {
  const { hasPermission } = usePermissions();
  
  return useMemo(() => ({
    canCreate: hasPermission(resource, 'create'),
    canRead: hasPermission(resource, 'read'),
    canUpdate: hasPermission(resource, 'update'),
    canDelete: hasPermission(resource, 'delete'),
  }), [hasPermission, resource]);
}

/**
 * Hook that returns all permissions for a resource
 */
export function useAllResourcePermissions(resource: Resource) {
  const { hasPermission, getResourceActions } = usePermissions();
  const actions = getResourceActions(resource);
  
  return useMemo(() => {
    const permissions: Record<string, boolean> = {};
    actions.forEach(action => {
      permissions[`can${action.charAt(0).toUpperCase()}${action.slice(1)}`] = 
        hasPermission(resource, action);
    });
    return permissions;
  }, [hasPermission, actions, resource]);
}

// =============================================
// MULTI-PERMISSION HOOKS
// =============================================

/**
 * Hook to check multiple permissions at once
 */
export function useMultiplePermissions(
  checks: Array<{ resource: Resource; action: Action; context?: Partial<PermissionContext> }>
): boolean[] {
  const { hasPermission } = usePermissions();
  
  return useMemo(
    () => checks.map(check => hasPermission(check.resource, check.action, check.context)),
    [hasPermission, checks]
  );
}

/**
 * Hook to check if user has ALL of the specified permissions
 */
export function useHasAllPermissions(
  checks: Array<{ resource: Resource; action: Action }>
): boolean {
  const results = useMultiplePermissions(checks);
  return useMemo(() => results.every(r => r), [results]);
}

/**
 * Hook to check if user has ANY of the specified permissions
 */
export function useHasAnyPermission(
  checks: Array<{ resource: Resource; action: Action }>
): boolean {
  const results = useMultiplePermissions(checks);
  return useMemo(() => results.some(r => r), [results]);
}

