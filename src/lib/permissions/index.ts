// =============================================
// CLEANCOPY PERMISSION SYSTEM
// Comprehensive RBAC for multi-tenant admin
// =============================================

import { UserRole } from '@/types/admin';

// =============================================
// RESOURCES - All controllable resources in the system
// =============================================

export const RESOURCES = {
  // Organization
  SUB_ADMINS: 'sub_admins',
  AGENCIES: 'agencies',
  AGENCY_MEMBERS: 'agency_members',
  CREATORS: 'creators',
  DEVELOPERS: 'developers',
  CLIPPERS: 'clippers',
  INDEPENDENT_CREATORS: 'independent_creators',
  PROFILES: 'profiles',
  
  // Config
  FEATURE_TOGGLES: 'feature_toggles',
  TIERS: 'tiers',
  WHITE_LABEL: 'white_label',
  QUOTAS: 'quotas',
  SETTINGS: 'settings',
  
  // Rewards
  PLATFORM_CAMPAIGNS: 'platform_campaigns',
  CONTENT_CAMPAIGNS: 'content_campaigns',
  APP_CAMPAIGNS: 'app_campaigns',
  CAMPAIGN_PARTICIPATIONS: 'campaign_participations',
  CAMPAIGN_INVITES: 'campaign_invites',
  MINI_APPS: 'mini_apps',
  MINI_APP_STORE: 'mini_app_store',
  MINI_APP_INSTALLS: 'mini_app_installs',
  MINI_APP_REVIEWS: 'mini_app_reviews',
  AFFILIATE: 'affiliate',
  PAYOUTS: 'payouts',
  EARNINGS: 'earnings',
  
  // System
  CONTROL_CENTER: 'control_center',
  ML_LAB: 'ml_lab',
  CALIBRATION: 'calibration',
  AUDIT_LOG: 'audit_log',
  ACTIVITY_FEED: 'activity_feed',
  API_MANAGEMENT: 'api_management',
  WEBHOOKS: 'webhooks',
  NOTIFICATIONS: 'notifications',
  
  // Analytics & Tools
  DASHBOARD: 'dashboard',
  ANALYTICS: 'analytics',
  REPORTS: 'reports',
  SCRAPING: 'scraping',
  BULK_DOWNLOAD: 'bulk_download',
  TRAINING_DATA: 'training_data',
  ALGORITHM_IQ: 'algorithm_iq',
  VIRAL_STUDIO: 'viral_studio',
  BLOOMBERG: 'bloomberg',
} as const;

export type Resource = typeof RESOURCES[keyof typeof RESOURCES];

// =============================================
// ACTIONS - All possible actions on resources
// =============================================

export const ACTIONS = {
  // CRUD
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  
  // Special
  MANAGE: 'manage',           // Full control (includes all CRUD)
  IMPERSONATE: 'impersonate', // Act as another user
  APPROVE: 'approve',         // Approve pending items
  REJECT: 'reject',           // Reject pending items
  SUSPEND: 'suspend',         // Suspend accounts
  VERIFY: 'verify',           // Verify creators/developers
  FEATURE: 'feature',         // Feature items (mini apps, creators)
  EXPORT: 'export',           // Export data
  IMPORT: 'import',           // Import data
  
  // Campaign specific
  JOIN: 'join',               // Join campaigns
  LEAVE: 'leave',             // Leave campaigns
  INVITE: 'invite',           // Invite to campaigns
  
  // Payout specific
  WITHDRAW: 'withdraw',       // Request withdrawal
  PROCESS: 'process',         // Process payouts
  
  // System
  CONFIGURE: 'configure',     // Change configuration
  RUN: 'run',                 // Run processes (ML, calibration)
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// =============================================
// ROLE HIERARCHY - Higher number = more permissions
// =============================================

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  chairman: 100,
  sub_admin: 80,
  agency: 60,
  developer: 50,
  creator: 40,
  clipper: 20,
};

