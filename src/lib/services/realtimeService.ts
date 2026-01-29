import { supabaseClient } from '@/lib/supabase-client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface LiveActivityEvent {
  id: string;
  event_type: string;
  visitor_id: string;
  landing_page_id?: string;
  metadata: {
    niche?: string;
    platform?: string;
    location?: string;
    templateId?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface TemplateUpdateEvent {
  id: string;
  name: string;
  niche: string;
  platform: string;
  viral_score: number;
  usage_count: number;
  updated_at: string;
}

export interface UserActivityEvent {
  user_id: string;
  activity_type: string;
  details: Record<string, any>;
  timestamp: string;
}

/**
 * Real-time Service for TRENDZO MVP
 * Handles live updates for admin dashboard and user notifications
 */
export class RealtimeService {
  private static instance: RealtimeService;
  private channels: Map<string, RealtimeChannel> = new Map();
  private isConnected: boolean = false;

  private constructor() {}

  static getInstance(): RealtimeService {
    if (!RealtimeService.instance) {
      RealtimeService.instance = new RealtimeService();
    }
    return RealtimeService.instance;
  }

  /**
   * Subscribe to live activity feed for landing page metrics
   */
  subscribeToLiveActivity(callback: (event: LiveActivityEvent) => void): () => void {
    const channelName = 'live_activity';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_analytics',
          filter: 'event_type=in.(page_view,email_capture,template_complete,exit_intent_convert)'
        },
        (payload) => {
          const event: LiveActivityEvent = {
            id: payload.new.id,
            event_type: payload.new.event_type,
            visitor_id: payload.new.visitor_id,
            landing_page_id: payload.new.landing_page_id,
            metadata: payload.new.metadata || {},
            created_at: payload.new.created_at
          };
          
          callback(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
          console.log('✅ Live activity subscription active');
        }
      });

    this.channels.set(channelName, channel);

    // Return unsubscribe function
    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to template performance updates
   */
  subscribeToTemplateUpdates(callback: (event: TemplateUpdateEvent) => void): () => void {
    const channelName = 'template_updates';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates'
        },
        (payload) => {
          if (payload.new) {
            const event: TemplateUpdateEvent = {
              id: payload.new.id,
              name: payload.new.name,
              niche: payload.new.niche,
              platform: payload.new.platform,
              viral_score: payload.new.viral_score || 0,
              usage_count: payload.new.usage_count || 0,
              updated_at: payload.new.updated_at
            };
            
            callback(event);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Template updates subscription active');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to user activity for personalized notifications
   */
  subscribeToUserActivity(
    userId: string, 
    callback: (event: UserActivityEvent) => void
  ): () => void {
    const channelName = `user_activity_${userId}`;
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_analytics',
          filter: `metadata->>user_id=eq.${userId}`
        },
        (payload) => {
          const event: UserActivityEvent = {
            user_id: userId,
            activity_type: payload.new.event_type,
            details: payload.new.metadata || {},
            timestamp: payload.new.created_at
          };
          
          callback(event);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`✅ User activity subscription active for ${userId}`);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to viral alerts - when templates hit viral thresholds
   */
  subscribeToViralAlerts(callback: (alert: {
    templateId: string;
    userId: string;
    viralScore: number;
    views: number;
    platform: string;
  }) => void): () => void {
    const channelName = 'viral_alerts';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'templates',
          filter: 'viral_score=gte.80'
        },
        (payload) => {
          // Only trigger if viral score increased
          if (payload.old?.viral_score < 80 && payload.new?.viral_score >= 80) {
            callback({
              templateId: payload.new.id,
              userId: payload.new.user_id,
              viralScore: payload.new.viral_score,
              views: payload.new.estimated_views || 0,
              platform: payload.new.platform
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Viral alerts subscription active');
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Subscribe to admin dashboard metrics for real-time updates
   */
  subscribeToAdminMetrics(callback: (metrics: {
    newUsers: number;
    templatesCreated: number;
    totalViews: number;
    conversionRate: number;
  }) => void): () => void {
    const channelName = 'admin_metrics';
    
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    // Subscribe to multiple tables for comprehensive metrics
    const channel = supabaseClient
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users'
        },
        () => this.refreshAdminMetrics(callback)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'templates'
        },
        () => this.refreshAdminMetrics(callback)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'campaign_analytics'
        },
        () => this.refreshAdminMetrics(callback)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Admin metrics subscription active');
          // Initial load
          this.refreshAdminMetrics(callback);
        }
      });

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Broadcast custom events to specific channels
   */
  async broadcastEvent(channelName: string, event: string, payload: any): Promise<void> {
    const channel = this.channels.get(channelName);
    if (channel) {
      await channel.send({
        type: 'broadcast',
        event,
        payload
      });
    }
  }

  /**
   * Listen for custom broadcast events
   */
  subscribeToBroadcast(
    channelName: string, 
    eventName: string, 
    callback: (payload: any) => void
  ): () => void {
    if (this.channels.has(channelName)) {
      this.channels.get(channelName)?.unsubscribe();
    }

    const channel = supabaseClient
      .channel(channelName)
      .on('broadcast', { event: eventName }, ({ payload }) => {
        callback(payload);
      })
      .subscribe();

    this.channels.set(channelName, channel);

    return () => {
      channel.unsubscribe();
      this.channels.delete(channelName);
    };
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Cleanup all subscriptions
   */
  cleanup(): void {
    this.channels.forEach((channel) => {
      channel.unsubscribe();
    });
    this.channels.clear();
    this.isConnected = false;
  }

  /**
   * Private method to refresh admin metrics
   */
  private async refreshAdminMetrics(callback: (metrics: any) => void): Promise<void> {
    try {
      const { data, error } = await supabaseClient.rpc('get_admin_dashboard_metrics');
      
      if (error) {
        console.error('Error fetching admin metrics:', error);
        return;
      }

      if (data) {
        callback({
          newUsers: data.users?.newToday || 0,
          templatesCreated: data.templates?.createdToday || 0,
          totalViews: data.templates?.videosCreatedToday || 0,
          conversionRate: data.users?.growthRate || 0
        });
      }
    } catch (error) {
      console.error('Error in refreshAdminMetrics:', error);
    }
  }
}

// Export singleton instance
export const realtimeService = RealtimeService.getInstance();

// React hook for easier integration
export function useRealtimeSubscription<T>(
  subscriptionFn: (callback: (data: T) => void) => () => void,
  dependencies: any[] = []
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isConnected, setIsConnected] = React.useState(false);

  React.useEffect(() => {
    setIsConnected(true);
    const unsubscribe = subscriptionFn((newData: T) => {
      setData(newData);
    });

    return () => {
      setIsConnected(false);
      unsubscribe();
    };
  }, dependencies);

  return { data, isConnected };
}

// Import React if available (for the hook)
declare global {
  const React: any;
}