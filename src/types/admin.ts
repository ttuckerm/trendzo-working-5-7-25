// =============================================
// CLEANCOPY ADMIN TYPES
// Comprehensive TypeScript types for multi-tenant admin system
// =============================================

// =============================================
// ENUMS
// =============================================

export type UserRole = 'chairman' | 'sub_admin' | 'agency' | 'developer' | 'creator' | 'clipper';
export type AgencyTier = 'starter' | 'growth' | 'pro' | 'enterprise';
export type CreatorVerification = 'unverified' | 'pending' | 'verified' | 'featured';
export type CampaignType = 'platform' | 'content' | 'miniapp';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type AffiliateTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type AppApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type NotificationType = 'system' | 'campaign_invite' | 'payout_status' | 'miniapp_update' | 'achievement' | 'alert';
export type ActivitySeverity = 'info' | 'success' | 'warning' | 'error';
export type ActivityVisibility = 'public' | 'admin' | 'agency' | 'private';

// =============================================
// ROLE HIERARCHY (for permission checks)
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

export const ROLE_COLORS: Record<UserRole, string> = {
  chairman: '#DC2626',
  sub_admin: '#7C3AED',
  agency: '#2563EB',
  developer: '#059669',
  creator: '#D97706',
  clipper: '#6B7280',
};

// =============================================
// TIER CONFIGURATIONS
// =============================================

export const TIER_CONFIG: Record<AgencyTier, { 
  color: string; 
  label: string; 
  emoji: string;
  bgColor: string;
}> = {
  starter: { color: '#6B7280', label: 'Starter', emoji: '🌱', bgColor: 'bg-gray-500' },
  growth: { color: '#3B82F6', label: 'Growth', emoji: '🚀', bgColor: 'bg-blue-500' },
  pro: { color: '#FFD700', label: 'Pro', emoji: '⭐', bgColor: 'bg-yellow-500' },
  enterprise: { color: '#8B5CF6', label: 'Enterprise', emoji: '👑', bgColor: 'bg-purple-500' },
};

export const AFFILIATE_TIER_CONFIG: Record<AffiliateTier, { 
  color: string; 
  label: string; 
  emoji: string;
  commissionRate: number;
  minReferrals: number;
}> = {
  bronze: { color: '#CD7F32', label: 'Bronze', emoji: '🥉', commissionRate: 10, minReferrals: 0 },
  silver: { color: '#C0C0C0', label: 'Silver', emoji: '🥈', commissionRate: 15, minReferrals: 10 },
  gold: { color: '#FFD700', label: 'Gold', emoji: '🥇', commissionRate: 20, minReferrals: 50 },
  platinum: { color: '#E5E4E2', label: 'Platinum', emoji: '👑', commissionRate: 25, minReferrals: 200 },
  diamond: { color: '#B9F2FF', label: 'Diamond', emoji: '💎', commissionRate: 30, minReferrals: 500 },
};

export const VERIFICATION_CONFIG: Record<CreatorVerification, {
  color: string;
  label: string;
  icon: string;
}> = {
  unverified: { color: '#6B7280', label: 'Unverified', icon: '○' },
  pending: { color: '#F59E0B', label: 'Pending', icon: '◔' },
  verified: { color: '#10B981', label: 'Verified', icon: '✓' },
  featured: { color: '#8B5CF6', label: 'Featured', icon: '★' },
};

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, {
  color: string;
  label: string;
  bgColor: string;
}> = {
  draft: { color: '#6B7280', label: 'Draft', bgColor: 'bg-gray-500' },
  active: { color: '#10B981', label: 'Active', bgColor: 'bg-green-500' },
  paused: { color: '#F59E0B', label: 'Paused', bgColor: 'bg-yellow-500' },
  completed: { color: '#3B82F6', label: 'Completed', bgColor: 'bg-blue-500' },
  cancelled: { color: '#EF4444', label: 'Cancelled', bgColor: 'bg-red-500' },
};

export const PAYOUT_STATUS_CONFIG: Record<PayoutStatus, {
  color: string;
  label: string;
  icon: string;
}> = {
  pending: { color: '#F59E0B', label: 'Pending', icon: '⏳' },
  processing: { color: '#3B82F6', label: 'Processing', icon: '⚙️' },
  completed: { color: '#10B981', label: 'Completed', icon: '✓' },
  failed: { color: '#EF4444', label: 'Failed', icon: '✗' },
};

