import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Campaign, CampaignType, CampaignStatus, CampaignWithStats } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface CampaignFilters {
  search?: string;
  type?: CampaignType | CampaignType[];
  status?: CampaignStatus | CampaignStatus[];
  ownerId?: string;
  agencyId?: string;
  developerId?: string;
  miniAppId?: string;
  minBudget?: number;
  maxBudget?: number;
  isPublic?: boolean;
  sortBy?: 'name' | 'created_at' | 'budget_cents' | 'spent_cents' | 'total_views' | 'participant_count' | 'status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseCampaignsResult {
  data: Campaign[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface UseCampaignResult {
  data: Campaign | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// BASE CAMPAIGN HOOK
// =============================================

function useCampaignsBase(filters: CampaignFilters = {}): UseCampaignsResult {
  const [data, setData] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('campaigns')
        .select(`
          *,
          owner:profiles!campaigns_owner_id_fkey(*),
          agency:agencies!campaigns_agency_id_fkey(id, name, slug),
          creator:creators!campaigns_creator_id_fkey(id, handle, display_name),
          developer:developers!campaigns_developer_id_fkey(id, display_name, company_name),
          mini_app:mini_apps!campaigns_mini_app_id_fkey(id, name, slug, icon_url)
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply type filter
      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        query = query.in('type', types);
      }

      // Apply status filter
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }

      // Apply owner filter
      if (filters.ownerId) {
        query = query.eq('owner_id', filters.ownerId);
      }

      // Apply agency filter
      if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }

      // Apply developer filter
      if (filters.developerId) {
        query = query.eq('developer_id', filters.developerId);
      }

      // Apply mini app filter
      if (filters.miniAppId) {
        query = query.eq('mini_app_id', filters.miniAppId);
      }

      // Apply budget filters
      if (filters.minBudget !== undefined) {
        query = query.gte('budget_cents', filters.minBudget);
      }
      if (filters.maxBudget !== undefined) {
        query = query.lte('budget_cents', filters.maxBudget);
      }

      // Apply public filter
      if (filters.isPublic !== undefined) {
        query = query.eq('is_public', filters.isPublic);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: campaigns, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(campaigns || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch campaigns'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.type,
    filters.status,
    filters.ownerId,
    filters.agencyId,
    filters.developerId,
    filters.miniAppId,
    filters.minBudget,
    filters.maxBudget,
    filters.isPublic,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  return { data, loading, error, count, refetch: fetchCampaigns };
}

// =============================================
// SPECIALIZED CAMPAIGN HOOKS
// =============================================

/**
 * Fetch all campaigns with optional filtering
 */
export function useCampaigns(filters: CampaignFilters = {}): UseCampaignsResult {
  return useCampaignsBase(filters);
}

/**
 * Fetch Platform Campaigns (Layer 1 - Creator sponsored content)
 */
export function usePlatformCampaigns(filters: Omit<CampaignFilters, 'type'> = {}): UseCampaignsResult {
  return useCampaignsBase({ ...filters, type: 'platform' });
}

/**
 * Fetch Content Campaigns (Layer 2 - Creator UGC licensing)
 */
export function useContentCampaigns(filters: Omit<CampaignFilters, 'type'> = {}): UseCampaignsResult {
  return useCampaignsBase({ ...filters, type: 'content' });
}

/**
 * Fetch App Campaigns (Layer 3 - Mini app promotion)
 */
export function useAppCampaigns(filters: Omit<CampaignFilters, 'type'> = {}): UseCampaignsResult {
  return useCampaignsBase({ ...filters, type: 'miniapp' });
}

/**
 * Fetch active campaigns only
 */
export function useActiveCampaigns(filters: Omit<CampaignFilters, 'status'> = {}): UseCampaignsResult {
  return useCampaignsBase({ ...filters, status: 'active' });
}

/**
 * Fetch a single campaign by ID
 */
export function useCampaign(id: string | null): UseCampaignResult {
  const [data, setData] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCampaign = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: campaign, error: queryError } = await supabase
        .from('campaigns')
        .select(`
          *,
          owner:profiles!campaigns_owner_id_fkey(*),
          agency:agencies!campaigns_agency_id_fkey(*),
          creator:creators!campaigns_creator_id_fkey(*),
          developer:developers!campaigns_developer_id_fkey(*),
          mini_app:mini_apps!campaigns_mini_app_id_fkey(*),
          participations:campaign_participations(
            *,
            clipper:clippers(*)
          )
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setData(campaign);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch campaign'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  return { data, loading, error, refetch: fetchCampaign };
}

/**
 * Fetch campaign with computed stats
 */
export function useCampaignWithStats(id: string | null): UseCampaignResult & { data: CampaignWithStats | null } {
  const { data: campaign, loading, error, refetch } = useCampaign(id);

  const campaignWithStats: CampaignWithStats | null = campaign ? {
    ...campaign,
    roi_percentage: campaign.spent_cents > 0 
      ? ((campaign.total_views * 0.01) / (campaign.spent_cents / 100)) * 100 
      : 0,
    cost_per_view_cents: campaign.total_views > 0 
      ? campaign.spent_cents / campaign.total_views 
      : 0,
    platform_fee_cents: Math.round(campaign.spent_cents * 0.2), // 20% platform fee
    remaining_budget_cents: campaign.budget_cents - campaign.spent_cents - campaign.reserved_cents,
    days_remaining: campaign.end_date 
      ? Math.max(0, Math.ceil((new Date(campaign.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null,
  } : null;

  return { data: campaignWithStats, loading, error, refetch };
}

// =============================================
// MUTATIONS
// =============================================

export function useCampaignMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createCampaign = async (data: Partial<Campaign>): Promise<Campaign | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: campaign, error: createError } = await supabase
        .from('campaigns')
        .insert({
          ...data,
          owner_id: user?.id,
          status: data.status || 'draft',
        })
        .select()
        .single();

      if (createError) throw createError;
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create campaign'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateCampaign = async (id: string, data: Partial<Campaign>): Promise<Campaign | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: campaign, error: updateError } = await supabase
        .from('campaigns')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return campaign;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update campaign'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const publishCampaign = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'active',
          published_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to publish campaign'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const pauseCampaign = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'paused' })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to pause campaign'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const completeCampaign = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to complete campaign'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelCampaign = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('campaigns')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel campaign'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createCampaign,
    updateCampaign,
    publishCampaign,
    pauseCampaign,
    completeCampaign,
    cancelCampaign,
  };
}

























































