export const ROLE_LABELS: Record<UserRole, string> = {
  chairman: 'Chairman',
  sub_admin: 'Sub Admin',
  agency: 'Agency',
  developer: 'Developer',
  creator: 'Creator',
  clipper: 'Clipper',
};

// =============================================
// PERMISSION MATRIX
// =============================================

// Permission values:
// - 'manage' = full CRUD + all special actions
// - 'scoped' = can only access their own data (ownership check required)
// - Action[] = specific list of allowed actions

type PermissionValue = Action[] | 'manage' | 'scoped';

export const PERMISSION_MATRIX: Record<UserRole, Partial<Record<Resource, PermissionValue>>> = {
  // =========================================
  // CHAIRMAN - Full system access
  // =========================================
  chairman: {
    // Organization
    [RESOURCES.SUB_ADMINS]: 'manage',
    [RESOURCES.AGENCIES]: ['manage', 'impersonate', 'suspend'],
    [RESOURCES.AGENCY_MEMBERS]: 'manage',
    [RESOURCES.CREATORS]: ['manage', 'impersonate', 'approve', 'verify', 'feature', 'suspend'],
    [RESOURCES.DEVELOPERS]: ['manage', 'verify', 'suspend'],
    [RESOURCES.CLIPPERS]: ['manage', 'suspend'],
    [RESOURCES.INDEPENDENT_CREATORS]: 'manage',
    [RESOURCES.PROFILES]: 'manage',
    
    // Config
    [RESOURCES.FEATURE_TOGGLES]: 'manage',
    [RESOURCES.TIERS]: 'manage',
    [RESOURCES.WHITE_LABEL]: 'manage',
    [RESOURCES.QUOTAS]: 'manage',
    [RESOURCES.SETTINGS]: 'manage',
    
    // Rewards
    [RESOURCES.PLATFORM_CAMPAIGNS]: 'manage',
    [RESOURCES.CONTENT_CAMPAIGNS]: 'manage',
    [RESOURCES.APP_CAMPAIGNS]: 'manage',
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: 'manage',
    [RESOURCES.CAMPAIGN_INVITES]: 'manage',
    [RESOURCES.MINI_APPS]: ['manage', 'approve', 'feature'],
    [RESOURCES.MINI_APP_STORE]: 'manage',
    [RESOURCES.MINI_APP_INSTALLS]: 'manage',
    [RESOURCES.MINI_APP_REVIEWS]: 'manage',
    [RESOURCES.AFFILIATE]: 'manage',
    [RESOURCES.PAYOUTS]: ['manage', 'process'],
    [RESOURCES.EARNINGS]: 'manage',
    
    // System
    [RESOURCES.CONTROL_CENTER]: 'manage',
    [RESOURCES.ML_LAB]: ['manage', 'run', 'configure'],
    [RESOURCES.CALIBRATION]: ['manage', 'run', 'configure'],
    [RESOURCES.AUDIT_LOG]: ['read', 'export'],
    [RESOURCES.ACTIVITY_FEED]: ['read'],
    [RESOURCES.API_MANAGEMENT]: 'manage',
    [RESOURCES.WEBHOOKS]: 'manage',
    [RESOURCES.NOTIFICATIONS]: 'manage',
    
    // Analytics & Tools
    [RESOURCES.DASHBOARD]: ['read'],
    [RESOURCES.ANALYTICS]: ['read', 'export'],
    [RESOURCES.REPORTS]: ['read', 'export', 'create'],
    [RESOURCES.SCRAPING]: 'manage',
    [RESOURCES.BULK_DOWNLOAD]: 'manage',
    [RESOURCES.TRAINING_DATA]: 'manage',
    [RESOURCES.ALGORITHM_IQ]: ['read', 'configure'],
    [RESOURCES.VIRAL_STUDIO]: 'manage',
    [RESOURCES.BLOOMBERG]: ['read'],
  },
  
  // =========================================
  // SUB_ADMIN - Delegated permissions (runtime check)
  // These are the MAXIMUM possible permissions
  // =========================================
  sub_admin: {
    // Organization (limited)
    [RESOURCES.AGENCIES]: ['read', 'update'],
    [RESOURCES.AGENCY_MEMBERS]: ['read'],
    [RESOURCES.CREATORS]: ['read', 'update', 'approve', 'verify'],
    [RESOURCES.DEVELOPERS]: ['read', 'verify'],
    [RESOURCES.CLIPPERS]: ['read', 'update'],
    [RESOURCES.PROFILES]: ['read'],
    
    // Config (read only)
    [RESOURCES.FEATURE_TOGGLES]: ['read', 'update'],
    [RESOURCES.QUOTAS]: ['read', 'update'],
    
    // Rewards (monitoring)
    [RESOURCES.PLATFORM_CAMPAIGNS]: ['read'],
    [RESOURCES.CONTENT_CAMPAIGNS]: ['read', 'update'],
    [RESOURCES.APP_CAMPAIGNS]: ['read'],
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: ['read'],
    [RESOURCES.MINI_APPS]: ['read', 'approve'],
    [RESOURCES.MINI_APP_STORE]: ['read'],
    [RESOURCES.PAYOUTS]: ['read', 'process'],
    [RESOURCES.EARNINGS]: ['read'],
    
    // System (limited)
    [RESOURCES.CONTROL_CENTER]: ['read'],
    [RESOURCES.AUDIT_LOG]: ['read'],
    [RESOURCES.ACTIVITY_FEED]: ['read'],
    
    // Analytics
    [RESOURCES.DASHBOARD]: ['read'],
    [RESOURCES.ANALYTICS]: ['read'],
    [RESOURCES.REPORTS]: ['read'],
    [RESOURCES.BLOOMBERG]: ['read'],
  },
  
  // =========================================
  // AGENCY - Manage their own creators/campaigns
  // =========================================
  agency: {
    // Organization (scoped to their agency)
    [RESOURCES.AGENCY_MEMBERS]: 'scoped',
    [RESOURCES.CREATORS]: 'scoped',
    [RESOURCES.PROFILES]: ['read', 'update'], // Own profile
    
    // Config (view + their overrides)
    [RESOURCES.FEATURE_TOGGLES]: ['read'],
    [RESOURCES.WHITE_LABEL]: 'scoped',
    [RESOURCES.QUOTAS]: ['read'],
    [RESOURCES.SETTINGS]: 'scoped',
    
    // Rewards
    [RESOURCES.CONTENT_CAMPAIGNS]: 'scoped',
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: ['read'],
    [RESOURCES.CAMPAIGN_INVITES]: 'scoped',
    [RESOURCES.MINI_APP_STORE]: ['read'],
    [RESOURCES.MINI_APP_INSTALLS]: 'scoped',
    [RESOURCES.AFFILIATE]: 'scoped',
    [RESOURCES.PAYOUTS]: ['read'],
    [RESOURCES.EARNINGS]: 'scoped',
    
    // System
    [RESOURCES.API_MANAGEMENT]: 'scoped',
    [RESOURCES.WEBHOOKS]: 'scoped',
    [RESOURCES.NOTIFICATIONS]: 'scoped',
    
    // Analytics
    [RESOURCES.DASHBOARD]: ['read'],
    [RESOURCES.ANALYTICS]: 'scoped',
    [RESOURCES.REPORTS]: ['read', 'create'],
    [RESOURCES.VIRAL_STUDIO]: ['read', 'create'],
  },
  
  // =========================================
  // DEVELOPER - Manage their apps/campaigns
  // =========================================
  developer: {
    // Organization
    [RESOURCES.PROFILES]: ['read', 'update'],
    
    // Rewards
    [RESOURCES.APP_CAMPAIGNS]: 'scoped',
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: ['read'],
    [RESOURCES.MINI_APPS]: 'scoped',
    [RESOURCES.MINI_APP_STORE]: ['read', 'create'],
    [RESOURCES.MINI_APP_REVIEWS]: ['read'],
    [RESOURCES.AFFILIATE]: 'scoped',
    [RESOURCES.PAYOUTS]: ['read', 'withdraw'],
    [RESOURCES.EARNINGS]: 'scoped',
    
    // System
    [RESOURCES.API_MANAGEMENT]: 'scoped',
    [RESOURCES.WEBHOOKS]: 'scoped',
    [RESOURCES.NOTIFICATIONS]: 'scoped',
    
    // Analytics
    [RESOURCES.DASHBOARD]: ['read'],
    [RESOURCES.ANALYTICS]: 'scoped',
  },
  
  // =========================================
  // CREATOR - View/join campaigns, manage profile
  // =========================================
  creator: {
    // Organization
    [RESOURCES.PROFILES]: ['read', 'update'],
    
    // Rewards
    [RESOURCES.PLATFORM_CAMPAIGNS]: ['read', 'join'],
    [RESOURCES.CONTENT_CAMPAIGNS]: ['read', 'join', 'create'],
    [RESOURCES.APP_CAMPAIGNS]: ['read'],
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: 'scoped',
    [RESOURCES.MINI_APP_STORE]: ['read'],
    [RESOURCES.MINI_APP_INSTALLS]: 'scoped',
    [RESOURCES.AFFILIATE]: 'scoped',
    [RESOURCES.PAYOUTS]: ['read'],
    [RESOURCES.EARNINGS]: 'scoped',
    
    // System
    [RESOURCES.NOTIFICATIONS]: 'scoped',
    
    // Analytics
    [RESOURCES.DASHBOARD]: ['read'],
    [RESOURCES.ANALYTICS]: 'scoped',
    [RESOURCES.VIRAL_STUDIO]: ['read'],
  },
  
  // =========================================
  // CLIPPER - Join campaigns, manage clips
  // =========================================
  clipper: {
    // Organization
    [RESOURCES.PROFILES]: ['read', 'update'],
    
    // Rewards
    [RESOURCES.PLATFORM_CAMPAIGNS]: ['read', 'join'],
    [RESOURCES.CONTENT_CAMPAIGNS]: ['read', 'join'],
    [RESOURCES.APP_CAMPAIGNS]: ['read', 'join'],
    [RESOURCES.CAMPAIGN_PARTICIPATIONS]: 'scoped',
    [RESOURCES.CAMPAIGN_INVITES]: ['read'],
    [RESOURCES.MINI_APP_STORE]: ['read'],
    [RESOURCES.AFFILIATE]: 'scoped',
    [RESOURCES.PAYOUTS]: ['read', 'withdraw'],
    [RESOURCES.EARNINGS]: 'scoped',
    
    // System
    [RESOURCES.NOTIFICATIONS]: 'scoped',
    
    // Analytics
    [RESOURCES.DASHBOARD]: ['read'],
  },
};

