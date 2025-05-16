// src/lib/types/database.ts

// User Profile Types
export interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'premium' | 'platinum';
  max_daily_prompts: number;
  created_at: string;
  updated_at: string;
}

// Template Types
export interface Template {
  id: number; // Changed to number since it's a bigint in the database
  title: string;
  description: string | null;
  category: string | null;
  duration: number | null;
  thumbnail_url: string | null;
  structure: any; // JSON structure of the template
  engagement_metrics: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
  };
  growth_data: {
    velocity?: number;
    acceleration?: number;
    peak_date?: string;
  };
  is_trending: boolean;
  created_at: string;
  updated_at: string;
  expert_insights: {
    tags?: string[];
    notes?: string;
    manual_adjustment?: boolean;
    adjustment_reason?: string;
  };
}

export interface TemplateTag {
  id: number; // Changed to number
  template_id: number; // Changed to number
  tag: string;
}

// Sound Types
export interface Sound {
  id: number; // Changed to number
  name: string;
  artist: string | null;
  duration: number | null;
  is_original: boolean;
  usage_count: number;
  audio_url: string | null;
  category: string | null;
  genre: string | null;
  growth_metrics: {
    sevenDayGrowth?: number;
    fourteenDayGrowth?: number;
    thirtyDayGrowth?: number;
    velocity?: number;
  };
  engagement_correlation: any;
  expert_annotations: any;
  created_at: string;
  updated_at: string;
}

export interface SoundTemplateMapping {
  id: number; // Changed to number
  sound_id: number; // Changed to number
  template_id: number; // Changed to number
  correlation_score: number | null;
  created_at: string;
}

// User Saved Templates
export interface UserSavedTemplate {
  id: number; // Changed to number
  user_id: string; // Still a UUID from auth
  template_id: number; // Changed to number
  created_at: string;
}

// Expert Insights
export interface ExpertInsight {
  id: number; // Changed to number
  entity_type: 'template' | 'sound' | 'trend';
  entity_id: number; // Changed to number
  insight_text: string;
  impact_score: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// Audit Trail
export interface AuditTrail {
  id: number; // Changed to number
  action_type: string;
  entity_type: string;
  entity_id: number; // Changed to number
  user_id: string | null; // Still a UUID from auth
  previous_state: any;
  new_state: any;
  created_at: string;
}

// User Permissions
export interface UserPermission {
  id: number; // Changed to number
  user_id: string; // Still a UUID from auth
  permission_key: string;
  permission_value: boolean;
  created_at: string;
}

// Feature Flag
export interface FeatureFlag {
  id: number; // Changed to number
  name: string;
  description: string | null;
  enabled: boolean;
  required_tier: string;
  created_at: string;
  updated_at: string;
}