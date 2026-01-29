import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Payout, PayoutStatus } from '@/types/admin';
import type { PayoutStats } from '@/lib/supabase/types';

// =============================================
// TYPES
// =============================================

export interface PayoutFilters {
  search?: string;
  status?: PayoutStatus | PayoutStatus[];
  recipientType?: ('clipper' | 'developer' | 'affiliate' | 'creator') | ('clipper' | 'developer' | 'affiliate' | 'creator')[];
  recipientId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'requested_at' | 'amount_cents' | 'status' | 'processed_at';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UsePayoutsResult {
  data: Payout[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface UsePayoutResult {
  data: Payout | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export interface UsePayoutStatsResult {
  data: PayoutStats | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch a list of payouts with optional filtering
 */
export function usePayouts(filters: PayoutFilters = {}): UsePayoutsResult {
  const [data, setData] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('payouts')
        .select(`
          *,
          recipient:profiles!payouts_recipient_id_fkey(*),
          processor_user:profiles!payouts_processed_by_fkey(*)
        `, { count: 'exact' });

      // Apply status filter
      if (filters.status) {
        const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
        query = query.in('status', statuses);
      }

      // Apply recipient type filter
      if (filters.recipientType) {
        const types = Array.isArray(filters.recipientType) 
          ? filters.recipientType 
          : [filters.recipientType];
        query = query.in('recipient_type', types);
      }

      // Apply recipient ID filter
      if (filters.recipientId) {
        query = query.eq('recipient_id', filters.recipientId);
      }

      // Apply amount filters
      if (filters.minAmount !== undefined) {
        query = query.gte('amount_cents', filters.minAmount);
      }
      if (filters.maxAmount !== undefined) {
        query = query.lte('amount_cents', filters.maxAmount);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('requested_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('requested_at', filters.dateTo);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'requested_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: payouts, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(payouts || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payouts'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.status,
    filters.recipientType,
    filters.recipientId,
    filters.minAmount,
    filters.maxAmount,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return { data, loading, error, count, refetch: fetchPayouts };
}

/**
 * Fetch a single payout by ID
 */
export function usePayout(id: string | null): UsePayoutResult {
  const [data, setData] = useState<Payout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchPayout = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: payout, error: queryError } = await supabase
        .from('payouts')
        .select(`
          *,
          recipient:profiles!payouts_recipient_id_fkey(*),
          processor_user:profiles!payouts_processed_by_fkey(*),
          requested_by_user:profiles!payouts_requested_by_fkey(*)
        `)
        .eq('id', id)
        .single();

      if (queryError) throw queryError;

      setData(payout);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payout'));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchPayout();
  }, [fetchPayout]);

  return { data, loading, error, refetch: fetchPayout };
}

/**
 * Fetch pending payouts
 */
export function usePendingPayouts(): UsePayoutsResult {
  return usePayouts({
    status: 'pending',
    sortBy: 'requested_at',
    sortOrder: 'asc',
  });
}

/**
 * Fetch payout statistics
 */
export function usePayoutStats(): UsePayoutStatsResult {
  const [data, setData] = useState<PayoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Fetch counts by status
      const [pendingResult, processingResult, completedResult, failedResult] = await Promise.all([
        supabase.from('payouts').select('amount_cents', { count: 'exact' }).eq('status', 'pending'),
        supabase.from('payouts').select('amount_cents', { count: 'exact' }).eq('status', 'processing'),
        supabase.from('payouts').select('amount_cents', { count: 'exact' }).eq('status', 'completed'),
        supabase.from('payouts').select('amount_cents', { count: 'exact' }).eq('status', 'failed'),
      ]);

      // Calculate amounts
      const pendingAmount = (pendingResult.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
      const processingAmount = (processingResult.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
      const completedAmount = (completedResult.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);

      // Fetch this month's completed payouts
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data: thisMonthPayouts } = await supabase
        .from('payouts')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('processed_at', startOfMonth.toISOString());

      const completedThisMonth = (thisMonthPayouts || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);

      setData({
        totalPending: pendingResult.count || 0,
        totalProcessing: processingResult.count || 0,
        totalCompleted: completedResult.count || 0,
        totalFailed: failedResult.count || 0,
        pendingAmountCents: pendingAmount,
        processingAmountCents: processingAmount,
        completedThisMonthCents: completedThisMonth,
        completedAllTimeCents: completedAmount,
      });
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch payout stats'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { data, loading, error, refetch: fetchStats };
}

// =============================================
// MUTATIONS
// =============================================

export function usePayoutMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const processPayout = async (
    id: string, 
    processor: string, 
    processorReference?: string,
    processorFee?: number
  ): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          status: 'completed',
          processor,
          processor_reference: processorReference || null,
          processor_fee_cents: processorFee || 0,
          processed_at: new Date().toISOString(),
          processed_by: user?.id,
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to process payout'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markProcessing = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('payouts')
        .update({ status: 'processing' })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark payout as processing'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const failPayout = async (id: string, reason: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          status: 'failed',
          failure_reason: reason,
          retry_count: supabase.rpc ? undefined : 0, // Would increment via RPC
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fail payout'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const retryPayout = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('payouts')
        .update({
          status: 'pending',
          failure_reason: null,
          last_retry_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to retry payout'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  const bulkProcess = async (ids: string[], processor: string): Promise<{ success: number; failed: number }> => {
    setLoading(true);
    setError(null);
    let success = 0;
    let failed = 0;

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      for (const id of ids) {
        const { error } = await supabase
          .from('payouts')
          .update({
            status: 'completed',
            processor,
            processed_at: new Date().toISOString(),
            processed_by: user?.id,
          })
          .eq('id', id);

        if (error) {
          failed++;
        } else {
          success++;
        }
      }

      return { success, failed };
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to bulk process payouts'));
      return { success, failed: ids.length - success };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    processPayout,
    markProcessing,
    failPayout,
    retryPayout,
    bulkProcess,
  };
}

























































































