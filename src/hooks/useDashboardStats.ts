import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AgencyTier, UserRole, Profile, ActivityFeedItem } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface ChairmanDashboardStats {
  // User stats
  totalUsers: number;
  usersByRole: Record<UserRole, number>;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  
  // Agency stats
  totalAgencies: number;
  activeAgencies: number;
  agenciesByTier: Record<AgencyTier, number>;
  newAgenciesThisMonth: number;
  
  // Creator stats
  totalCreators: number;
  verifiedCreators: number;
  pendingVerification: number;
  
  // Campaign stats
  activeCampaigns: number;
  totalCampaignBudgetCents: number;
  totalCampaignSpentCents: number;
  
  // Mini App stats
  totalMiniApps: number;
  approvedApps: number;
  pendingApproval: number;
  featuredApps: number;
  
  // Revenue stats
  mrrCents: number;
  arrCents: number;
  revenueThisMonthCents: number;
  revenueGrowthPercent: number;
  
  // Payout stats
  pendingPayoutsCount: number;
  pendingPayoutsAmountCents: number;
  
  // Recent activity
  recentSignups: Profile[];
  recentActivities: ActivityFeedItem[];
}

export interface AgencyDashboardStats {
  totalCreators: number;
  totalVideos: number;
  avgDps: number;
  videosThisMonth: number;
  videosLimit: number;
  apiCallsThisMonth: number;
  apiCallsLimit: number;
  storageUsedMb: number;
  storageLimitMb: number;
}

export interface DeveloperDashboardStats {
  totalApps: number;
  totalInstalls: number;
  activeSubscriptions: number;
  totalRevenueCents: number;
  thisMonthRevenueCents: number;
  pendingPayoutCents: number;
  affiliateTier: string;
  totalReferrals: number;
  referralEarningsCents: number;
  activeCampaigns: number;
  campaignSpendCents: number;
}

export interface ClipperDashboardStats {
  totalEarningsCents: number;
  pendingEarningsCents: number;
  thisMonthEarningsCents: number;
  totalViews: number;
  totalClips: number;
  avgViewsPerClip: number;
  activeCampaigns: number;
  completedCampaigns: number;
  ambassadorTier: string;
  progressToNextTier: number;
  referrals: number;
}

export interface UseDashboardStatsResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch dashboard stats for Chairman role
 */