// =============================================
// HELPER TYPES
// =============================================

export interface PermissionContext {
  userId?: string;
  resourceOwnerId?: string;
  agencyId?: string;
  userAgencyId?: string;
  developerId?: string;
  userDeveloperId?: string;
  delegatedPermissions?: string[]; // For sub_admin
}

export interface Permission {
  resource: Resource;
  action: Action;
}

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
  requiresOwnershipCheck?: boolean;
}

// =============================================
// HELPER FUNCTIONS
// =============================================

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action,
  context?: PermissionContext
): boolean {
  const result = checkPermission(userRole, resource, action, context);
  return result.allowed;
}

/**
 * Detailed permission check with reasons
 */
export function checkPermission(
  userRole: UserRole,
  resource: Resource,
  action: Action,
  context?: PermissionContext
): PermissionCheckResult {
  const rolePermissions = PERMISSION_MATRIX[userRole];
  
  if (!rolePermissions) {
    return { allowed: false, reason: 'Unknown role' };
  }
  
  const resourcePermission = rolePermissions[resource];
  
  if (!resourcePermission) {
    return { allowed: false, reason: `Role ${userRole} cannot access ${resource}` };
  }
  
  // Handle 'manage' - full access
  if (resourcePermission === 'manage') {
    return { allowed: true };
  }
  
  // Handle 'scoped' - ownership check required
  if (resourcePermission === 'scoped') {
    // If no context, we assume the data layer will handle ownership
    if (!context) {
      return { allowed: true, requiresOwnershipCheck: true };
    }
    
    // Check ownership by user ID
    if (context.resourceOwnerId && context.userId) {
      if (context.resourceOwnerId !== context.userId) {
        return { allowed: false, reason: 'Not owner of resource' };
      }
    }
    
    // Check ownership by agency
    if (context.agencyId && context.userAgencyId) {
      if (context.agencyId !== context.userAgencyId) {
        return { allowed: false, reason: 'Resource belongs to different agency' };
      }
    }
    
    // Check ownership by developer
    if (context.developerId && context.userDeveloperId) {
      if (context.developerId !== context.userDeveloperId) {
        return { allowed: false, reason: 'Resource belongs to different developer' };
      }
    }
    
    return { allowed: true, requiresOwnershipCheck: true };
  }
  
  // Handle specific action array
  if (Array.isArray(resourcePermission)) {
    // 'manage' in array grants all CRUD actions
    if (resourcePermission.includes('manage' as Action)) {
      return { allowed: true };
    }
    
    if (resourcePermission.includes(action)) {
      return { allowed: true };
    }
    
    return { 
      allowed: false, 
      reason: `Action ${action} not allowed on ${resource} for role ${userRole}` 
    };
  }
  
  return { allowed: false, reason: 'Invalid permission configuration' };
}

