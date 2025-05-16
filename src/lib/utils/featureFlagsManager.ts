import { supabaseClient } from '../supabase-client';

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

class FeatureFlagsManager {
  private flags: Record<string, boolean> = {};
  private isLoaded: boolean = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    // Initialize with empty flags
    this.flags = {};
  }

  /**
   * Load all feature flags from Supabase
   */
  async loadFlags(): Promise<void> {
    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = new Promise(async (resolve, reject) => {
      try {
        const { data, error } = await supabaseClient
          .from('feature_flags')
          .select('*');

        if (error) {
          throw error;
        }

        // Reset flags
        this.flags = {};

        // Initialize flags from data
        if (data) {
          data.forEach((flag: FeatureFlag) => {
            this.flags[flag.name] = flag.enabled;
          });
        }

        this.isLoaded = true;
        resolve();
      } catch (error) {
        console.error('Failed to load feature flags:', error);
        reject(error);
      } finally {
        this.loadPromise = null;
      }
    });

    return this.loadPromise;
  }

  /**
   * Get the state of a feature flag
   * @param flagName The name of the flag to check
   * @param defaultValue The default value if the flag is not found
   */
  async isEnabled(flagName: string, defaultValue: boolean = false): Promise<boolean> {
    if (!this.isLoaded) {
      await this.loadFlags();
    }
    
    return flagName in this.flags ? this.flags[flagName] : defaultValue;
  }

  /**
   * Set the state of a feature flag in Supabase
   * @param flagName The name of the flag to update
   * @param enabled The new state of the flag
   */
  async setFlag(flagName: string, enabled: boolean): Promise<void> {
    try {
      // First, check if the flag exists
      const { data, error } = await supabaseClient
        .from('feature_flags')
        .select('id')
        .eq('name', flagName)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        // Update existing flag
        const { error: updateError } = await supabaseClient
          .from('feature_flags')
          .update({ enabled, updated_at: new Date() })
          .eq('id', data.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create new flag
        const { error: insertError } = await supabaseClient
          .from('feature_flags')
          .insert([
            { 
              name: flagName, 
              enabled, 
              description: `Feature flag for ${flagName}`,
              created_at: new Date(),
              updated_at: new Date()
            }
          ]);

        if (insertError) {
          throw insertError;
        }
      }

      // Update local state
      this.flags[flagName] = enabled;
    } catch (error) {
      console.error(`Failed to set feature flag ${flagName}:`, error);
      throw error;
    }
  }

  /**
   * Get all available feature flags
   */
  async getAllFlags(): Promise<FeatureFlag[]> {
    try {
      const { data, error } = await supabaseClient
        .from('feature_flags')
        .select('*')
        .order('name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get all feature flags:', error);
      throw error;
    }
  }

  /**
   * Create a new feature flag
   */
  async createFlag(name: string, description: string, enabled: boolean = false): Promise<FeatureFlag> {
    try {
      const { data, error } = await supabaseClient
        .from('feature_flags')
        .insert([
          { 
            name, 
            description, 
            enabled,
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      this.flags[name] = enabled;
      
      return data;
    } catch (error) {
      console.error(`Failed to create feature flag ${name}:`, error);
      throw error;
    }
  }

  /**
   * Delete a feature flag
   */
  async deleteFlag(flagName: string): Promise<void> {
    try {
      const { error } = await supabaseClient
        .from('feature_flags')
        .delete()
        .eq('name', flagName);

      if (error) {
        throw error;
      }

      // Update local state
      delete this.flags[flagName];
    } catch (error) {
      console.error(`Failed to delete feature flag ${flagName}:`, error);
      throw error;
    }
  }
}

// Export a singleton instance
export const featureFlagsManager = new FeatureFlagsManager();