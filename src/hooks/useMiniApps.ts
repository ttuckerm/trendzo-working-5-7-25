import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MiniApp, AppApprovalStatus, MiniAppWithStats } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface MiniAppFilters {
  search?: string;
  category?: string | string[];
  approvalStatus?: AppApprovalStatus | AppApprovalStatus[];
  developerId?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  isActive?: boolean;
  minRating?: number;
  minInstalls?: number;
  sortBy?: 'name' | 'created_at' | 'install_count' | 'rating' | 'total_revenue_cents' | 'price_monthly';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseMiniAppsResult {
  data: MiniApp[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface UseMiniAppResult {
  data: MiniApp | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch a list of mini apps with optional filtering
 */
export function useMiniApps(filters: MiniAppFilters = {}): UseMiniAppsResult {
  const [data, setData] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchMiniApps = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('mini_apps')
        .select(`
          *,
          developer:developers!mini_apps_developer_id_fkey(id, display_name, company_name, logo_url, is_verified)
        `, { count: 'exact' });

      // Apply search filter
      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,tagline.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      // Apply category filter
      if (filters.category) {
        const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
        query = query.in('category', categories);
      }

      // Apply approval status filter
      if (filters.approvalStatus) {
        const statuses = Array.isArray(filters.approvalStatus) 
          ? filters.approvalStatus 
          : [filters.approvalStatus];
        query = query.in('approval_status', statuses);
      }

      // Apply developer filter
      if (filters.developerId) {
        query = query.eq('developer_id', filters.developerId);
      }

      // Apply pricing filter
      if (filters.isFree !== undefined) {
        query = query.eq('is_free', filters.isFree);
      }

      // Apply featured filter
      if (filters.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }

      // Apply active filter
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      // Apply rating filter
      if (filters.minRating !== undefined) {
        query = query.gte('rating', filters.minRating);
      }

      // Apply install filter
      if (filters.minInstalls !== undefined) {
        query = query.gte('install_count', filters.minInstalls);
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

      const { data: apps, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(apps || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch mini apps'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.category,
    filters.approvalStatus,
    filters.developerId,
    filters.isFree,
    filters.isFeatured,
    filters.isActive,
    filters.minRating,
    filters.minInstalls,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchMiniApps();
  }, [fetchMiniApps]);

  return { data, loading, error, count, refetch: fetchMiniApps };
}

/**
 * Fetch a single mini app by ID
 */
export function useMiniApp(id: string | null): UseMiniAppResult {
  const [data, setData] = useState<MiniApp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMiniApp = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: app, error: queryError } = await supabase
        .from('mini_apps')
        .select(`
          *,
          developer:developers!mini_apps_developer_id_fkey(*),
          reviews:mini_app_reviews(*, user:profiles(*)),
          installs:mini_app_installs(count)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setData(app);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch mini app'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchMiniApp();
  }, [fetchMiniApp]);

  return { data, loading, error, refetch: fetchMiniApp };
}

/**
 * Fetch featured mini apps
 */
export function useFeaturedMiniApps(limit: number = 6): UseMiniAppsResult {
  return useMiniApps({
    isFeatured: true,
    approvalStatus: 'approved',
    isActive: true,
    sortBy: 'install_count',
    sortOrder: 'desc',
    limit,
  });
}

/**
 * Fetch mini apps pending approval
 */
export function usePendingMiniApps(): UseMiniAppsResult {
  return useMiniApps({
    approvalStatus: 'pending',
    sortBy: 'created_at',
    sortOrder: 'asc',
  });
}

/**
 * Fetch apps for a specific developer
 */
export function useDeveloperApps(developerId: string | null): UseMiniAppsResult {
  const [data, setData] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchApps = useCallback(async () => {
    if (!developerId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: apps, error: queryError, count: totalCount } = await supabase
        .from('mini_apps')
        .select('*', { count: 'exact' })
        .eq('developer_id', developerId)
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setData(apps || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch developer apps'));
    } finally {
      setLoading(false);
    }
  }, [developerId]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  return { data, loading, error, count, refetch: fetchApps };
}

/**
 * Get unique app categories
 */
export function useMiniAppCategories() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: apps, error: queryError } = await supabase
        .from('mini_apps')
        .select('category')
        .not('category', 'is', null)
        .eq('is_active', true)
        .eq('approval_status', 'approved');

      if (queryError) throw queryError;

      const categories = [...new Set((apps || []).map(a => a.category).filter(Boolean))] as string[];
      setData(categories.sort());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch categories'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { data, loading, error, refetch: fetchCategories };
}

// =============================================
// MUTATIONS
// =============================================

export function useMiniAppMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createMiniApp = async (data: Partial<MiniApp>): Promise<MiniApp | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: app, error: createError } = await supabase
        .from('mini_apps')
        .insert({
          ...data,
          approval_status: 'pending',
        })
        .select()
        .single();

      if (createError) throw createError;
      return app;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create mini app'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateMiniApp = async (id: string, data: Partial<MiniApp>): Promise<MiniApp | null> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: app, error: updateError } = await supabase
        .from('mini_apps')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;
      return app;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update mini app'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const approveMiniApp = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('mini_apps')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          rejection_reason: null,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to approve mini app'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rejectMiniApp = async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('mini_apps')
        .update({
          approval_status: 'rejected',
          rejection_reason: reason,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reject mini app'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const featureMiniApp = async (id: string, featured: boolean): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('mini_apps')
        .update({
          is_featured: featured,
          featured_at: featured ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update featured status'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const suspendMiniApp = async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('mini_apps')
        .update({
          approval_status: 'suspended',
          suspended_at: new Date().toISOString(),
          suspension_reason: reason,
          is_active: false,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to suspend mini app'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createMiniApp,
    updateMiniApp,
    approveMiniApp,
    rejectMiniApp,
    featureMiniApp,
    suspendMiniApp,
  };
}

























































