/**
 * Check if user has ANY access to a resource
 */
export function canAccessResource(userRole: UserRole, resource: Resource): boolean {
  const rolePermissions = PERMISSION_MATRIX[userRole];
  return rolePermissions ? resource in rolePermissions : false;
}

/**
 * Get all resources a role can access
 */
export function getAccessibleResources(userRole: UserRole): Resource[] {
  const rolePermissions = PERMISSION_MATRIX[userRole];
  if (!rolePermissions) {
    return [];
  }
  return Object.keys(rolePermissions) as Resource[];
}

/**
 * Get all actions a role can perform on a resource
 */
export function getResourceActions(userRole: UserRole, resource: Resource): Action[] {
  const rolePermissions = PERMISSION_MATRIX[userRole];
  if (!rolePermissions) {
    return [];
  }
  
  const resourcePermission = rolePermissions[resource];
  
  if (!resourcePermission) {
    return [];
  }
  
  // Full access
  if (resourcePermission === 'manage') {
    return Object.values(ACTIONS);
  }
  
  // Scoped access = CRUD on own data
  if (resourcePermission === 'scoped') {
    return [ACTIONS.CREATE, ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.DELETE];
  }
  
  // Specific actions
  if (Array.isArray(resourcePermission)) {
    // Expand 'manage' if present
    if (resourcePermission.includes('manage' as Action)) {
      return Object.values(ACTIONS);
    }
    return [...resourcePermission];
  }
  
  return [];
}

