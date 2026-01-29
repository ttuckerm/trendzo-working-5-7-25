import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface SystemAlert {
  id: string;
  alert_id: string;
  alert_type: string;
  created_at: string;
  severity: 'info' | 'warning' | 'error';
  source: string;
  alert_message: string;
  affected_components: string[];
  is_read: boolean;
}

export class AlertService {
  
  /**
   * Log a new alert to the system_alerts table
   */
  static async logAlert(
    severity: 'info' | 'warning' | 'error', 
    source: string, 
    message: string
  ): Promise<SystemAlert> {
    try {
      console.log(`[ALERT SERVICE] Logging ${severity} alert from ${source}: ${message}`);
      
      // Generate alert_id as required by database
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error } = await supabase
        .from('system_alerts')
        .insert({
          alert_id: alertId,
          alert_type: 'system_event', // Required field
          severity,
          source,
          alert_message: message, // Database uses alert_message, not message
          affected_components: [source], // Required field - array of affected components
          is_read: false
        })
        .select()
        .single();

      if (error) {
        console.error('[ALERT SERVICE] Failed to log alert:', error);
        throw error;
      }

      console.log(`[ALERT SERVICE] Alert logged successfully with ID: ${data.id}`);
      return data;
    } catch (error) {
      console.error('[ALERT SERVICE] Error logging alert:', error);
      throw error;
    }
  }

  /**
   * Get all unread alerts ordered by creation date (newest first)
   */
  static async getUnreadAlerts(): Promise<SystemAlert[]> {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .eq('is_read', false)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ALERT SERVICE] Failed to fetch unread alerts:', error);
        throw error;
      }

      console.log(`[ALERT SERVICE] Retrieved ${data?.length || 0} unread alerts`);
      return data || [];
    } catch (error) {
      console.error('[ALERT SERVICE] Error fetching unread alerts:', error);
      throw error;
    }
  }

  /**
   * Get all alerts (read and unread) with optional limit
   */
  static async getAllAlerts(limit: number = 50): Promise<SystemAlert[]> {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[ALERT SERVICE] Failed to fetch alerts:', error);
        throw error;
      }

      console.log(`[ALERT SERVICE] Retrieved ${data?.length || 0} alerts`);
      return data || [];
    } catch (error) {
      console.error('[ALERT SERVICE] Error fetching alerts:', error);
      throw error;
    }
  }

  /**
   * Mark an alert as read
   */
  static async markAlertAsRead(id: string): Promise<void> {
    try {
      console.log(`[ALERT SERVICE] Marking alert ${id} as read`);
      
      const { error } = await supabase
        .from('system_alerts')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('[ALERT SERVICE] Failed to mark alert as read:', error);
        throw error;
      }

      console.log(`[ALERT SERVICE] Alert ${id} marked as read successfully`);
    } catch (error) {
      console.error('[ALERT SERVICE] Error marking alert as read:', error);
      throw error;
    }
  }

  /**
   * Mark all alerts as read
   */
  static async markAllAlertsAsRead(): Promise<void> {
    try {
      console.log('[ALERT SERVICE] Marking all alerts as read');
      
      const { error } = await supabase
        .from('system_alerts')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) {
        console.error('[ALERT SERVICE] Failed to mark all alerts as read:', error);
        throw error;
      }

      console.log('[ALERT SERVICE] All alerts marked as read successfully');
    } catch (error) {
      console.error('[ALERT SERVICE] Error marking all alerts as read:', error);
      throw error;
    }
  }

  /**
   * Delete old alerts (older than specified days)
   */
  static async cleanupOldAlerts(daysOld: number = 30): Promise<number> {
    try {
      console.log(`[ALERT SERVICE] Cleaning up alerts older than ${daysOld} days`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { data, error } = await supabase
        .from('system_alerts')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select();

      if (error) {
        console.error('[ALERT SERVICE] Failed to cleanup old alerts:', error);
        throw error;
      }

      const deletedCount = data?.length || 0;
      console.log(`[ALERT SERVICE] Cleaned up ${deletedCount} old alerts`);
      return deletedCount;
    } catch (error) {
      console.error('[ALERT SERVICE] Error cleaning up old alerts:', error);
      throw error;
    }
  }

  /**
   * Get alert count by severity
   */
  static async getAlertCountBySeverity(): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('system_alerts')
        .select('severity')
        .eq('is_read', false);

      if (error) {
        console.error('[ALERT SERVICE] Failed to get alert counts:', error);
        throw error;
      }

      const counts = { info: 0, warning: 0, error: 0 };
      data?.forEach(alert => {
        counts[alert.severity as keyof typeof counts]++;
      });

      console.log('[ALERT SERVICE] Alert counts:', counts);
      return counts;
    } catch (error) {
      console.error('[ALERT SERVICE] Error getting alert counts:', error);
      throw error;
    }
  }
}