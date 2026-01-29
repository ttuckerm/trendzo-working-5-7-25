/**
 * CleanCopy Mini App SDK
 * Provides restricted API access for third-party mini apps
 */

import { createClient } from '@supabase/supabase-js';

// SDK Version
export const SDK_VERSION = '1.0.0';

// Types
export interface VideoInput {
  url?: string;
  file?: File;
  transcript?: string;
  duration?: number;
  platform?: 'tiktok' | 'youtube' | 'instagram';
}

export interface DpsResult {
  score: number;
  confidence: number;
  attributes: {
    hookStrength: number;
    patternInterrupt: number;
    emotionalResonance: number;
    socialCurrency: number;
    valueDensity: number;
    retentionArchitecture: number;
    ctaPower: number;
    formatOptimization: number;
    trendAlignment: number;
  };
  recommendations: string[];
}

export interface Features {
  textual: Record<string, number>;
  visual: Record<string, number>;
  audio: Record<string, number>;
  metadata: Record<string, any>;
}

export interface GenerateParams {
  concept: string;
  platform: 'tiktok' | 'youtube' | 'instagram';
  length: number;
  niche?: string;
  style?: string;
}

export interface VideoResult {
  script: {
    hook: string;
    context: string;
    value: string;
    cta: string;
    fullScript: string;
  };
  predictedDps: number;
  cinematicPrompt?: string;
}

export interface MiniAppContext {
  user: {
    id: string;
    name: string;
    email?: string;
  };
  app: {
    id: string;
    name: string;
    version: string;
  };
  apis: {
    predictDps: (video: VideoInput) => Promise<DpsResult>;
    extractFeatures: (video: VideoInput) => Promise<Features>;
    generateVideo: (params: GenerateParams) => Promise<VideoResult>;
    generatePrompt: (script: string, genre?: string) => Promise<string>;
  };
  storage: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
    list: () => Promise<string[]>;
  };
  analytics: {
    track: (event: string, data?: any) => Promise<void>;
  };
}

export type MiniAppPlugin = (context: MiniAppContext) => Promise<any>;

/**
 * SDK Context Factory
 * Creates a sandboxed context for mini apps
 */
export class MiniAppSDK {
  private supabase: any;
  private userId: string;
  private appId: string;

