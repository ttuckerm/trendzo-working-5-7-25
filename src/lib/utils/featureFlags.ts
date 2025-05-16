// src/lib/utils/featureFlags.ts
import { db } from '@/lib/database';

export type FeatureFlag = 
  | 'maintenance_mode'
  | 'show_new_feature'
  | 'max_daily_prompts'
  | 'enable_analytics';

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, any> = new Map();
  
  // Always use Supabase - hardcoded for now
  private useSupabase: boolean = true;
  
  private constructor() {}
  
  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }
  
  async initialize() {
    try {
      // Hardcoded to always use Supabase
      // Get feature flags from Supabase
      const { data, error } = await db.from('feature_flags').select('*');
      
      if (error) throw error;
      
      data?.forEach((flag: any) => {
        if (flag.enabled) {
          // Parse the value if it's stored as a string
          let value = flag.value;
          if (typeof value === 'string') {
            if (value === 'true') value = true;
            else if (value === 'false') value = false;
            else if (!isNaN(value)) value = Number(value);
          }
          this.flags.set(flag.key, value);
        }
      });
      
      console.log('Initialized feature flags:', this.flags);
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
    }
  }
  
  getBoolean(flag: FeatureFlag): boolean {
    const value = this.flags.get(flag);
    return typeof value === 'boolean' ? value : false;
  }
  
  getNumber(flag: FeatureFlag): number {
    const value = this.flags.get(flag);
    return typeof value === 'number' ? value : 0;
  }
  
  getString(flag: FeatureFlag): string {
    const value = this.flags.get(flag);
    return typeof value === 'string' ? value : '';
  }
  
  // Convenience methods for specific flags
  isMaintenanceMode(): boolean {
    return this.getBoolean('maintenance_mode');
  }
  
  isNewFeatureEnabled(): boolean {
    return this.getBoolean('show_new_feature');
  }
  
  getMaxDailyPrompts(): number {
    return this.getNumber('max_daily_prompts');
  }
  
  isAnalyticsEnabled(): boolean {
    return this.getBoolean('enable_analytics');
  }
}

export const featureFlags = FeatureFlagManager.getInstance();