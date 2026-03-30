// =============================================
// SUPABASE DATABASE TYPES
// Type definitions for all database tables
// =============================================

// Re-export all admin types for convenience
export * from '@/types/admin';

// Additional Supabase-specific types for database operations
import type {
  Profile,
  Agency,
  Creator,
  Developer,
  Clipper,
  Campaign,
  MiniApp,
  Payout,
  AuditLogEntry,
  Notification,
  FeatureToggle,
  UsageQuota,
  MiniAppInstall,
  MiniAppReview,
  CampaignParticipation,
  AffiliateReferral,
  EarningsLedger,
  AgencyMember,
  SubAdmin,
  AgencyTierDefinition,
  AffiliateTierConfig,
  CampaignInvite,
  ActivityFeedItem,
  AgencyFeatureOverride,
  UserRole,
  AgencyTier,
  CreatorVerification,
  CampaignType,
  CampaignStatus,
  PayoutStatus,
  AppApprovalStatus,
  AffiliateTier,
} from '@/types/admin';

// =============================================
// DATABASE TABLE TYPES (Row types)
// =============================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>;
      };
      agencies: {
        Row: Agency;
        Insert: Omit<Agency, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Agency, 'id' | 'created_at'>>;
      };
      creators: {
        Row: Creator;
        Insert: Omit<Creator, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Creator, 'id' | 'created_at'>>;
      };
      developers: {
        Row: Developer;
        Insert: Omit<Developer, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Developer, 'id' | 'created_at'>>;
      };
      clippers: {
        Row: Clipper;
        Insert: Omit<Clipper, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Clipper, 'id' | 'created_at'>>;
      };
      campaigns: {
        Row: Campaign;
        Insert: Omit<Campaign, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Campaign, 'id' | 'created_at'>>;
      };
      mini_apps: {
        Row: MiniApp;
        Insert: Omit<MiniApp, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<MiniApp, 'id' | 'created_at'>>;
      };
      payouts: {
        Row: Payout;
        Insert: Omit<Payout, 'id'> & { id?: string };
        Update: Partial<Omit<Payout, 'id'>>;
      };
      audit_log: {
        Row: AuditLogEntry;
        Insert: Omit<AuditLogEntry, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never; // Audit logs should not be updated
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Pick<Notification, 'is_read' | 'read_at'>>;
      };
      feature_toggles: {
        Row: FeatureToggle;
        Insert: Omit<FeatureToggle, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<FeatureToggle, 'id' | 'created_at'>>;
      };
      usage_quotas: {
        Row: UsageQuota;
        Insert: Omit<UsageQuota, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UsageQuota, 'id' | 'created_at'>>;
      };
      mini_app_installs: {
        Row: MiniAppInstall;
        Insert: Omit<MiniAppInstall, 'id' | 'installed_at'> & {
          id?: string;
          installed_at?: string;
        };
        Update: Partial<Omit<MiniAppInstall, 'id' | 'installed_at'>>;
      };
      mini_app_reviews: {
        Row: MiniAppReview;
        Insert: Omit<MiniAppReview, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<MiniAppReview, 'id' | 'created_at'>>;
      };
      campaign_participations: {
        Row: CampaignParticipation;
        Insert: Omit<CampaignParticipation, 'id' | 'joined_at'> & {
          id?: string;
          joined_at?: string;
        };
        Update: Partial<Omit<CampaignParticipation, 'id' | 'joined_at'>>;
      };
      affiliate_referrals: {
        Row: AffiliateReferral;
        Insert: Omit<AffiliateReferral, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AffiliateReferral, 'id' | 'created_at'>>;
      };
      earnings_ledger: {
        Row: EarningsLedger;
        Insert: Omit<EarningsLedger, 'id'> & { id?: string };
        Update: Partial<Omit<EarningsLedger, 'id'>>;
      };
      agency_members: {
        Row: AgencyMember;
        Insert: Omit<AgencyMember, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<AgencyMember, 'id' | 'created_at'>>;
      };
      sub_admins: {
        Row: SubAdmin;
        Insert: Omit<SubAdmin, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SubAdmin, 'id' | 'created_at'>>;
      };
      activity_feed: {
        Row: ActivityFeedItem;
        Insert: Omit<ActivityFeedItem, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: never; // Activity feed items should not be updated
      };
    };
    Views: {
      // Add any database views here
    };
    Functions: {
      // Add any database functions here
    };
    Enums: {
      user_role: UserRole;
      agency_tier: AgencyTier;
      creator_verification: CreatorVerification;
      campaign_type: CampaignType;
      campaign_status: CampaignStatus;
      payout_status: PayoutStatus;
      app_approval_status: AppApprovalStatus;
      affiliate_tier: AffiliateTier;
    };
  };
}

