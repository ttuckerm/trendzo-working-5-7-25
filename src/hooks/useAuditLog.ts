import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { AuditLogEntry, UserRole } from '@/types/admin';

// =============================================
// TYPES
// =============================================

export interface AuditLogFilters {
  search?: string;
  actorId?: string;
  actorRole?: UserRole | UserRole[];
  action?: string | string[];
  actionCategory?: string | string[];
  resourceType?: string | string[];
  resourceId?: string;
  success?: boolean;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'action' | 'resource_type';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface UseAuditLogResult {
  data: AuditLogEntry[];
  loading: boolean;
  error: Error | null;
  count: number;
  refetch: () => Promise<void>;
}

export interface AuditLogStats {
  totalEvents: number;
  eventsByAction: Record<string, number>;
  eventsByResource: Record<string, number>;
  successRate: number;
  recentActors: { id: string; email: string; count: number }[];
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch audit log entries with optional filtering
 */
export function useAuditLog(filters: AuditLogFilters = {}): UseAuditLogResult {
  const [data, setData] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [count, setCount] = useState(0);

  const fetchAuditLog = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('audit_log')
        .select(`
          *,
          actor:profiles!audit_log_actor_id_fkey(id, display_name, email, avatar_url, role)
        `, { count: 'exact' });

      // Apply search filter (searches action, resource_name, actor_email)
      if (filters.search) {
        query = query.or(
          `action.ilike.%${filters.search}%,resource_name.ilike.%${filters.search}%,actor_email.ilike.%${filters.search}%`
        );
      }

      // Apply actor filters
      if (filters.actorId) {
        query = query.eq('actor_id', filters.actorId);
      }
      if (filters.actorRole) {
        const roles = Array.isArray(filters.actorRole) ? filters.actorRole : [filters.actorRole];
        query = query.in('actor_role', roles);
      }

      // Apply action filters
      if (filters.action) {
        const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
        query = query.in('action', actions);
      }
      if (filters.actionCategory) {
        const categories = Array.isArray(filters.actionCategory) 
          ? filters.actionCategory 
          : [filters.actionCategory];
        query = query.in('action_category', categories);
      }

      // Apply resource filters
      if (filters.resourceType) {
        const types = Array.isArray(filters.resourceType) 
          ? filters.resourceType 
          : [filters.resourceType];
        query = query.in('resource_type', types);
      }
      if (filters.resourceId) {
        query = query.eq('resource_id', filters.resourceId);
      }

      // Apply success filter
      if (filters.success !== undefined) {
        query = query.eq('success', filters.success);
      }

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
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
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data: entries, error: queryError, count: totalCount } = await query;

      if (queryError) throw queryError;

      setData(entries || []);
      setCount(totalCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch audit log'));
    } finally {
      setLoading(false);
    }
  }, [
    filters.search,
    filters.actorId,
    filters.actorRole,
    filters.action,
    filters.actionCategory,
    filters.resourceType,
    filters.resourceId,
    filters.success,
    filters.dateFrom,
    filters.dateTo,
    filters.sortBy,
    filters.sortOrder,
    filters.limit,
    filters.offset,
  ]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  return { data, loading, error, count, refetch: fetchAuditLog };
}

/**
 * Fetch audit log for a specific resource
 */
export function useResourceAuditLog(
  resourceType: string,
  resourceId: string
): UseAuditLogResult {
  return useAuditLog({
    resourceType,
    resourceId,
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  });
}

/**
 * Fetch audit log for a specific user
 */
export function useUserAuditLog(userId: string): UseAuditLogResult {
  return useAuditLog({
    actorId: userId,
    sortBy: 'created_at',
    sortOrder: 'desc',
    limit: 50,
  });
}

/**
 * Get unique action types from audit log
 */
export function useAuditLogActions() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchActions = async () => {
      try {
        const supabase = createClient();
        const { data: entries, error: queryError } = await supabase
          .from('audit_log')
          .select('action')
          .limit(1000);

        if (queryError) throw queryError;

        const uniqueActions = [...new Set((entries || []).map((e) => e.action))].sort();
        setData(uniqueActions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch actions'));
      } finally {
        setLoading(false);
      }
    };

    fetchActions();
  }, []);

  return { data, loading, error };
}

/**
 * Get unique resource types from audit log
 */
export function useAuditLogResourceTypes() {
  const [data, setData] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchResourceTypes = async () => {
      try {
        const supabase = createClient();
        const { data: entries, error: queryError } = await supabase
          .from('audit_log')
          .select('resource_type')
          .limit(1000);

        if (queryError) throw queryError;

        const uniqueTypes = [...new Set((entries || []).map((e) => e.resource_type))].sort();
        setData(uniqueTypes);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch resource types'));
      } finally {
        setLoading(false);
      }
    };

    fetchResourceTypes();
  }, []);

  return { data, loading, error };
}

/**
 * Export audit log entries
 */
export function useAuditLogExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportToCSV = useCallback(async (filters: AuditLogFilters = {}): Promise<string | null> => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.dateFrom) query = query.gte('created_at', filters.dateFrom);
      if (filters.dateTo) query = query.lte('created_at', filters.dateTo);
      if (filters.action) {
        const actions = Array.isArray(filters.action) ? filters.action : [filters.action];
        query = query.in('action', actions);
      }
      if (filters.resourceType) {
        const types = Array.isArray(filters.resourceType) ? filters.resourceType : [filters.resourceType];
        query = query.in('resource_type', types);
      }

      const { data: entries, error: queryError } = await query.limit(10000);

      if (queryError) throw queryError;

      // Convert to CSV
      if (!entries || entries.length === 0) return '';

      const headers = ['created_at', 'action', 'actor_email', 'actor_role', 'resource_type', 'resource_name', 'success', 'ip_address'];
      const rows = entries.map((entry) =>
        headers.map((h) => {
          const value = entry[h as keyof typeof entry];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : String(value ?? '');
        }).join(',')
      );

      return [headers.join(','), ...rows].join('\n');
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to export audit log'));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, exportToCSV };
}

























































