/**
 * Check if one role outranks another
 */
export function roleOutranks(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
}

/**
 * Check if roles are equal in hierarchy
 */
export function rolesEqual(role1: UserRole, role2: UserRole): boolean {
  return ROLE_HIERARCHY[role1] === ROLE_HIERARCHY[role2];
}

/**
 * Get the highest role from a list
 */
export function getHighestRole(roles: UserRole[]): UserRole {
  return roles.reduce((highest, current) => 
    ROLE_HIERARCHY[current] > ROLE_HIERARCHY[highest] ? current : highest
  );
}

/**
 * Get all roles that a given role outranks
 */
export function getSubordinateRoles(role: UserRole): UserRole[] {
  const roleLevel = ROLE_HIERARCHY[role];
  return (Object.keys(ROLE_HIERARCHY) as UserRole[]).filter(
    r => ROLE_HIERARCHY[r] < roleLevel
  );
}

/**
 * Check if user can manage another user based on role hierarchy
 */
export function canManageUser(managerRole: UserRole, targetRole: UserRole): boolean {
  // Chairman can manage everyone
  if (managerRole === 'chairman') return true;
  
  // Sub-admin can manage agency and below
  if (managerRole === 'sub_admin') {
    return ROLE_HIERARCHY[targetRole] < ROLE_HIERARCHY['sub_admin'];
  }
  
  // Agency can manage creators within their agency
  if (managerRole === 'agency') {
    return targetRole === 'creator';
  }
  
  return false;
}

