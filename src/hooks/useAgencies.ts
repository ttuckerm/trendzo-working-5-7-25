import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Agency, AgencyTier, AgencyWithStats } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface AgencyFilters {
  search?: string;
  tier?: AgencyTier | AgencyTier[];
  status?: 'active' | 'suspended' | 'all';
  hasWhiteLabel?: boolean;
  sortBy?: 'name' | 'created_at' | 'tier' | 'creator_count';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseAgenciesResult {
  data: Agency[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface UseAgencyResult {
  data: Agency | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch a list of agencies with optional filtering
 */
export function useAgencies(filters: AgencyFilters = {}): UseAgenciesResult {
  const [data, setData] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('agencies')
        .select('*, owner:profiles!agencies_owner_id_fkey(*)', { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
      }

      // Apply tier filter
      if (filters.tier) {
        const tiers = Array.isArray(filters.tier) ? filters.tier : [filters.tier];
        query = query.in('tier', tiers);
      }

      // Apply status filter
      if (filters.status === 'active') {
        query = query.eq('is_active', true).is('suspended_at', null);
      } else if (filters.status === 'suspended') {
        query = query.not('suspended_at', 'is', null);
      }

      // Apply white label filter
      if (filters.hasWhiteLabel !== undefined) {
        if (filters.hasWhiteLabel) {
          query = query.not('white_label_config', 'is', null);
        } else {
          query = query.is('white_label_config', null);
        }
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

      const { data: agencies, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(agencies || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agencies'));
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.tier, filters.status, filters.hasWhiteLabel, filters.sortBy, filters.sortOrder, filters.limit, filters.offset]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  return { data, loading, error, count, refetch: fetchAgencies };
}

/**
 * Fetch a single agency by ID
 */
export function useAgency(id: string | null): UseAgencyResult {
  const [data, setData] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAgency = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: agency, error: queryError } = await supabase
        .from('agencies')
        .select(`
          *,
          owner:profiles!agencies_owner_id_fkey(*),
          members:agency_members(*, user:profiles(*)),
          tier_definition:agency_tier_definitions(*)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setData(agency);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agency'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAgency();
  }, [fetchAgency]);

  return { data, loading, error, refetch: fetchAgency };
}

/**
 * Fetch agencies with computed stats
 */
export function useAgenciesWithStats(filters: AgencyFilters = {}): UseAgenciesResult & { data: AgencyWithStats[] } {
  const [data, setData] = useState<AgencyWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchAgencies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Fetch agencies with creator count
      let query = supabase
        .from('agencies')
        .select(`
          *,
          owner:profiles!agencies_owner_id_fkey(*),
          creators:creators(count)
        `, { count: 'exact' });

      // Apply filters (same as useAgencies)
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,slug.ilike.%${filters.search}%`);
      }
      if (filters.tier) {
        const tiers = Array.isArray(filters.tier) ? filters.tier : [filters.tier];
        query = query.in('tier', tiers);
      }
      if (filters.status === 'active') {
        query = query.eq('is_active', true).is('suspended_at', null);
      } else if (filters.status === 'suspended') {
        query = query.not('suspended_at', 'is', null);
      }

      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      if (filters.limit) query = query.limit(filters.limit);
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: agencies, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      // Transform to AgencyWithStats
      const agenciesWithStats: AgencyWithStats[] = (agencies || []).map((agency: any) => ({
        ...agency,
        creator_count: agency.creators?.[0]?.count || 0,
        total_revenue_cents: 0, // Would need separate query
        avg_dps: 0,
        videos_this_month: 0,
        usage_percentage: 0,
        mrr_cents: 0,
      }));

      setData(agenciesWithStats);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agencies'));
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.tier, filters.status, filters.sortBy, filters.sortOrder, filters.limit, filters.offset]);

  useEffect(() => {
    fetchAgencies();
  }, [fetchAgencies]);

  return { data, loading, error, count, refetch: fetchAgencies };
}

// =============================================
// MUTATIONS
// =============================================

export function useAgencyMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createAgency = async (data: Partial<Agency>): Promise<Agency | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: agency, error: createError } = await supabase
        .from('agencies')
        .insert(data)
        .select()
        .single();

      if (createError) throw createError;
      return agency;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create agency'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateAgency = async (id: string, data: Partial<Agency>): Promise<Agency | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: agency, error: updateError } = await supabase
        .from('agencies')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return agency;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update agency'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const suspendAgency = async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          is_active: false,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to suspend agency'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reactivateAgency = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('agencies')
        .update({
          suspended_at: null,
          suspension_reason: null,
          is_active: true,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reactivate agency'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createAgency,
    updateAgency,
    suspendAgency,
    reactivateAgency,
  };
}

























































































