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
      // In development mode, use default values if Supabase connection fails
      if (process.env.NODE_ENV === 'development') {
        try {
          // Try to connect to Supabase with a timeout
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Connection timeout')), 5000);
          });
          
          const dbPromise = db.from('feature_flags').select('*');
          
          const { data, error } = await Promise.race([dbPromise, timeoutPromise]) as any;
          
          if (error) throw error;
          
          data?.forEach((flag: any) => {
            if (flag.enabled) {
              // Parse the value if it's stored as a string
              let value = flag.value;
              if (typeof value === 'string') {
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(Number(value))) value = Number(value);
              }
              this.flags.set(flag.key, value);
            }
          });
          
          console.log('Initialized feature flags from Supabase:', this.flags);
        } catch (error) {
          console.warn('Failed to connect to Supabase for feature flags, using defaults:', error);
          // Set default values for development
          this.setDefaultFlags();
        }
      } else {
        // Production mode - let errors bubble up
        const { data, error } = await db.from('feature_flags').select('*');
        
        if (error) throw error;
        
        data?.forEach((flag: any) => {
          if (flag.enabled) {
            // Parse the value if it's stored as a string
            let value = flag.value;
            if (typeof value === 'string') {
              if (value === 'true') value = true;
              else if (value === 'false') value = false;
              else if (!isNaN(Number(value))) value = Number(value);
            }
            this.flags.set(flag.key, value);
          }
        });
        
        console.log('Initialized feature flags:', this.flags);
      }
    } catch (error) {
      console.error('Failed to initialize feature flags:', error);
      // Set defaults in case of any error
      this.setDefaultFlags();
    }
  }
  
  private setDefaultFlags() {
    // Default values for development
    this.flags.set('maintenance_mode', false);
    this.flags.set('show_new_feature', true);
    this.flags.set('max_daily_prompts', 100);
    this.flags.set('enable_analytics', true);
    console.log('Using default feature flags:', this.flags);
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