// =============================================
// NAVIGATION FILTERING
// =============================================

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  emoji?: string;
  roles?: UserRole[];           // Explicit role whitelist
  resource?: Resource;          // Required resource access
  action?: Action;              // Required action (default: 'read')
  children?: NavItem[];
  badge?: string | number;
  badgeColor?: string;
  divider?: boolean;            // Show divider before this item
  disabled?: boolean;
  external?: boolean;           // External link
}

/**
 * Filter navigation items based on user role and permissions
 */
export function filterNavigation(userRole: UserRole, navItems: NavItem[]): NavItem[] {
  return navItems
    .filter(item => {
      // Check explicit role whitelist
      if (item.roles && !item.roles.includes(userRole)) {
        return false;
      }
      
      // Check resource permission
      if (item.resource) {
        const action = item.action || ACTIONS.READ;
        if (!hasPermission(userRole, item.resource, action)) {
          return false;
        }
      }
      
      return true;
    })
    .map(item => ({
      ...item,
      children: item.children ? filterNavigation(userRole, item.children) : undefined,
    }))
    .filter(item => {
      // Remove parent items with no accessible children
      if (item.children !== undefined && item.children.length === 0) {
        return false;
      }
      return true;
    });
}

// =============================================
// PERMISSION PRESETS
// =============================================

export const PERMISSION_PRESETS = {
  // For creating sub-admins with common permission sets
  VIEWER: [
    RESOURCES.AGENCIES,
    RESOURCES.CREATORS,
    RESOURCES.CAMPAIGNS,
    RESOURCES.AUDIT_LOG,
    RESOURCES.DASHBOARD,
  ].map(r => ({ resource: r, actions: [ACTIONS.READ] })),
  
  MODERATOR: [
    { resource: RESOURCES.CREATORS, actions: [ACTIONS.READ, ACTIONS.UPDATE, ACTIONS.APPROVE] },
    { resource: RESOURCES.MINI_APPS, actions: [ACTIONS.READ, ACTIONS.APPROVE] },
    { resource: RESOURCES.AUDIT_LOG, actions: [ACTIONS.READ] },
    { resource: RESOURCES.ACTIVITY_FEED, actions: [ACTIONS.READ] },
  ],
  
  SUPPORT: [
    { resource: RESOURCES.AGENCIES, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.CREATORS, actions: [ACTIONS.READ, ACTIONS.UPDATE] },
    { resource: RESOURCES.PAYOUTS, actions: [ACTIONS.READ, ACTIONS.PROCESS] },
    { resource: RESOURCES.AUDIT_LOG, actions: [ACTIONS.READ] },
  ],
  
  FINANCE: [
    { resource: RESOURCES.PAYOUTS, actions: [ACTIONS.READ, ACTIONS.PROCESS] },
    { resource: RESOURCES.EARNINGS, actions: [ACTIONS.READ] },
    { resource: RESOURCES.ANALYTICS, actions: [ACTIONS.READ, ACTIONS.EXPORT] },
    { resource: RESOURCES.REPORTS, actions: [ACTIONS.READ, ACTIONS.CREATE, ACTIONS.EXPORT] },
  ],
};

// =============================================
// TYPE GUARDS
// =============================================

export function isValidRole(role: string): role is UserRole {
  return role in ROLE_HIERARCHY;
}

export function isValidResource(resource: string): resource is Resource {
  return Object.values(RESOURCES).includes(resource as Resource);
}

export function isValidAction(action: string): action is Action {
  return Object.values(ACTIONS).includes(action as Action);
}


























































































