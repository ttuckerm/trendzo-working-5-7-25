// Trendzo Viral Prediction System Database Types

export interface ViralTemplate {
  id: string;
  name: string;
  description: string | null;
  success_rate: number;
  status: 'HOT' | 'COOLING' | 'NEW';
  usage_count: number;
  framework_type: string | null;
  created_at: string;
  updated_at: string;
}

export interface PredictionAccuracy {
  id: string;
  video_id: string;
  predicted_score: number;
  actual_views: number | null;
  actual_likes: number | null;
  actual_shares: number | null;
  accuracy_percentage: number | null;
  validated_at: string | null;
  created_at: string;
}

export interface ModuleHealth {
  id: string;
  module_name: string;
  status: 'green' | 'red' | 'yellow';
  last_heartbeat: string;
  processed_count: number;
  error_message: string | null;
  uptime_percentage: number;
}

export interface ScriptPattern {
  id: string;
  video_id: string;
  transcript_text: string | null;
  viral_score: number | null;
  framework_type: string | null;
  pattern_keywords: string[] | null;
  success_indicators: string[] | null;
  created_at: string;
}

export interface RecipeBookDaily {
  id: string;
  date: string;
  hot_templates: any | null;
  cooling_templates: any | null;
  new_templates: any | null;
  total_videos_analyzed: number;
  system_accuracy: number | null;
  created_at: string;
}

// Module names enum for type safety
export enum ModuleName {
  TIKTOK_SCRAPER = 'TikTok Scraper',
  VIRAL_PATTERN_ANALYZER = 'Viral Pattern Analyzer',
  TEMPLATE_DISCOVERY_ENGINE = 'Template Discovery Engine',
  DRAFT_VIDEO_ANALYZER = 'Draft Video Analyzer',
  SCRIPT_INTELLIGENCE_MODULE = 'Script Intelligence Module',
  RECIPE_BOOK_GENERATOR = 'Recipe Book Generator',
  PREDICTION_ENGINE = 'Prediction Engine',
  PERFORMANCE_VALIDATOR = 'Performance Validator',
  MARKETING_CONTENT_CREATOR = 'Marketing Content Creator',
  DASHBOARD_AGGREGATOR = 'Dashboard Aggregator',
  SYSTEM_HEALTH_MONITOR = 'System Health Monitor'
}