  constructor(userId: string, appId: string) {
    this.userId = userId;
    this.appId = appId;

    // Initialize Supabase client with service key for app data access
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    );
  }

  /**
   * Create sandboxed context for mini app
   */
  async createContext(userInfo: { id: string; name: string; email?: string }, appInfo: { id: string; name: string; version: string }): Promise<MiniAppContext> {
    return {
      user: userInfo,
      app: appInfo,
      apis: this.createAPIs(),
      storage: this.createStorage(),
      analytics: this.createAnalytics(),
    };
  }

  /**
   * API wrappers with rate limiting and error handling
   */
  private createAPIs() {
    return {
      /**
       * DPS Prediction API
       */
      predictDps: async (video: VideoInput): Promise<DpsResult> => {
        try {
          // Track API usage
          await this.trackAPIUsage('predictDps');

          const response = await fetch('/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              transcript: video.transcript,
              platform: video.platform || 'tiktok',
            }),
          });

          if (!response.ok) {
            throw new Error(`DPS prediction failed: ${response.statusText}`);
          }

          const data = await response.json();

          return {
            score: data.dps || 0,
            confidence: data.confidence || 0.5,
            attributes: data.attributes || {},
            recommendations: data.recommendations || [],
          };
        } catch (error: any) {
          throw new Error(`SDK.predictDps error: ${error.message}`);
        }
      },

      /**
       * Feature Extraction API
       */
      extractFeatures: async (video: VideoInput): Promise<Features> => {
        try {
          await this.trackAPIUsage('extractFeatures');

          // For now, return basic features
          // TODO: Implement full feature extraction endpoint
          return {
            textual: {},
            visual: {},
            audio: {},
            metadata: {
              platform: video.platform,
              duration: video.duration,
            },
          };
        } catch (error: any) {
          throw new Error(`SDK.extractFeatures error: ${error.message}`);
        }
      },

      /**
       * Video Script Generation API
       */
      generateVideo: async (params: GenerateParams): Promise<VideoResult> => {
        try {
          await this.trackAPIUsage('generateVideo');

          const response = await fetch('/api/generate/script', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              concept: params.concept,
              platform: params.platform,
              length: params.length,
              niche: params.niche,
              style: params.style,
            }),
          });

          if (!response.ok) {
            throw new Error(`Video generation failed: ${response.statusText}`);
          }

          const data = await response.json();

          return {
            script: data.data.script,
            predictedDps: data.data.predictedDps,
            cinematicPrompt: data.data.cinematicPrompt,
          };
        } catch (error: any) {
          throw new Error(`SDK.generateVideo error: ${error.message}`);
        }
      },

      /**
       * Cinematic Prompt Generation API
       */
      generatePrompt: async (script: string, genre?: string): Promise<string> => {
        try {
          await this.trackAPIUsage('generatePrompt');

          const response = await fetch('/api/prompt-generation/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_input: script,
              constraints: genre ? { genre_override: genre } : {},
              use_smart_detection: !genre,
            }),
          });

          if (!response.ok) {
            throw new Error(`Prompt generation failed: ${response.statusText}`);
          }

          const data = await response.json();
          return data.data.cinematic_prompt;
        } catch (error: any) {
          throw new Error(`SDK.generatePrompt error: ${error.message}`);
        }
      },
    };
  }

  /**
   * Sandboxed storage (scoped to user + app)
   */
  private createStorage() {
    return {
      get: async (key: string): Promise<any> => {
        const { data, error } = await this.supabase
          .from('app_storage')
          .select('value')
          .eq('user_id', this.userId)
          .eq('app_id', this.appId)
          .eq('key', key)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }

        return data?.value;
      },

      set: async (key: string, value: any): Promise<void> => {
        const { error } = await this.supabase
          .from('app_storage')
          .upsert({
            user_id: this.userId,
            app_id: this.appId,
            key,
            value,
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;
      },

      delete: async (key: string): Promise<void> => {
        const { error } = await this.supabase
          .from('app_storage')
          .delete()
          .eq('user_id', this.userId)
          .eq('app_id', this.appId)
          .eq('key', key);

        if (error) throw error;
      },

      list: async (): Promise<string[]> => {
        const { data, error } = await this.supabase
          .from('app_storage')
          .select('key')
          .eq('user_id', this.userId)
          .eq('app_id', this.appId);

        if (error) throw error;
        return data?.map((row: any) => row.key) || [];
      },
    };
  }

  /**
   * Analytics tracking
   */
  private createAnalytics() {
    return {
      track: async (event: string, data?: any): Promise<void> => {
        await this.supabase
          .from('app_analytics')
          .insert({
            user_id: this.userId,
            app_id: this.appId,
            event,
            data,
            created_at: new Date().toISOString(),
          });
      },
    };
  }

  /**
   * Track API usage for billing
   */
  private async trackAPIUsage(apiName: string): Promise<void> {
    await this.supabase
      .from('api_usage_logs')
      .insert({
        user_id: this.userId,
        app_id: this.appId,
        api_name: apiName,
        called_at: new Date().toISOString(),
      });
  }
}

/**
 * Load and execute a mini app plugin
 */
export async function executeMiniApp(
  userId: string,
  appId: string,
  userInfo: { id: string; name: string; email?: string },
  appInfo: { id: string; name: string; version: string },
  plugin: MiniAppPlugin
): Promise<any> {
  const sdk = new MiniAppSDK(userId, appId);
  const context = await sdk.createContext(userInfo, appInfo);

  try {
    const result = await plugin(context);
    return result;
  } catch (error: any) {
    console.error(`Mini app execution failed: ${error.message}`);
    throw error;
  }
}