// =============================================
// WEBHOOK TYPES
// =============================================

export interface Webhook {
  id: string;
  agency_id: string | null;
  developer_id: string | null;
  name: string;
  url: string;
  secret: string | null;
  events: string[];
  is_active: boolean;
  failure_count: number;
  last_triggered_at: string | null;
  last_success_at: string | null;
  last_failure_at: string | null;
  last_failure_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  response_status: number | null;
  response_body: string | null;
  duration_ms: number | null;
  success: boolean;
  error_message: string | null;
  retry_count: number;
  created_at: string;
}

// =============================================
// API KEY TYPES
// =============================================

export interface ApiKey {
  id: string;
  agency_id: string | null;
  developer_id: string | null;
  name: string;
  key_prefix: string; // First 8 chars of the key
  key_hash: string;
  scopes: string[];
  rate_limit: number; // requests per minute
  is_active: boolean;
  last_used_at: string | null;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  revoked_at: string | null;
  revoked_by: string | null;
}

// =============================================
// QUERY RESPONSE TYPES
// =============================================

export interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

export interface QueryArrayResult<T> {
  data: T[];
  error: Error | null;
  count: number | null;
}

export interface MutationResult<T> {
  data: T | null;
  error: Error | null;
}

// =============================================
// REAL-TIME SUBSCRIPTION TYPES
// =============================================

export type RealtimeEvent = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

export interface RealtimePayload<T> {
  eventType: RealtimeEvent;
  new: T | null;
  old: T | null;
  errors: string[] | null;
}

export interface SubscriptionOptions {
  event?: RealtimeEvent;
  schema?: string;
  table: string;
  filter?: string;
}

// =============================================
// STATS & AGGREGATION TYPES
// =============================================

export interface PayoutStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalFailed: number;
  pendingAmountCents: number;
  processingAmountCents: number;
  completedThisMonthCents: number;
  completedAllTimeCents: number;
}

export interface DashboardStats {
  // Agencies
  totalAgencies: number;
  agenciesByTier: Record<AgencyTier, number>;
  newAgenciesThisMonth: number;
  
  // Creators
  totalCreators: number;
  verifiedCreators: number;
  pendingVerification: number;
  
  // Campaigns
  activeCampaigns: number;
  totalCampaignBudgetCents: number;
  totalCampaignSpentCents: number;
  
  // Mini Apps
  totalMiniApps: number;
  pendingApproval: number;
  featuredApps: number;
  
  // Revenue
  mrrCents: number;
  arrCents: number;
  revenueGrowthPercent: number;
  
  // Payouts
  pendingPayoutsCount: number;
  pendingPayoutsAmountCents: number;
  
  // Activity
  newUsersToday: number;
  newUsersThisWeek: number;
}

export interface CampaignStats {
  totalViews: number;
  totalParticipants: number;
  totalClips: number;
  totalSpentCents: number;
  avgClipPerformance: number;
  roi: number;
}

export interface MiniAppStats {
  totalInstalls: number;
  activeInstalls: number;
  monthlyRevenueCents: number;
  avgRating: number;
  reviewCount: number;
}

























































