// =============================================
// DATABASE TYPES - Core Tables
// =============================================

export interface Profile {
  id: string;
  role: UserRole;
  display_name: string | null;
  avatar_url: string | null;
  email: string | null;
  phone: string | null;
  timezone: string;
  language: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
}

export interface SubAdmin {
  id: string;
  user_id: string;
  delegated_permissions: Permission[];
  agency_scope: string[] | null; // null = all agencies
  max_agencies: number | null;
  can_create_sub_admins: boolean;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: Profile;
  created_by_user?: Profile;
}

export interface AgencyTierDefinition {
  tier: AgencyTier;
  display_name: string;
  price_monthly: number; // in cents
  price_annual: number | null;
  max_creators: number;
  max_videos_per_month: number;
  max_api_calls_per_month: number;
  storage_gb: number;
  features: string[];
  color: string;
  badge_icon: string | null;
  description: string | null;
  is_popular: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Agency {
  id: string;
  name: string;
  slug: string;
  tier: AgencyTier;
  owner_id: string | null;
  logo_url: string | null;
  cover_url: string | null;
  website: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: Address | null;
  feature_overrides: Record<string, boolean>;
  white_label_config: WhiteLabelConfig | null;
  notification_settings: NotificationSettings;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_email: string | null;
  billing_cycle_start: string | null;
  is_active: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  // Joined
  owner?: Profile;
  tier_definition?: AgencyTierDefinition;
  members?: AgencyMember[];
}

export interface AgencyMember {
  id: string;
  agency_id: string;
  user_id: string;
  role: string;
  permissions: Permission[];
  invited_by: string | null;
  invited_at: string;
  accepted_at: string | null;
  is_active: boolean;
  created_at: string;
  // Joined
  user?: Profile;
  agency?: Agency;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

export interface WhiteLabelConfig {
  company_name: string;
  logo_url: string;
  logo_dark_url?: string;
  favicon_url: string;
  primary_color: string;
  secondary_color: string;
  accent_color?: string;
  dark_mode: boolean;
  custom_domain: string | null;
  ssl_status: 'pending' | 'active' | 'error';
  email_from_name: string;
  email_from_address: string;
  login_headline: string;
  login_subtext: string;
  background_image: string | null;
  custom_css?: string;
  analytics_id?: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  digest_frequency: 'instant' | 'daily' | 'weekly';
  alerts: {
    quota_warning: boolean;
    new_creator: boolean;
    payout_processed: boolean;
    campaign_complete: boolean;
  };
}

export interface Creator {
  id: string;
  user_id: string | null;
  agency_id: string | null;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  verification_status: CreatorVerification;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  follower_count: number;
  following_count: number;
  total_videos: number;
  total_views: number;
  avg_dps: number;
  best_dps: number;
  engagement_rate: number;
  platforms: PlatformConnection[];
  revenue_share_rate: number;
  payout_method: PayoutMethod | null;
  notification_preferences: NotificationSettings;
  is_active: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  user?: Profile;
  agency?: Agency;
}

export interface PlatformConnection {
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter' | 'twitch';
  username: string;
  url: string;
  followers: number;
  verified: boolean;
  connected_at: string;
}

export interface Developer {
  id: string;
  user_id: string | null;
  company_name: string | null;
  display_name: string;
  bio: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_name: string | null;
  website: string | null;
  github_url: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verified_by: string | null;
  trust_score: number;
  affiliate_tier: AffiliateTier;
  affiliate_code: string | null;
  total_referrals: number;
  total_referral_revenue_cents: number;
  total_revenue_cents: number;
  pending_payout_cents: number;
  payout_method: PayoutMethod | null;
  is_active: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  // Joined
  user?: Profile;
  apps?: MiniApp[];
}

export interface Clipper {
  id: string;
  user_id: string | null;
  handle: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  ambassador_tier: AffiliateTier;
  ambassador_code: string | null;
  total_referrals: number;
  total_campaigns_joined: number;
  total_clips_submitted: number;
  total_views: number;
  total_earnings_cents: number;
  pending_earnings_cents: number;
  avg_clip_performance: number;
  platforms: PlatformConnection[];
  payout_method: PayoutMethod | null;
  min_payout_cents: number;
  auto_payout: boolean;
  is_active: boolean;
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  user?: Profile;
}

export interface PayoutMethod {
  type: 'paypal' | 'bank' | 'stripe' | 'crypto';
  // PayPal
  email?: string;
  // Bank
  bank_name?: string;
  account_holder?: string;
  account_last4?: string;
  routing_number?: string;
  swift_code?: string;
  // Stripe
  stripe_account_id?: string;
  // Crypto
  wallet_address?: string;
  network?: 'ethereum' | 'polygon' | 'solana';
  // Verification
  is_verified: boolean;
  verified_at?: string;
}

// =============================================
// DATABASE TYPES - Features & Usage
// =============================================

export interface FeatureToggle {
  id: string;
  name: string;
  description: string | null;
  category: string;
  is_enabled: boolean;
  tier_availability: AgencyTier[];
  rollout_percentage: number;
  requires_setup: boolean;
  setup_url: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AgencyFeatureOverride {
  id: string;
  agency_id: string;
  feature_id: string;
  is_enabled: boolean;
  expires_at: string | null;
  reason: string | null;
  enabled_by: string | null;
  created_at: string;
  // Joined
  agency?: Agency;
  feature?: FeatureToggle;
}

export interface UsageQuota {
  id: string;
  agency_id: string;
  period_start: string;
  period_end: string;
  videos_analyzed: number;
  api_calls: number;
  storage_used_mb: number;
  creators_count: number;
  team_members_count: number;
  campaigns_active: number;
  quota_warning_sent: boolean;
  quota_exceeded_sent: boolean;
  created_at: string;
  updated_at: string;
  // Computed
  videos_remaining?: number;
  api_calls_remaining?: number;
  storage_remaining_mb?: number;
}

// =============================================
// DATABASE TYPES - Mini Apps
// =============================================

export interface MiniApp {
  id: string;
  developer_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  icon_url: string | null;
  cover_url: string | null;
  screenshots: string[];
  video_url: string | null;
  category: string | null;
  tags: string[];
  is_free: boolean;
  price_monthly: number; // in cents
  price_annual: number | null;
  has_trial: boolean;
  trial_days: number;
  integration_type: 'iframe' | 'api' | 'redirect';
  app_url: string;
  oauth_url: string | null;
  webhook_url: string | null;
  required_scopes: string[];
  rating: number;
  review_count: number;
  install_count: number;
  active_installs: number;
  total_revenue_cents: number;
  platform_fee_rate: number; // percentage
  approval_status: AppApprovalStatus;
  approved_at: string | null;
  approved_by: string | null;
  rejection_reason: string | null;
  is_featured: boolean;
  featured_at: string | null;
  is_active: boolean;
  suspended_at: string | null;
  suspension_reason: string | null;
  current_version: string;
  changelog: ChangelogEntry[];
  published_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, unknown>;
  // Joined
  developer?: Developer;
  reviews?: MiniAppReview[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  changes: string[];
}

export interface MiniAppInstall {
  id: string;
  mini_app_id: string;
  installed_by: string;
  agency_id: string | null;
  subscription_status: 'active' | 'cancelled' | 'expired' | 'trial';
  trial_ends_at: string | null;
  subscription_started_at: string;
  subscription_ends_at: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  last_used_at: string | null;
  usage_count: number;
  installed_at: string;
  cancelled_at: string | null;
  uninstalled_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  mini_app?: MiniApp;
  user?: Profile;
  agency?: Agency;
}

export interface MiniAppReview {
  id: string;
  mini_app_id: string;
  user_id: string;
  rating: number; // 1-5
  title: string | null;
  body: string | null;
  helpful_count: number;
  is_verified_purchase: boolean;
  is_flagged: boolean;
  is_hidden: boolean;
  developer_response: string | null;
  developer_response_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  user?: Profile;
}

// =============================================
// DATABASE TYPES - Campaigns
// =============================================

export interface Campaign {
  id: string;
  type: CampaignType;
  name: string;
  description: string | null;
  status: CampaignStatus;
  owner_id: string | null;
  agency_id: string | null;
  creator_id: string | null;
  developer_id: string | null;
  mini_app_id: string | null;
  thumbnail_url: string | null;
  cover_url: string | null;
  // Budget
  budget_cents: number;
  spent_cents: number;
  reserved_cents: number;
  // Payouts
  pay_per_1k_views_cents: number;
  pay_per_signup_cents: number;
  pay_per_install_cents: number;
  pay_per_conversion_cents: number;
  bonus_structure: BonusStructure | null;
  // Source content
  source_video_url: string | null;
  source_video_id: string | null;
  source_video_dps: number | null;
  suggested_clips: SuggestedClip[];
  // Stats
  total_views: number;
  total_signups: number;
  total_installs: number;
  total_conversions: number;
  participant_count: number;
  clips_count: number;
  avg_clip_performance: number;
  // Requirements
  requirements: CampaignRequirement[];
  min_followers: number;
  min_dps: number;
  max_participants: number | null;
  allowed_platforms: string[];
  // Visibility
  is_public: boolean;
  is_invite_only: boolean;
  allowed_tiers: AffiliateTier[];
  // Dates
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  owner?: Profile;
  agency?: Agency;
  creator?: Creator;
  developer?: Developer;
  mini_app?: MiniApp;
  participations?: CampaignParticipation[];
}

export interface BonusStructure {
  milestones: BonusMilestone[];
  first_place_bonus_cents?: number;
  top_performer_bonus_cents?: number;
  early_bird_bonus_cents?: number;
}

export interface BonusMilestone {
  views: number;
  bonus_cents: number;
  description: string;
}

export interface SuggestedClip {
  id: string;
  start_time: number;
  end_time: number;
  description: string;
  predicted_dps: number;
  hook_text: string | null;
  thumbnail_url: string | null;
}

export interface CampaignRequirement {
  type: 'hashtag' | 'mention' | 'sound' | 'disclosure' | 'cta' | 'custom';
  value: string;
  required: boolean;
  description: string;
}

export interface CampaignParticipation {
  id: string;
  campaign_id: string;
  clipper_id: string;
  status: 'pending' | 'active' | 'paused' | 'completed' | 'removed' | 'rejected';
  rejection_reason: string | null;
  total_clips: number;
  total_views: number;
  total_signups: number;
  total_installs: number;
  total_conversions: number;
  total_earnings_cents: number;
  pending_earnings_cents: number;
  bonuses_earned_cents: number;
  joined_at: string;
  approved_at: string | null;
  last_activity_at: string | null;
  completed_at: string | null;
  clips: ClipSubmission[];
  metadata: Record<string, unknown>;
  // Joined
  campaign?: Campaign;
  clipper?: Clipper;
}

export interface ClipSubmission {
  id: string;
  url: string;
  platform: string;
  video_id: string;
  thumbnail_url: string | null;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  dps_score: number | null;
  earnings_cents: number;
  signups: number;
  installs: number;
  submitted_at: string;
  verified_at: string | null;
  status: 'pending' | 'verified' | 'rejected';
}

export interface CampaignInvite {
  id: string;
  campaign_id: string;
  clipper_id: string | null;
  email: string | null;
  invite_code: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message: string | null;
  invited_by: string;
  created_at: string;
  expires_at: string | null;
  responded_at: string | null;
  // Joined
  campaign?: Campaign;
  clipper?: Clipper;
  inviter?: Profile;
}

// =============================================
// DATABASE TYPES - Affiliate & Payouts
// =============================================

export interface AffiliateTierConfig {
  tier: AffiliateTier;
  display_name: string;
  commission_rate: number;
  recurring_commission_rate: number;
  min_referrals: number;
  min_revenue_cents: number;
  color: string;
  badge_icon: string | null;
  perks: string[];
  requirements: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AffiliateReferral {
  id: string;
  referrer_id: string;
  referrer_type: 'developer' | 'clipper' | 'creator';
  referred_user_id: string | null;
  referred_email: string | null;
  referral_code: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  landing_page: string | null;
  ip_address: string | null;
  user_agent: string | null;
  status: 'pending' | 'signed_up' | 'converted' | 'qualified' | 'paid';
  subscription_tier: AgencyTier | null;
  subscription_monthly_value_cents: number;
  commission_cents: number;
  recurring_commission_cents: number;
  lifetime_value_cents: number;
  clicked_at: string;
  signed_up_at: string | null;
  converted_at: string | null;
  qualified_at: string | null;
  paid_at: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
  // Joined
  referrer?: Profile;
  referred_user?: Profile;
}

export interface Payout {
  id: string;
  recipient_id: string;
  recipient_type: 'clipper' | 'developer' | 'affiliate' | 'creator';
  amount_cents: number;
  currency: string;
  breakdown: PayoutBreakdown;
  status: PayoutStatus;
  payout_method: PayoutMethod;
  processor: string | null;
  processor_reference: string | null;
  processor_fee_cents: number;
  requested_at: string;
  requested_by: string | null;
  processed_at: string | null;
  processed_by: string | null;
  failure_reason: string | null;
  retry_count: number;
  last_retry_at: string | null;
  notes: string | null;
  internal_notes: string | null;
  metadata: Record<string, unknown>;
  // Joined
  recipient?: Profile;
  processor_user?: Profile;
}

export interface PayoutBreakdown {
  platform_campaigns_cents?: number;
  content_campaigns_cents?: number;
  app_campaigns_cents?: number;
  affiliate_commission_cents?: number;
  bonuses_cents?: number;
  adjustments_cents?: number;
  items?: PayoutLineItem[];
}

export interface PayoutLineItem {
  type: string;
  description: string;
  amount_cents: number;
  source_id?: string;
}

export interface EarningsLedger {
  id: string;
  user_id: string;
  user_type: 'clipper' | 'developer' | 'affiliate' | 'creator';
  source_type: 'campaign' | 'miniapp_revenue' | 'affiliate_commission' | 'bonus' | 'adjustment';
  source_id: string | null;
  source_name: string | null;
  amount_cents: number;
  currency: string;
  status: 'pending' | 'available' | 'paid' | 'cancelled';
  payout_id: string | null;
  earned_at: string;
  available_at: string | null;
  paid_at: string | null;
  metadata: Record<string, unknown>;
  // Joined
  user?: Profile;
  payout?: Payout;
}

// =============================================
// DATABASE TYPES - Audit & Activity
// =============================================

export interface AuditLogEntry {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  actor_email: string | null;
  action: string;
  action_category: string | null;
  resource_type: string;
  resource_id: string | null;
  resource_name: string | null;
  changes: AuditChanges;
  ip_address: string | null;
  user_agent: string | null;
  request_id: string | null;
  session_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  retain_until: string;
  // Joined
  actor?: Profile;
}

export interface AuditChanges {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  diff?: AuditDiffItem[];
}

export interface AuditDiffItem {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  category: string | null;
  severity: ActivitySeverity;
  actor_id: string | null;
  actor_name: string | null;
  actor_avatar: string | null;
  actor_role: UserRole | null;
  target_type: string | null;
  target_id: string | null;
  target_name: string | null;
  target_url: string | null;
  title: string;
  description: string | null;
  visibility: ActivityVisibility;
  agency_id: string | null;
  created_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  action_url: string | null;
  action_label: string | null;
  icon: string | null;
  image_url: string | null;
  is_read: boolean;
  read_at: string | null;
  channels: ('in_app' | 'email' | 'push' | 'sms')[];
  email_sent_at: string | null;
  push_sent_at: string | null;
  created_at: string;
  expires_at: string | null;
  metadata: Record<string, unknown>;
}

// =============================================
// PERMISSION TYPES
// =============================================

export type Permission =
  // Agency management
  | 'agencies:read'
  | 'agencies:create'
  | 'agencies:update'
  | 'agencies:delete'
  | 'agencies:suspend'
  // Creator management
  | 'creators:read'
  | 'creators:create'
  | 'creators:update'
  | 'creators:delete'
  | 'creators:verify'
  // Developer management
  | 'developers:read'
  | 'developers:create'
  | 'developers:update'
  | 'developers:delete'
  | 'developers:verify'
  // Clipper management
  | 'clippers:read'
  | 'clippers:update'
  | 'clippers:ban'
  // Campaign management
  | 'campaigns:read'
  | 'campaigns:create'
  | 'campaigns:update'
  | 'campaigns:delete'
  | 'campaigns:approve'
  // Mini app management
  | 'miniapps:read'
  | 'miniapps:create'
  | 'miniapps:update'
  | 'miniapps:delete'
  | 'miniapps:approve'
  | 'miniapps:feature'
  // Payouts
  | 'payouts:read'
  | 'payouts:process'
  | 'payouts:cancel'
  // Features
  | 'features:read'
  | 'features:update'
  // Analytics
  | 'analytics:read'
  | 'analytics:export'
  // Audit
  | 'audit:read'
  // Settings
  | 'settings:read'
  | 'settings:update'
  // Sub-admins
  | 'subadmins:read'
  | 'subadmins:create'
  | 'subadmins:update'
  | 'subadmins:delete';

export const PERMISSION_GROUPS: Record<string, { label: string; permissions: Permission[] }> = {
  agencies: {
    label: 'Agency Management',
    permissions: ['agencies:read', 'agencies:create', 'agencies:update', 'agencies:delete', 'agencies:suspend'],
  },
  creators: {
    label: 'Creator Management',
    permissions: ['creators:read', 'creators:create', 'creators:update', 'creators:delete', 'creators:verify'],
  },
  developers: {
    label: 'Developer Management',
    permissions: ['developers:read', 'developers:create', 'developers:update', 'developers:delete', 'developers:verify'],
  },
  clippers: {
    label: 'Clipper Management',
    permissions: ['clippers:read', 'clippers:update', 'clippers:ban'],
  },
  campaigns: {
    label: 'Campaign Management',
    permissions: ['campaigns:read', 'campaigns:create', 'campaigns:update', 'campaigns:delete', 'campaigns:approve'],
  },
  miniapps: {
    label: 'Mini App Management',
    permissions: ['miniapps:read', 'miniapps:create', 'miniapps:update', 'miniapps:delete', 'miniapps:approve', 'miniapps:feature'],
  },
  payouts: {
    label: 'Payout Management',
    permissions: ['payouts:read', 'payouts:process', 'payouts:cancel'],
  },
  system: {
    label: 'System',
    permissions: ['features:read', 'features:update', 'analytics:read', 'analytics:export', 'audit:read', 'settings:read', 'settings:update'],
  },
  subadmins: {
    label: 'Sub-Admin Management',
    permissions: ['subadmins:read', 'subadmins:create', 'subadmins:update', 'subadmins:delete'],
  },
};

// =============================================
// COMPOSITE TYPES (with computed fields)
// =============================================

export interface AgencyWithStats extends Agency {
  creator_count: number;
  total_revenue_cents: number;
  avg_dps: number;
  videos_this_month: number;
  usage_percentage: number;
  mrr_cents: number;
}

export interface CampaignWithStats extends Campaign {
  roi_percentage: number;
  cost_per_view_cents: number;
  platform_fee_cents: number;
  remaining_budget_cents: number;
  days_remaining: number | null;
}

export interface ClipperWithStats extends Clipper {
  this_month_earnings_cents: number;
  last_month_earnings_cents: number;
  active_campaigns_count: number;
  progress_to_next_tier: number;
  earnings_growth_percentage: number;
}

export interface DeveloperWithStats extends Developer {
  app_count: number;
  total_installs: number;
  monthly_revenue_cents: number;
  total_revenue_cents: number;
  active_campaigns_count: number;
  avg_app_rating: number;
}

export interface MiniAppWithStats extends MiniApp {
  monthly_installs: number;
  monthly_revenue_cents: number;
  churn_rate: number;
  avg_usage_per_install: number;
  developer_revenue_cents: number; // after platform fee
}

// =============================================
// FORM INPUT TYPES
// =============================================

export interface CreateAgencyInput {
  name: string;
  slug?: string;
  tier: AgencyTier;
  owner_email: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  description?: string;
}

export interface UpdateAgencyInput {
  name?: string;
  tier?: AgencyTier;
  logo_url?: string;
  cover_url?: string;
  contact_email?: string;
  contact_phone?: string;
  website?: string;
  description?: string;
  feature_overrides?: Record<string, boolean>;
  white_label_config?: Partial<WhiteLabelConfig>;
  notification_settings?: Partial<NotificationSettings>;
  is_active?: boolean;
}

export interface CreateCreatorInput {
  handle: string;
  display_name?: string;
  agency_id?: string;
  platforms?: PlatformConnection[];
  email?: string;
}

export interface UpdateCreatorInput {
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  agency_id?: string | null;
  verification_status?: CreatorVerification;
  platforms?: PlatformConnection[];
  revenue_share_rate?: number;
  is_active?: boolean;
}

export interface CreateDeveloperInput {
  display_name: string;
  company_name?: string;
  contact_email: string;
  website?: string;
  github_url?: string;
}

export interface UpdateDeveloperInput {
  display_name?: string;
  company_name?: string;
  bio?: string;
  contact_email?: string;
  website?: string;
  github_url?: string;
  is_verified?: boolean;
  affiliate_tier?: AffiliateTier;
  is_active?: boolean;
}

export interface CreateMiniAppInput {
  name: string;
  slug?: string;
  tagline?: string;
  description?: string;
  icon_url?: string;
  category?: string;
  is_free: boolean;
  price_monthly?: number;
  price_annual?: number;
  has_trial?: boolean;
  trial_days?: number;
  integration_type: 'iframe' | 'api' | 'redirect';
  app_url: string;
  webhook_url?: string;
}

export interface UpdateMiniAppInput {
  name?: string;
  tagline?: string;
  description?: string;
  icon_url?: string;
  cover_url?: string;
  screenshots?: string[];
  video_url?: string;
  category?: string;
  tags?: string[];
  is_free?: boolean;
  price_monthly?: number;
  price_annual?: number;
  has_trial?: boolean;
  trial_days?: number;
  app_url?: string;
  webhook_url?: string;
  is_active?: boolean;
}

export interface CreateCampaignInput {
  type: CampaignType;
  name: string;
  description?: string;
  thumbnail_url?: string;
  budget_cents: number;
  pay_per_1k_views_cents?: number;
  pay_per_signup_cents?: number;
  pay_per_install_cents?: number;
  pay_per_conversion_cents?: number;
  bonus_structure?: BonusStructure;
  source_video_url?: string;
  mini_app_id?: string;
  requirements?: CampaignRequirement[];
  min_followers?: number;
  min_dps?: number;
  max_participants?: number;
  allowed_platforms?: string[];
  is_public?: boolean;
  is_invite_only?: boolean;
  allowed_tiers?: AffiliateTier[];
  start_date?: string;
  end_date?: string;
}

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  thumbnail_url?: string;
  status?: CampaignStatus;
  budget_cents?: number;
  pay_per_1k_views_cents?: number;
  pay_per_signup_cents?: number;
  pay_per_install_cents?: number;
  bonus_structure?: BonusStructure;
  requirements?: CampaignRequirement[];
  min_followers?: number;
  max_participants?: number;
  allowed_platforms?: string[];
  is_public?: boolean;
  end_date?: string;
}

export interface CreateSubAdminInput {
  user_email: string;
  delegated_permissions: Permission[];
  agency_scope?: string[];
  max_agencies?: number;
  can_create_sub_admins?: boolean;
  notes?: string;
}

export interface UpdateSubAdminInput {
  delegated_permissions?: Permission[];
  agency_scope?: string[] | null;
  max_agencies?: number;
  can_create_sub_admins?: boolean;
  is_active?: boolean;
  notes?: string;
}

export interface ProcessPayoutInput {
  processor: string;
  processor_reference?: string;
  processor_fee_cents?: number;
  notes?: string;
}

// =============================================
// FILTER TYPES
// =============================================

export interface BaseFilters {
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AgencyFilters extends BaseFilters {
  tier?: AgencyTier[];
  is_active?: boolean;
  has_white_label?: boolean;
  owner_id?: string;
  sort_by?: 'name' | 'created_at' | 'revenue' | 'dps' | 'creators' | 'tier';
}

export interface CreatorFilters extends BaseFilters {
  agency_id?: string | 'independent';
  verification_status?: CreatorVerification[];
  min_dps?: number;
  max_dps?: number;
  min_followers?: number;
  platforms?: string[];
  is_active?: boolean;
  sort_by?: 'handle' | 'created_at' | 'dps' | 'videos' | 'followers' | 'verification_status';
}

export interface DeveloperFilters extends BaseFilters {
  is_verified?: boolean;
  affiliate_tier?: AffiliateTier[];
  has_apps?: boolean;
  is_active?: boolean;
  sort_by?: 'display_name' | 'created_at' | 'apps' | 'revenue' | 'referrals';
}

export interface ClipperFilters extends BaseFilters {
  ambassador_tier?: AffiliateTier[];
  min_earnings?: number;
  platforms?: string[];
  is_active?: boolean;
  is_banned?: boolean;
  sort_by?: 'handle' | 'created_at' | 'earnings' | 'views' | 'campaigns';
}

export interface CampaignFilters extends BaseFilters {
  type?: CampaignType[];
  status?: CampaignStatus[];
  owner_id?: string;
  agency_id?: string;
  developer_id?: string;
  min_budget?: number;
  max_budget?: number;
  sort_by?: 'name' | 'created_at' | 'budget' | 'spent' | 'views' | 'participants' | 'status';
}

export interface MiniAppFilters extends BaseFilters {
  category?: string[];
  is_free?: boolean;
  approval_status?: AppApprovalStatus[];
  developer_id?: string;
  is_featured?: boolean;
  min_rating?: number;
  sort_by?: 'name' | 'created_at' | 'installs' | 'rating' | 'revenue' | 'price';
}

export interface PayoutFilters extends BaseFilters {
  status?: PayoutStatus[];
  recipient_type?: ('clipper' | 'developer' | 'affiliate' | 'creator')[];
  recipient_id?: string;
  min_amount?: number;
  max_amount?: number;
  date_from?: string;
  date_to?: string;
  sort_by?: 'requested_at' | 'amount' | 'status' | 'processed_at';
}

export interface AuditLogFilters extends BaseFilters {
  actor_id?: string;
  actor_role?: UserRole[];
  action?: string[];
  resource_type?: string[];
  resource_id?: string;
  success?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'created_at' | 'action' | 'resource_type';
}

// =============================================
// PAGINATION
// =============================================

export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
  has_more: boolean;
}

export interface CursorPaginationParams {
  cursor?: string;
  limit: number;
  direction?: 'forward' | 'backward';
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  prev_cursor: string | null;
  has_more: boolean;
}

// =============================================
// API RESPONSE TYPES
// =============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  field?: string;
}

export interface BulkOperationResult<T> {
  success: T[];
  failed: { item: T; error: ApiError }[];
  total: number;
  succeeded: number;
  failed_count: number;
}

// =============================================
// DASHBOARD TYPES
// =============================================

export interface AdminDashboardStats {
  // Users
  total_users: number;
  users_by_role: Record<UserRole, number>;
  new_users_today: number;
  new_users_this_week: number;
  // Revenue
  mrr_cents: number;
  arr_cents: number;
  revenue_this_month_cents: number;
  revenue_growth_percentage: number;
  // Agencies
  total_agencies: number;
  agencies_by_tier: Record<AgencyTier, number>;
  // Campaigns
  active_campaigns: number;
  total_campaign_budget_cents: number;
  total_campaign_spent_cents: number;
  // Payouts
  pending_payouts_count: number;
  pending_payouts_amount_cents: number;
  // Activity
  recent_signups: Profile[];
  recent_activities: ActivityFeedItem[];
}

export interface AgencyDashboardStats {
  // Overview
  total_creators: number;
  total_videos: number;
  avg_dps: number;
  // Usage
  videos_this_month: number;
  videos_limit: number;
  api_calls_this_month: number;
  api_calls_limit: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  // Performance
  top_creators: Creator[];
  recent_videos: { id: string; title: string; dps: number; views: number }[];
  dps_trend: { date: string; avg_dps: number }[];
}

export interface DeveloperDashboardStats {
  // Apps
  total_apps: number;
  total_installs: number;
  active_subscriptions: number;
  // Revenue
  total_revenue_cents: number;
  this_month_revenue_cents: number;
  pending_payout_cents: number;
  // Affiliate
  affiliate_tier: AffiliateTier;
  total_referrals: number;
  referral_earnings_cents: number;
  // Campaigns
  active_campaigns: number;
  campaign_spend_cents: number;
}

export interface ClipperDashboardStats {
  // Earnings
  total_earnings_cents: number;
  pending_earnings_cents: number;
  this_month_earnings_cents: number;
  // Performance
  total_views: number;
  total_clips: number;
  avg_views_per_clip: number;
  // Campaigns
  active_campaigns: number;
  completed_campaigns: number;
  // Tier
  ambassador_tier: AffiliateTier;
  progress_to_next_tier: number;
  referrals: number;
}

// =============================================
// UTILITY TYPES
// =============================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type WithTimestamps<T> = T & {
  created_at: string;
  updated_at: string;
};

export type WithId<T> = T & {
  id: string;
};

// Type guard helpers
export function isChairman(role: UserRole): boolean {
  return role === 'chairman';
}

export function isAdmin(role: UserRole): boolean {
  return role === 'chairman' || role === 'sub_admin';
}

export function hasPermission(userPermissions: Permission[], required: Permission): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(userPermissions: Permission[], required: Permission[]): boolean {
  return required.some(p => userPermissions.includes(p));
}

export function hasAllPermissions(userPermissions: Permission[], required: Permission[]): boolean {
  return required.every(p => userPermissions.includes(p));
}

export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[targetRole];
}

// Format helpers
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}


























































































