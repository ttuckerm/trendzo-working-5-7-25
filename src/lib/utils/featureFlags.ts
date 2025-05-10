// src/lib/utils/featureFlags.ts
import { remoteConfig, refreshRemoteConfig } from '@/lib/firebase/firebase';
import { getValue } from 'firebase/remote-config';

export type FeatureFlag = 
  | 'maintenance_mode'
  | 'show_new_feature'
  | 'max_daily_prompts'
  | 'enable_analytics';

export class FeatureFlagManager {
  private static instance: FeatureFlagManager;
  
  private constructor() {}
  
  static getInstance(): FeatureFlagManager {
    if (!FeatureFlagManager.instance) {
      FeatureFlagManager.instance = new FeatureFlagManager();
    }
    return FeatureFlagManager.instance;
  }
  
  async initialize() {
    await refreshRemoteConfig();
  }
  
  getBoolean(flag: FeatureFlag): boolean {
    if (!remoteConfig) return false;
    return getValue(remoteConfig, flag).asBoolean();
  }
  
  getNumber(flag: FeatureFlag): number {
    if (!remoteConfig) return 0;
    return getValue(remoteConfig, flag).asNumber();
  }
  
  getString(flag: FeatureFlag): string {
    if (!remoteConfig) return '';
    return getValue(remoteConfig, flag).asString();
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