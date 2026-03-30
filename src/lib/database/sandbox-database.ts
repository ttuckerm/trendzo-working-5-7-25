/**
 * SANDBOX DATABASE INTEGRATION
 * 
 * Comprehensive database service for the Trendzo Sandbox environment
 * Integrates with existing Supabase infrastructure while providing
 * sandbox-specific data management and caching capabilities.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { trendzoBrand } from '../branding/trendzo-brand';

// ===== TYPES & INTERFACES =====

export interface SandboxUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  last_active: string;
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    platform_focus: string[];
    niche_interests: string[];
    notification_settings: Record<string, boolean>;
  };
}

export interface ViralPrediction {
  id: string;
  user_id: string;
  content_type: 'text' | 'video' | 'image' | 'audio';
  platform: 'tiktok' | 'instagram' | 'youtube' | 'twitter';
  content_preview: string;
  viral_score: number;
  confidence_level: 'low' | 'medium' | 'high';
  prediction_factors: {
    hook_strength: number;
    timing_score: number;
    trend_alignment: number;
    audience_match: number;
    platform_optimization: number;
  };
  created_at: string;
  status: 'draft' | 'analyzed' | 'published' | 'archived';
}

export interface ContentTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  platform: string[];
  viral_score_range: [number, number];
  template_data: {
    structure: string;
    hooks: string[];
    cta_suggestions: string[];
    hashtag_recommendations: string[];
  };
  usage_count: number;
  success_rate: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSession {
  id: string;
  user_id: string;
  workflow_type: 'quick_win' | 'deep_analysis' | 'campaign' | 'template_creation';
  current_step: number;
  total_steps: number;
  session_data: Record<string, any>;
  started_at: string;
  last_updated: string;
  completed_at?: string;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
}

export interface AnalyticsEvent {
  id: string;
  user_id?: string;
  event_type: string;
  event_data: Record<string, any>;
  timestamp: string;
  session_id?: string;
  page_url?: string;
  user_agent?: string;
}

// ===== DATABASE SERVICE =====

export class SandboxDatabase {
  private supabase: SupabaseClient;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    this.cache = new Map();
    
    // Initialize database schema if needed
    this.initializeSchema();
  }

  // ===== CACHE MANAGEMENT =====

  private getCacheKey(table: string, query: string): string {
    return `${table}:${query}`;
  }

  private setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // ===== SCHEMA INITIALIZATION =====

  private async initializeSchema(): Promise<void> {
    try {
      // Check if sandbox tables exist, create if needed
      const { data: tables } = await this.supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      const tableNames = tables?.map(t => t.table_name) || [];
      
      // Create sandbox-specific tables if they don't exist
      if (!tableNames.includes('sandbox_users')) {
        await this.createSandboxTables();
      }

      console.log('✅ Sandbox database schema initialized');
    } catch (error) {
      console.error('❌ Failed to initialize database schema:', error);
    }
  }

  private async createSandboxTables(): Promise<void> {
    // Note: In production, these would be created via Supabase migrations
    // This is a simplified version for sandbox environment
    
    const tables = [
      {
        name: 'sandbox_users',
        sql: `
          CREATE TABLE IF NOT EXISTS sandbox_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT,
            name TEXT,
            avatar_url TEXT,
            preferences JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'viral_predictions',
        sql: `
          CREATE TABLE IF NOT EXISTS viral_predictions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES sandbox_users(id),
            content_type TEXT NOT NULL,
            platform TEXT NOT NULL,
            content_preview TEXT,
            viral_score DECIMAL(5,2),
            confidence_level TEXT,
            prediction_factors JSONB DEFAULT '{}',
            status TEXT DEFAULT 'draft',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'content_templates',
        sql: `
          CREATE TABLE IF NOT EXISTS content_templates (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title TEXT NOT NULL,
            description TEXT,
            category TEXT,
            platform TEXT[],
            viral_score_range DECIMAL(5,2)[],
            template_data JSONB DEFAULT '{}',
            usage_count INTEGER DEFAULT 0,
            success_rate DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'workflow_sessions',
        sql: `
          CREATE TABLE IF NOT EXISTS workflow_sessions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES sandbox_users(id),
            workflow_type TEXT NOT NULL,
            current_step INTEGER DEFAULT 0,
            total_steps INTEGER DEFAULT 1,
            session_data JSONB DEFAULT '{}',
            status TEXT DEFAULT 'active',
            started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            completed_at TIMESTAMP WITH TIME ZONE
          );
        `
      },
      {
        name: 'analytics_events',
        sql: `
          CREATE TABLE IF NOT EXISTS analytics_events (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID,
            event_type TEXT NOT NULL,
            event_data JSONB DEFAULT '{}',
            session_id TEXT,
            page_url TEXT,
            user_agent TEXT,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    for (const table of tables) {
      try {
        await this.supabase.rpc('exec_sql', { sql: table.sql });
        console.log(`✅ Created table: ${table.name}`);
      } catch (error) {
        console.log(`ℹ️ Table ${table.name} may already exist`);
      }
    }
  }

  // ===== USER MANAGEMENT =====

  async createSandboxUser(userData: Partial<SandboxUser>): Promise<SandboxUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('sandbox_users')
        .insert([{
          ...userData,
          preferences: userData.preferences || {
            theme: 'dark',
            platform_focus: ['tiktok'],
            niche_interests: [],
            notification_settings: {}
          }
        }])
        .select()
        .single();

      if (error) throw error;

      this.clearCache('sandbox_users');
      return data as SandboxUser;
    } catch (error) {
      console.error('Failed to create sandbox user:', error);
      return null;
    }
  }

  async getSandboxUser(userId: string): Promise<SandboxUser | null> {
    const cacheKey = this.getCacheKey('sandbox_users', userId);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('sandbox_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const user = data as SandboxUser;
      this.setCache(cacheKey, user);
      return user;
    } catch (error) {
      console.error('Failed to get sandbox user:', error);
      return null;
    }
  }

  async updateSandboxUser(userId: string, updates: Partial<SandboxUser>): Promise<SandboxUser | null> {
    try {
      const { data, error } = await this.supabase
        .from('sandbox_users')
        .update({
          ...updates,
          last_active: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      this.clearCache('sandbox_users');
      return data as SandboxUser;
    } catch (error) {
      console.error('Failed to update sandbox user:', error);
      return null;
    }
  }

  // ===== VIRAL PREDICTIONS =====

  async createViralPrediction(prediction: Omit<ViralPrediction, 'id' | 'created_at'>): Promise<ViralPrediction | null> {
    try {
      const { data, error } = await this.supabase
        .from('viral_predictions')
        .insert([prediction])
        .select()
        .single();

      if (error) throw error;

      this.clearCache('viral_predictions');
      return data as ViralPrediction;
    } catch (error) {
      console.error('Failed to create viral prediction:', error);
      return null;
    }
  }

  async getViralPredictions(userId: string, limit: number = 10): Promise<ViralPrediction[]> {
    const cacheKey = this.getCacheKey('viral_predictions', `user:${userId}:limit:${limit}`);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('viral_predictions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const predictions = data as ViralPrediction[];
      this.setCache(cacheKey, predictions);
      return predictions;
    } catch (error) {
      console.error('Failed to get viral predictions:', error);
      return [];
    }
  }

  async updateViralPrediction(predictionId: string, updates: Partial<ViralPrediction>): Promise<ViralPrediction | null> {
    try {
      const { data, error } = await this.supabase
        .from('viral_predictions')
        .update(updates)
        .eq('id', predictionId)
        .select()
        .single();

      if (error) throw error;

      this.clearCache('viral_predictions');
      return data as ViralPrediction;
    } catch (error) {
      console.error('Failed to update viral prediction:', error);
      return null;
    }
  }

  // ===== CONTENT TEMPLATES =====

  async getContentTemplates(filters?: {
    category?: string;
    platform?: string;
    minViralScore?: number;
  }): Promise<ContentTemplate[]> {
    const cacheKey = this.getCacheKey('content_templates', JSON.stringify(filters || {}));
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      let query = this.supabase
        .from('content_templates')
        .select('*')
        .order('success_rate', { ascending: false });

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      if (filters?.platform) {
        query = query.contains('platform', [filters.platform]);
      }

      if (filters?.minViralScore) {
        query = query.gte('viral_score_range[0]', filters.minViralScore);
      }

      const { data, error } = await query;

      if (error) throw error;

      const templates = data as ContentTemplate[];
      this.setCache(cacheKey, templates, 10 * 60 * 1000); // Cache for 10 minutes
      return templates;
    } catch (error) {
      console.error('Failed to get content templates:', error);
      return [];
    }
  }

  async createContentTemplate(template: Omit<ContentTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<ContentTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('content_templates')
        .insert([template])
        .select()
        .single();

      if (error) throw error;

      this.clearCache('content_templates');
      return data as ContentTemplate;
    } catch (error) {
      console.error('Failed to create content template:', error);
      return null;
    }
  }

  // ===== WORKFLOW SESSIONS =====

  async createWorkflowSession(session: Omit<WorkflowSession, 'id' | 'started_at' | 'last_updated'>): Promise<WorkflowSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_sessions')
        .insert([session])
        .select()
        .single();

      if (error) throw error;

      this.clearCache('workflow_sessions');
      return data as WorkflowSession;
    } catch (error) {
      console.error('Failed to create workflow session:', error);
      return null;
    }
  }

  async updateWorkflowSession(sessionId: string, updates: Partial<WorkflowSession>): Promise<WorkflowSession | null> {
    try {
      const { data, error } = await this.supabase
        .from('workflow_sessions')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;

      this.clearCache('workflow_sessions');
      return data as WorkflowSession;
    } catch (error) {
      console.error('Failed to update workflow session:', error);
      return null;
    }
  }

  async getActiveWorkflowSessions(userId: string): Promise<WorkflowSession[]> {
    const cacheKey = this.getCacheKey('workflow_sessions', `active:${userId}`);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.supabase
        .from('workflow_sessions')
        .select('*')
        .eq('user_id', userId)
        .in('status', ['active', 'paused'])
        .order('last_updated', { ascending: false });

      if (error) throw error;

      const sessions = data as WorkflowSession[];
      this.setCache(cacheKey, sessions);
      return sessions;
    } catch (error) {
      console.error('Failed to get active workflow sessions:', error);
      return [];
    }
  }

  // ===== ANALYTICS =====

  async trackEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      await this.supabase
        .from('analytics_events')
        .insert([{
          ...event,
          timestamp: new Date().toISOString()
        }]);

      // Don't cache analytics events as they're write-heavy
    } catch (error) {
      console.error('Failed to track analytics event:', error);
    }
  }

  async getAnalytics(userId?: string, eventType?: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      let query = this.supabase
        .from('analytics_events')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (eventType) {
        query = query.eq('event_type', eventType);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data as AnalyticsEvent[];
    } catch (error) {
      console.error('Failed to get analytics:', error);
      return [];
    }
  }

  // ===== UTILITY METHODS =====

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const { data, error } = await this.supabase
        .from('sandbox_users')
        .select('count')
        .limit(1);

      if (error) throw error;

      return {
        status: 'healthy',
        details: {
          connection: 'active',
          cache_size: this.cache.size,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  // Clear all caches
  clearAllCaches(): void {
    this.clearCache();
  }

  // Get cache statistics
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// ===== SINGLETON INSTANCE =====

let sandboxDatabase: SandboxDatabase | null = null;

export function getSandboxDatabase(): SandboxDatabase {
  if (!sandboxDatabase) {
    sandboxDatabase = new SandboxDatabase();
  }
  return sandboxDatabase;
}

export default getSandboxDatabase;





















