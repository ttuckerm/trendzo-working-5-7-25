import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Creator, CreatorVerification } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface CreatorFilters {
  search?: string;
  agencyId?: string | 'independent' | null;
  verificationStatus?: CreatorVerification | CreatorVerification[];
  minDps?: number;
  maxDps?: number;
  minFollowers?: number;
  platforms?: string[];
  isActive?: boolean;
  sortBy?: 'handle' | 'created_at' | 'avg_dps' | 'total_videos' | 'follower_count' | 'verification_status';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseCreatorsResult {
  data: Creator[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface UseCreatorResult {
  data: Creator | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch a list of creators with optional filtering
 */
export function useCreators(filters: CreatorFilters = {}): UseCreatorsResult {
  const [data, setData] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchCreators = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('creators')
        .select(`
          *,
          user:profiles!creators_user_id_fkey(*),
          agency:agencies!creators_agency_id_fkey(id, name, slug, tier)
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`handle.ilike.%${filters.search}%,display_name.ilike.%${filters.search}%`);
      }

      // Apply agency filter
      if (filters.agencyId === 'independent') {
        query = query.is('agency_id', null);
      } else if (filters.agencyId) {
        query = query.eq('agency_id', filters.agencyId);
      }

      // Apply verification status filter
      if (filters.verificationStatus) {
        const statuses = Array.isArray(filters.verificationStatus) 
          ? filters.verificationStatus 
          : [filters.verificationStatus];
        query = query.in('verification_status', statuses);
      }

      // Apply DPS filters
      if (filters.minDps !== undefined) {
        query = query.gte('avg_dps', filters.minDps);
      }
      if (filters.maxDps !== undefined) {
        query = query.lte('avg_dps', filters.maxDps);
      }

      // Apply follower filter
      if (filters.minFollowers !== undefined) {
        query = query.gte('follower_count', filters.minFollowers);
      }

      // Apply active filter
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
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

      const { data: creators, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(creators || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch creators'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.agencyId,
    filters.verificationStatus,
    filters.minDps,
    filters.maxDps,
    filters.minFollowers,
    filters.isActive,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  return { data, loading, error, count, refetch: fetchCreators };
}

/**
 * Fetch a single creator by ID
 */
export function useCreator(id: string | null): UseCreatorResult {
  const [data, setData] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCreator = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: creator, error: queryError } = await supabase
        .from('creators')
        .select(`
          *,
          user:profiles!creators_user_id_fkey(*),
          agency:agencies!creators_agency_id_fkey(*),
          verified_by_user:profiles!creators_verified_by_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setData(creator);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch creator'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCreator();
  }, [fetchCreator]);

  return { data, loading, error, refetch: fetchCreator };
}

/**
 * Fetch creators pending verification
 */
export function usePendingCreators(): UseCreatorsResult {
  return useCreators({
    verificationStatus: 'pending',
    sortBy: 'created_at',
    sortOrder: 'asc',
  });
}

/**
 * Fetch creators for a specific agency
 */
export function useAgencyCreators(agencyId: string | null): UseCreatorsResult {
  const [data, setData] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchCreators = useCallback(async () => {
    if (!agencyId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: creators, error: queryError, count: totalCount } = await supabase
        .from('creators')
        .select(`
          *,
          user:profiles!creators_user_id_fkey(*)
        `, { count: 'exact' })
        .eq('agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setData(creators || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch agency creators'));
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    fetchCreators();
  }, [fetchCreators]);

  return { data, loading, error, count, refetch: fetchCreators };
}

// =============================================
// MUTATIONS
// =============================================

export function useCreatorMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateCreator = async (id: string, data: Partial<Creator>): Promise<Creator | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: creator, error: updateError } = await supabase
        .from('creators')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return creator;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update creator'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyCreator = async (
    id: string, 
    status: CreatorVerification, 
    notes?: string
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const updateData: Partial<Creator> = {
        verification_status: status,
        verification_notes: notes || null,
      };

      if (status === 'verified' || status === 'featured') {
        updateData.verified_at = new Date().toISOString();
        updateData.verified_by = user?.id || null;
      }

      const { error: updateError } = await supabase
        .from('creators')
        .update(updateData)
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to verify creator'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const assignToAgency = async (creatorId: string, agencyId: string | null): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('creators')
        .update({ agency_id: agencyId })
        .eq('id', creatorId);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to assign creator to agency'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const suspendCreator = async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('creators')
        .update({
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          is_active: false,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to suspend creator'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    updateCreator,
    verifyCreator,
    assignToAgency,
    suspendCreator,
  };
}

























































































