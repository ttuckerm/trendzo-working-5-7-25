// =============================================
// CLEANCOPY PERMISSION COMPONENTS
// React components for permission-based rendering
// =============================================

'use client';

import React, { ReactNode, ComponentType } from 'react';
import { 
  useHasPermission, 
  useCanAccessResource, 
  usePermissions,
  useCRUDPermissions,
  useIsAdmin,
  useIsChairman,
} from './hooks';
import { Resource, Action, PermissionContext, ROLE_LABELS } from './index';
import { UserRole } from '@/types/admin';

// =============================================
// CORE PERMISSION COMPONENTS
// =============================================

interface RequirePermissionProps {
  resource: Resource;
  action: Action;
  context?: Partial<PermissionContext>;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user has the specified permission
 */
export function RequirePermission({
  resource,
  action,
  context,
  children,
  fallback = null,
}: RequirePermissionProps) {
  const hasPermission = useHasPermission(resource, action, context);
  
  if (!hasPermission) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface PermissionGateProps {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user can access the resource
 */
export function PermissionGate({
  resource,
  children,
  fallback = null,
}: PermissionGateProps) {
  const canAccess = useCanAccessResource(resource);
  
  if (!canAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface PermissionSwitchProps {
  resource: Resource;
  action: Action;
  context?: Partial<PermissionContext>;
  allowed: ReactNode;
  denied: ReactNode;
}

/**
 * Renders different content based on permission
 */
export function PermissionSwitch({
  resource,
  action,
  context,
  allowed,
  denied,
}: PermissionSwitchProps) {
  const hasPermission = useHasPermission(resource, action, context);
  return <>{hasPermission ? allowed : denied}</>;
}

// =============================================
// ROLE-BASED COMPONENTS
// =============================================

interface RequireRoleProps {
  roles: UserRole | UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user has one of the specified roles
 */
export function RequireRole({
  roles,
  children,
  fallback = null,
}: RequireRoleProps) {
  const { role } = usePermissions();
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!role || !allowedRoles.includes(role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user is admin (chairman or sub_admin)
 */
export function RequireAdmin({
  children,
  fallback = null,
}: RequireAdminProps) {
  const isAdmin = useIsAdmin();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

interface RequireChairmanProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Only renders children if user is chairman
 */
export function RequireChairman({
  children,
  fallback = null,
}: RequireChairmanProps) {
  const isChairman = useIsChairman();
  
  if (!isChairman) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

// =============================================
// CRUD PERMISSION COMPONENTS
// =============================================

interface CRUDGateProps {
  resource: Resource;
  create?: ReactNode;
  read?: ReactNode;
  update?: ReactNode;
  delete?: ReactNode;
  children?: ReactNode;
}

/**
 * Renders different content based on CRUD permissions
 */
export function CRUDGate({
  resource,
  create,
  read,
  update,
  delete: deleteContent,
  children,
}: CRUDGateProps) {
  const { canCreate, canRead, canUpdate, canDelete } = useCRUDPermissions(resource);
  
  return (
    <>
      {canCreate && create}
      {canRead && read}
      {canUpdate && update}
      {canDelete && deleteContent}
      {children}
    </>
  );
}

interface CanCreateProps {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children if user can create the resource
 */
export function CanCreate({ resource, children, fallback = null }: CanCreateProps) {
  const { canCreate } = useCRUDPermissions(resource);
  return <>{canCreate ? children : fallback}</>;
}

interface CanReadProps {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children if user can read the resource
 */
export function CanRead({ resource, children, fallback = null }: CanReadProps) {
  const { canRead } = useCRUDPermissions(resource);
  return <>{canRead ? children : fallback}</>;
}

interface CanUpdateProps {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children if user can update the resource
 */
export function CanUpdate({ resource, children, fallback = null }: CanUpdateProps) {
  const { canUpdate } = useCRUDPermissions(resource);
  return <>{canUpdate ? children : fallback}</>;
}

interface CanDeleteProps {
  resource: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Renders children if user can delete the resource
 */
export function CanDelete({ resource, children, fallback = null }: CanDeleteProps) {
  const { canDelete } = useCRUDPermissions(resource);
  return <>{canDelete ? children : fallback}</>;
}

// =============================================
// HOC (Higher-Order Components)
// =============================================

/**
 * HOC to wrap a component with permission requirement
 */
export function withPermission<P extends object>(
  WrappedComponent: ComponentType<P>,
  resource: Resource,
  action: Action,
  FallbackComponent?: ComponentType
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function WithPermissionWrapper(props: P) {
    const hasPermission = useHasPermission(resource, action);
    
    if (!hasPermission) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    
    return <WrappedComponent {...props} />;
  }
  
  WithPermissionWrapper.displayName = `WithPermission(${displayName})`;
  return WithPermissionWrapper;
}

/**
 * HOC to wrap a component with role requirement
 */
export function withRole<P extends object>(
  WrappedComponent: ComponentType<P>,
  allowedRoles: UserRole[],
  FallbackComponent?: ComponentType
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  
  function WithRoleWrapper(props: P) {
    const { role } = usePermissions();
    
    if (!role || !allowedRoles.includes(role)) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }
    
    return <WrappedComponent {...props} />;
  }
  
  WithRoleWrapper.displayName = `WithRole(${displayName})`;
  return WithRoleWrapper;
}

/**
 * HOC to wrap a component with admin requirement
 */
export function withAdmin<P extends object>(
  WrappedComponent: ComponentType<P>,
  FallbackComponent?: ComponentType
) {
  return withRole(WrappedComponent, ['chairman', 'sub_admin'], FallbackComponent);
}

// =============================================
// FALLBACK/ERROR COMPONENTS
// =============================================

interface UnauthorizedPageProps {
  title?: string;
  message?: string;
  showContactAdmin?: boolean;
  backHref?: string;
  backLabel?: string;
}

/**
 * Full page unauthorized message
 */
export function UnauthorizedPage({
  title = 'Access Denied',
  message = "You don't have permission to access this page.",
  showContactAdmin = true,
  backHref = '/',
  backLabel = 'Go Back',
}: UnauthorizedPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-500/10 border border-red-500/20 rounded-full p-6 mb-6">
        <svg 
          className="w-16 h-16 text-red-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1.5} 
            d="M12 15v.01M12 9v2m-7 8h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
          />
        </svg>
      </div>
      
      <h1 className="text-3xl font-bold text-white mb-3">{title}</h1>
      
      <p className="text-gray-400 max-w-md mb-6">
        {message}
        {showContactAdmin && (
          <> Contact your administrator if you believe this is an error.</>
        )}
      </p>
      
      <a
        href={backHref}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        {backLabel}
      </a>
    </div>
  );
}

interface PermissionDeniedProps {
  message?: string;
  className?: string;
}

/**
 * Inline permission denied message
 */
export function PermissionDenied({ 
  message = "You don't have permission to perform this action.",
  className = '',
}: PermissionDeniedProps) {
  return (
    <div className={`bg-red-500/10 border border-red-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <svg 
          className="w-5 h-5 text-red-400 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
          />
        </svg>
        <p className="text-red-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

interface PermissionWarningProps {
  message?: string;
  className?: string;
}

/**
 * Permission warning message (less severe than denied)
 */
export function PermissionWarning({ 
  message = "Some features may be restricted based on your permissions.",
  className = '',
}: PermissionWarningProps) {
  return (
    <div className={`bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-3">
        <svg 
          className="w-5 h-5 text-yellow-400 flex-shrink-0" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
        <p className="text-yellow-400 text-sm">{message}</p>
      </div>
    </div>
  );
}

// =============================================
// ROLE DISPLAY COMPONENTS
// =============================================

interface RoleBadgeProps {
  role: UserRole;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ROLE_COLORS: Record<UserRole, string> = {
  chairman: 'bg-red-500/20 text-red-400 border-red-500/30',
  sub_admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  agency: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  developer: 'bg-green-500/20 text-green-400 border-green-500/30',
  creator: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  clipper: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const ROLE_SIZES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
};

/**
 * Display a role as a styled badge
 */
export function RoleBadge({ role, size = 'md', className = '' }: RoleBadgeProps) {
  return (
    <span 
      className={`
        inline-flex items-center rounded-full border font-medium
        ${ROLE_COLORS[role]}
        ${ROLE_SIZES[size]}
        ${className}
      `}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

interface CurrentRoleDisplayProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Display the current user's role
 */
export function CurrentRoleDisplay({ 
  showLabel = true, 
  size = 'md',
  className = '',
}: CurrentRoleDisplayProps) {
  const { role } = usePermissions();
  
  if (!role) {
    return null;
  }
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showLabel && <span className="text-gray-500 text-sm">Role:</span>}
      <RoleBadge role={role} size={size} />
    </div>
  );
}

// =============================================
// PERMISSION DEBUG COMPONENT
// =============================================

interface PermissionDebugProps {
  resource?: Resource;
  showAll?: boolean;
}

/**
 * Debug component to display current user's permissions
 * Only visible in development mode
 */
export function PermissionDebug({ resource, showAll = false }: PermissionDebugProps) {
  const { role, accessibleResources, getResourceActions } = usePermissions();
  
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const resources = resource ? [resource] : (showAll ? accessibleResources : []);
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 border border-gray-700 rounded-lg p-4 max-w-sm text-xs font-mono z-50">
      <div className="text-gray-400 mb-2">Permission Debug</div>
      <div className="text-white mb-2">Role: {role || 'None'}</div>
      
      {resources.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-auto">
          {resources.map(r => (
            <div key={r} className="text-gray-300">
              <span className="text-blue-400">{r}:</span>{' '}
              {getResourceActions(r).join(', ')}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


























































