export function useChairmanDashboardStats(): UseDashboardStatsResult<ChairmanDashboardStats> {
  const [data, setData] = useState<ChairmanDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Date calculations
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Parallel queries for efficiency
      const [
        profilesResult,
        agenciesResult,
        creatorsResult,
        campaignsResult,
        miniAppsResult,
        payoutsResult,
        todayUsersResult,
        weekUsersResult,
        monthAgenciesResult,
        recentSignupsResult,
        activityResult,
      ] = await Promise.all([
        // Total profiles by role
        supabase.from('profiles').select('role'),
        // Agencies
        supabase.from('agencies').select('tier, is_active, suspended_at'),
        // Creators
        supabase.from('creators').select('verification_status'),
        // Active campaigns
        supabase.from('campaigns').select('status, budget_cents, spent_cents').eq('status', 'active'),
        // Mini apps
        supabase.from('mini_apps').select('approval_status, is_featured'),
        // Pending payouts
        supabase.from('payouts').select('amount_cents').eq('status', 'pending'),
        // New users today
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfToday.toISOString()),
        // New users this week
        supabase.from('profiles').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfWeek.toISOString()),
        // New agencies this month
        supabase.from('agencies').select('id', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString()),
        // Recent signups
        supabase.from('profiles').select('*')
          .order('created_at', { ascending: false })
          .limit(5),
        // Recent activity
        supabase.from('activity_feed').select('*')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      // Process profiles by role
      const profiles = profilesResult.data || [];
      const usersByRole: Record<UserRole, number> = {
        chairman: 0,
        sub_admin: 0,
        agency: 0,
        developer: 0,
        creator: 0,
        clipper: 0,
      };
      profiles.forEach((p) => {
        if (p.role && usersByRole[p.role as UserRole] !== undefined) {
          usersByRole[p.role as UserRole]++;
        }
      });

      // Process agencies by tier
      const agencies = agenciesResult.data || [];
      const agenciesByTier: Record<AgencyTier, number> = {
        starter: 0,
        growth: 0,
        pro: 0,
        enterprise: 0,
      };
      let activeAgencies = 0;
      agencies.forEach((a) => {
        if (a.tier && agenciesByTier[a.tier as AgencyTier] !== undefined) {
          agenciesByTier[a.tier as AgencyTier]++;
        }
        if (a.is_active && !a.suspended_at) activeAgencies++;
      });

      // Process creators
      const creators = creatorsResult.data || [];
      const verifiedCreators = creators.filter((c) => 
        c.verification_status === 'verified' || c.verification_status === 'featured'
      ).length;
      const pendingVerification = creators.filter((c) => 
        c.verification_status === 'pending'
      ).length;

      // Process campaigns
      const campaigns = campaignsResult.data || [];
      const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget_cents || 0), 0);
      const totalSpent = campaigns.reduce((sum, c) => sum + (c.spent_cents || 0), 0);

      // Process mini apps
      const miniApps = miniAppsResult.data || [];
      const approvedApps = miniApps.filter((a) => a.approval_status === 'approved').length;
      const pendingApps = miniApps.filter((a) => a.approval_status === 'pending').length;
      const featuredApps = miniApps.filter((a) => a.is_featured).length;

      // Process payouts
      const payouts = payoutsResult.data || [];
      const pendingAmount = payouts.reduce((sum, p) => sum + (p.amount_cents || 0), 0);

      // Calculate MRR (simplified - would need subscription data in production)
      const tierPrices: Record<AgencyTier, number> = {
        starter: 0,
        growth: 4900,
        pro: 14900,
        enterprise: 49900,
      };
      const mrrCents = Object.entries(agenciesByTier).reduce(
        (sum, [tier, count]) => sum + (tierPrices[tier as AgencyTier] || 0) * count,
        0
      );

      setData({
        totalUsers: profiles.length,
        usersByRole,
        newUsersToday: todayUsersResult.count || 0,
        newUsersThisWeek: weekUsersResult.count || 0,
        newUsersThisMonth: 0, // Would need separate query
        
        totalAgencies: agencies.length,
        activeAgencies,
        agenciesByTier,
        newAgenciesThisMonth: monthAgenciesResult.count || 0,
        
        totalCreators: creators.length,
        verifiedCreators,
        pendingVerification,
        
        activeCampaigns: campaigns.length,
        totalCampaignBudgetCents: totalBudget,
        totalCampaignSpentCents: totalSpent,
        
        totalMiniApps: miniApps.length,
        approvedApps,
        pendingApproval: pendingApps,
        featuredApps,
        
        mrrCents,
        arrCents: mrrCents * 12,
        revenueThisMonthCents: mrrCents, // Simplified
        revenueGrowthPercent: 0, // Would need historical data
        
        pendingPayoutsCount: payouts.length,
        pendingPayoutsAmountCents: pendingAmount,
        
        recentSignups: recentSignupsResult.data || [],
        recentActivities: activityResult.data || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch dashboard stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

/**
 * Fetch dashboard stats for Agency role
 */
export function useAgencyDashboardStats(agencyId: string | null): UseDashboardStatsResult<AgencyDashboardStats> {
  const [data, setData] = useState<AgencyDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!agencyId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [creatorsResult, quotaResult] = await Promise.all([
        supabase.from('creators').select('*', { count: 'exact' }).eq('agency_id', agencyId),
        supabase.from('usage_quotas').select('*').eq('agency_id', agencyId).single(),
      ]);

      const creators = creatorsResult.data || [];
      const quota = quotaResult.data;

      // Calculate avg DPS
      const avgDps = creators.length > 0
        ? creators.reduce((sum, c) => sum + (c.avg_dps || 0), 0) / creators.length
        : 0;

      // Calculate total videos
      const totalVideos = creators.reduce((sum, c) => sum + (c.total_videos || 0), 0);

      setData({
        totalCreators: creators.length,
        totalVideos,
        avgDps: Math.round(avgDps * 10) / 10,
        videosThisMonth: quota?.videos_analyzed || 0,
        videosLimit: 1000, // Would come from tier definition
        apiCallsThisMonth: quota?.api_calls || 0,
        apiCallsLimit: 10000,
        storageUsedMb: quota?.storage_used_mb || 0,
        storageLimitMb: 10240,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agency stats'));
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

/**
 * Fetch dashboard stats for Developer role
 */
export function useDeveloperDashboardStats(developerId: string | null): UseDashboardStatsResult<DeveloperDashboardStats> {
  const [data, setData] = useState<DeveloperDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!developerId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [developerResult, appsResult, campaignsResult] = await Promise.all([
        supabase.from('developers').select('*').eq('id', developerId).single(),
        supabase.from('mini_apps').select('install_count, active_installs, total_revenue_cents')
          .eq('developer_id', developerId),
        supabase.from('campaigns').select('budget_cents, spent_cents')
          .eq('developer_id', developerId)
          .eq('status', 'active'),
      ]);

      const developer = developerResult.data;
      const apps = appsResult.data || [];
      const campaigns = campaignsResult.data || [];

      const totalInstalls = apps.reduce((sum, a) => sum + (a.install_count || 0), 0);
      const activeInstalls = apps.reduce((sum, a) => sum + (a.active_installs || 0), 0);
      const totalRevenue = apps.reduce((sum, a) => sum + (a.total_revenue_cents || 0), 0);
      const campaignSpend = campaigns.reduce((sum, c) => sum + (c.spent_cents || 0), 0);

      setData({
        totalApps: apps.length,
        totalInstalls,
        activeSubscriptions: activeInstalls,
        totalRevenueCents: totalRevenue,
        thisMonthRevenueCents: 0, // Would need separate query
        pendingPayoutCents: developer?.pending_payout_cents || 0,
        affiliateTier: developer?.affiliate_tier || 'bronze',
        totalReferrals: developer?.total_referrals || 0,
        referralEarningsCents: developer?.total_referral_revenue_cents || 0,
        activeCampaigns: campaigns.length,
        campaignSpendCents: campaignSpend,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch developer stats'));
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

/**
 * Fetch dashboard stats for Clipper role
 */
export function useClipperDashboardStats(clipperId: string | null): UseDashboardStatsResult<ClipperDashboardStats> {
  const [data, setData] = useState<ClipperDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    if (!clipperId) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      const [clipperResult, participationsResult] = await Promise.all([
        supabase.from('clippers').select('*').eq('id', clipperId).single(),
        supabase.from('campaign_participations').select('status, total_views, total_clips, total_earnings_cents')
          .eq('clipper_id', clipperId),
      ]);

      const clipper = clipperResult.data;
      const participations = participationsResult.data || [];

      const activeCampaigns = participations.filter((p) => p.status === 'active').length;
      const completedCampaigns = participations.filter((p) => p.status === 'completed').length;
      const totalClips = participations.reduce((sum, p) => sum + (p.total_clips || 0), 0);
      const totalViews = participations.reduce((sum, p) => sum + (p.total_views || 0), 0);

      setData({
        totalEarningsCents: clipper?.total_earnings_cents || 0,
        pendingEarningsCents: clipper?.pending_earnings_cents || 0,
        thisMonthEarningsCents: 0, // Would need separate calculation
        totalViews: clipper?.total_views || totalViews,
        totalClips: clipper?.total_clips_submitted || totalClips,
        avgViewsPerClip: totalClips > 0 ? Math.round(totalViews / totalClips) : 0,
        activeCampaigns,
        completedCampaigns,
        ambassadorTier: clipper?.ambassador_tier || 'bronze',
        progressToNextTier: 0, // Would need tier calculation
        referrals: clipper?.total_referrals || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch clipper stats'));
    } finally {
      setLoading(false);
    }
  }, [clipperId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

























































































