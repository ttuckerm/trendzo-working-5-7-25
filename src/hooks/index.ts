// =============================================
// CLEANCOPY HOOKS
// Central export for all hooks
// =============================================

// Admin User & Auth
export { useAdminUser, useMockAdminUser, useAdminUserWithDevFallback } from './useAdminUser';
export { useImpersonation } from './useImpersonation';

// Supabase Data Hooks
export {
  useAgencies,
  useAgency,
  useAgenciesWithStats,
  useAgencyMutations,
} from './useAgencies';

export {
  useCreators,
  useCreator,
  usePendingCreators,
  useAgencyCreators,
  useCreatorMutations,
} from './useCreators';

export {
  useCampaigns,
  useCampaign,
  usePlatformCampaigns,
  useContentCampaigns,
  useAppCampaigns,
  useActiveCampaigns,
  useCampaignWithStats,
  useCampaignMutations,
} from './useCampaigns';

export {
  useMiniApps,
  useMiniApp,
  useFeaturedMiniApps,
  usePendingMiniApps,
  useDeveloperApps,
  useMiniAppCategories,
  useMiniAppMutations,
} from './useMiniApps';

export {
  usePayouts,
  usePayout,
  usePendingPayouts,
  usePayoutStats,
  usePayoutMutations,
} from './usePayouts';

export {
  useNotifications,
  useUnreadNotificationCount,
} from './useNotifications';

export {
  useAuditLog,
  useResourceAuditLog,
  useUserAuditLog,
  useAuditLogActions,
  useAuditLogResourceTypes,
  useAuditLogExport,
} from './useAuditLog';

export {
  useChairmanDashboardStats,
  useAgencyDashboardStats,
  useDeveloperDashboardStats,
  useClipperDashboardStats,
} from './useDashboardStats';

// Operations Center Hooks
export {
  useModelMetrics,
  useTrainingData,
  useTrainingJobs,
  useSystemHealth,
  useOperationsAlerts,
  useExperiments,
  useOperationsDashboard,
} from './useOperations';

// Re-export types
export type { Profile, UserRole } from '@/types/admin';

// Re-export filter types
export type { AgencyFilters } from './useAgencies';
export type { CreatorFilters } from './useCreators';
export type { CampaignFilters } from './useCampaigns';
export type { MiniAppFilters } from './useMiniApps';
export type { PayoutFilters } from './usePayouts';
export type { NotificationFilters } from './useNotifications';
export type { AuditLogFilters } from './useAuditLog';
export type { TrainingDataFilters, OperationsDashboardStats } from './useOperations';


