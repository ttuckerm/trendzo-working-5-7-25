// src/lib/utils/featureFlags.ts
import { remoteConfig, refreshRemoteConfig } from '@/lib/firebase/firebase';
import { getValue } from 'firebase/remote-config';
import { db } from '@/lib/database';

export type FeatureFlag = 
  | 'maintenance_mode'
  | 'show_new_feature'
  | 'max_daily_prompts'
  | 'enable_analytics';

interface FeatureFlagData {
  key: string;
  value: any;
  enabled: boolean;
}

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  private flags: Map<string, any> = new Map();
  private useSupabase: boolean = process.env.NEXT_PUBLIC_USE_SUPABASE === 'true';
  
  private constructor() {}
  
  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }
  
  async initialize() {
    if (this.useSupabase) {
      // Supabase implementation
      try {
        const { data, error } = await db.from('feature_flags').select('*');
        if (error) throw error;
        
        data?.forEach((flag: FeatureFlagData) => {
          if (flag.enabled) {
            this.flags.set(flag.key, flag.value);
          }
        });
      } catch (error) {
        console.error('Failed to initialize feature flags from Supabase:', error);
      }
    } else {
      // Firebase Remote Config implementation
      await refreshRemoteConfig();
    }
  }
  
  getBoolean(flag: FeatureFlag): boolean {
    if (this.useSupabase) {
      const value = this.flags.get(flag);
      return typeof value === 'boolean' ? value : false;
    } else {
      if (!remoteConfig) return false;
      return getValue(remoteConfig, flag).asBoolean();
    }
  }
  
  getNumber(flag: FeatureFlag): number {
    if (this.useSupabase) {
      const value = this.flags.get(flag);
      return typeof value === 'number' ? value : 0;
    } else {
      if (!remoteConfig) return 0;
      return getValue(remoteConfig, flag).asNumber();
    }
  }
  
  getString(flag: FeatureFlag): string {
    if (this.useSupabase) {
      const value = this.flags.get(flag);
      return typeof value === 'string' ? value : '';
    } else {
      if (!remoteConfig) return '';
      return getValue(remoteConfig, flag).asString();
    }
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