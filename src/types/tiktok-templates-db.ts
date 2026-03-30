/**
 * Type definitions for the TikTok templates database schema
 */

/**
 * Represents a TikTok template in the database
 */
export interface TikTokTemplate {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  duration?: number | null;
  thumbnail_url?: string | null;
  video_url?: string | null;
  structure: TemplateStructure;
  engagement_metrics: EngagementMetrics;
  growth_data: GrowthData;
  is_trending: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Structure of a TikTok template, including sections and other elements
 */
export interface TemplateStructure {
  sections: TemplateSection[];
  transitions?: TemplateTransition[];
  textOverlays?: TextOverlay[];
}

/**
 * A section of a TikTok template (intro, content, outro, etc.)
 */
export interface TemplateSection {
  id?: string;
  name: string;
  type: 'intro' | 'content' | 'outro' | 'hook' | 'callToAction' | 'custom';
  duration?: number;
  startTime?: number;
  endTime?: number;
  description?: string;
}

/**
 * A transition between sections
 */
export interface TemplateTransition {
  id?: string;
  name?: string;
  type: string;
  duration?: number;
  fromSection: string;
  toSection: string;
}

/**
 * A text overlay in the template
 */
export interface TextOverlay {
  id?: string;
  text: string;
  position?: {
    x: number;
    y: number;
  };
  style?: {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    background?: string;
  };
  section?: string;
  startTime?: number;
  endTime?: number;
}

/**
 * Engagement metrics for a template
 */
export interface EngagementMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

/**
 * Growth data for trend analysis
 */
export interface GrowthData {
  velocity?: number;
  acceleration?: number;
  peak_date?: string;
  trend_cycle?: 'emerging' | 'growing' | 'peaking' | 'declining';
  historical_data?: {
    date: string;
    views: number;
    engagement: number;
  }[];
}

/**
 * Expert insights for a template
 */
export interface TemplateExpertInsight {
  id: number;
  template_id: number;
  tags: string[];
  notes?: string | null;
  manual_adjustment: boolean;
  adjustment_reason?: string | null;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

/**
 * Audit log entry for template changes
 */
export interface TemplateAuditLog {
  id: number;
  template_id: number;
  action: string;
  changes: Record<string, any>;
  created_at: string;
  created_by?: string | null;
}

/**
 * Database schema interfaces
 */
export interface Database {
  tiktok_templates: {
    Row: TikTokTemplate;
    Insert: Omit<TikTokTemplate, 'id' | 'created_at' | 'updated_at'> & {
      id?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<TikTokTemplate, 'id' | 'created_at'>> & {
      updated_at?: string;
    };
  };
  template_expert_insights: {
    Row: TemplateExpertInsight;
    Insert: Omit<TemplateExpertInsight, 'id' | 'created_at' | 'updated_at'> & {
      id?: number;
      created_at?: string;
      updated_at?: string;
    };
    Update: Partial<Omit<TemplateExpertInsight, 'id' | 'created_at'>> & {
      updated_at?: string;
    };
  };
  template_audit_logs: {
    Row: TemplateAuditLog;
    Insert: Omit<TemplateAuditLog, 'id' | 'created_at'> & {
      id?: number;
      created_at?: string;
    };
    Update: Partial<Omit<TemplateAuditLog, 'id' | 'created_at'>>;
  };
} 