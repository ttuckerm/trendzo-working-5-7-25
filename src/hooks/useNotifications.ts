import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification, NotificationType } from '@/types/admin';
import type { RealtimeChannel } from '@supabase/supabase-js';

// =============================================
// TYPES
// =============================================

export interface NotificationFilters {
  type?: NotificationType | NotificationType[];
  isRead?: boolean;
  limit?: number;
  offset?: number;
}

export interface UseNotificationsResult {
  data: Notification[];
  loading: boolean;
  error: Error | null;
  unreadCount: number;
  refetch: () => Promise<void>;
  markAsRead: (id: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  deleteNotification: (id: string) => Promise<boolean>;
}

// =============================================
// HOOKS
// =============================================

/**
 * Fetch notifications with real-time subscription
 */
export function useNotifications(
  filters: NotificationFilters = {},
  enableRealtime: boolean = true
): UseNotificationsResult {
  const [data, setData] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setData([]);
        setUnreadCount(0);
        return;
      }

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      // Apply type filter
      if (filters.type) {
        const types = Array.isArray(filters.type) ? filters.type : [filters.type];
        query = query.in('type', types);
      }

      // Apply read filter
      if (filters.isRead !== undefined) {
        query = query.eq('is_read', filters.isRead);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data: notifications, error: queryError } = await query;

      if (queryError) throw queryError;

      setData(notifications || []);

      // Fetch unread count separately
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setUnreadCount(count || 0);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notifications'));
    } finally {
      setLoading(false);
    }
  }, [filters.type, filters.isRead, filters.limit, filters.offset]);

  // Set up real-time subscription
  useEffect(() => {
    if (!enableRealtime) return;

    const supabase = createClient();
    
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Subscribe to new notifications
      channelRef.current = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotification = payload.new as Notification;
            setData((prev) => [newNotification, ...prev]);
            setUnreadCount((prev) => prev + 1);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const updatedNotification = payload.new as Notification;
            setData((prev) =>
              prev.map((n) =>
                n.id === updatedNotification.id ? updatedNotification : n
              )
            );
            // Recalculate unread count
            if (updatedNotification.is_read && !payload.old?.is_read) {
              setUnreadCount((prev) => Math.max(0, prev - 1));
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'DELETE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setData((prev) => prev.filter((n) => n.id !== deletedId));
              // If the deleted notification was unread, decrement count
              const wasUnread = !payload.old?.is_read;
              if (wasUnread) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscription();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, [enableRealtime]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Mark as read
  const markAsRead = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // Update local state
      setData((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      return true;
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      return false;
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error: updateError } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (updateError) throw updateError;

      // Update local state
      setData((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      setUnreadCount(0);

      return true;
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      return false;
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (id: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      
      // Check if notification was unread before deleting
      const notification = data.find((n) => n.id === id);
      const wasUnread = notification && !notification.is_read;

      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Update local state
      setData((prev) => prev.filter((n) => n.id !== id));
      if (wasUnread) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      return true;
    } catch (err) {
      console.error('Failed to delete notification:', err);
      return false;
    }
  }, [data]);

  return {
    data,
    loading,
    error,
    unreadCount,
    refetch: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook for just the unread count (lightweight)
 */
export function useUnreadNotificationCount(): { count: number; loading: boolean } {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const supabase = createClient();

    const fetchCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCount(0);
        setLoading(false);
        return;
      }

      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      setCount(unreadCount || 0);
      setLoading(false);

      // Subscribe to changes
      channelRef.current = supabase
        .channel('notification-count')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            // Refetch count on any change
            supabase
              .from('notifications')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('is_read', false)
              .then(({ count }) => setCount(count || 0));
          }
        )
        .subscribe();
    };

    fetchCount();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
      }
    };
  }, []);

  return { count, loading };
}

























































































