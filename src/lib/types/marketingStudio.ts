// Marketing Studio Types and Interfaces

export interface MarketingStudioConfig {
  // Base template editor features PLUS ultra-charged capabilities
  baseEditor: TemplateEditorConfig;
  
  // One-click magic buttons
  magicButtons: {
    copyViralWinner: MagicButtonConfig;
    optimizeForViral: MagicButtonConfig;
    platformSpecific: PlatformOptimizationConfig;
    trendzoSpecific: TrendzoMarketingConfig;
  };
  
  // AI-powered content generation
  contentGeneration: {
    competitorAnalysis: CompetitorContentAnalyzer;
    successStoryGenerator: SuccessStoryEngine;
    featureShowcase: FeatureHighlightGenerator;
  };
}

export interface TemplateEditorConfig {
  enabled: boolean;
  features: string[];
  tier: 'admin' | 'super-admin';
}

export interface MagicButtonConfig {
  id: string;
  label: string;
  icon: string;
  action: () => Promise<void>;
  analytics: {
    track: boolean;
    event: string;
  };
}

export interface PlatformOptimizationConfig {
  platforms: PlatformSettings[];
  autoOptimize: boolean;
  preserveBranding: boolean;
}

export interface PlatformSettings {
  id: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' | 'twitter';
  name: string;
  specs: {
    aspectRatio: string;
    maxDuration: number;
    recommendedDuration: number;
    format: string[];
  };
  optimizations: {
    hooks: string[];
    trends: string[];
    hashtags: string[];
  };
}

export interface TrendzoMarketingConfig {
  templates: MarketingTemplate[];
  campaigns: MarketingCampaign[];
  analytics: MarketingAnalytics;
}

export interface MarketingTemplate {
  id: string;
  name: string;
  type: 'landing' | 'social' | 'email' | 'ad';
  performance: {
    conversionRate: number;
    views: number;
    shares: number;
    viralScore: number;
  };
  content: {
    headline: string;
    body: string;
    cta: string;
    visuals: string[];
  };
}

export interface MarketingCampaign {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  budget?: number;
  templates: string[];
  metrics: CampaignMetrics;
}

export interface CampaignMetrics {
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
  roi: number;
}

export interface CompetitorContentAnalyzer {
  analyze: (url: string) => Promise<CompetitorAnalysis>;
  compare: (ourContent: string, theirContent: string) => Promise<ContentComparison>;
  suggestions: (analysis: CompetitorAnalysis) => Promise<ImprovementSuggestions[]>;
}

export interface CompetitorAnalysis {
  url: string;
  platform: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  content: {
    hooks: string[];
    keywords: string[];
    emotionalTriggers: string[];
    callToActions: string[];
  };
  success_factors: string[];
}

export interface ContentComparison {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
}

export interface ImprovementSuggestions {
  type: 'hook' | 'visual' | 'cta' | 'timing' | 'hashtag';
  current: string;
  suggested: string;
  reason: string;
  expectedImpact: number;
}

export interface SuccessStoryEngine {
  generate: (data: SuccessStoryData) => Promise<SuccessStory>;
  templates: SuccessStoryTemplate[];
  customize: (story: SuccessStory, params: CustomizationParams) => Promise<SuccessStory>;
}

export interface SuccessStoryData {
  metric: string;
  improvement: number;
  timeframe: string;
  context?: string;
}

export interface SuccessStory {
  headline: string;
  story: string;
  metrics: string[];
  visualElements: string[];
}

export interface SuccessStoryTemplate {
  id: string;
  name: string;
  format: string;
  variables: string[];
}

export interface CustomizationParams {
  tone: 'professional' | 'casual' | 'inspirational' | 'urgent';
  length: 'short' | 'medium' | 'long';
  platform: string;
}

export interface FeatureHighlightGenerator {
  generate: (feature: string) => Promise<FeatureHighlight>;
  batch: (features: string[]) => Promise<FeatureHighlight[]>;
  optimize: (highlight: FeatureHighlight, platform: string) => Promise<FeatureHighlight>;
}

export interface FeatureHighlight {
  feature: string;
  headline: string;
  description: string;
  benefits: string[];
  useCases: string[];
  visuals: {
    icon?: string;
    screenshot?: string;
    animation?: string;
  };
}

export interface MarketingAnalytics {
  dashboard: AnalyticsDashboard;
  reports: ReportGenerator;
  insights: InsightEngine;
}

export interface AnalyticsDashboard {
  metrics: DashboardMetric[];
  timeRange: TimeRange;
  comparisons: MetricComparison[];
}

export interface DashboardMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeRange {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month';
}

export interface MetricComparison {
  metric: string;
  current: number;
  previous: number;
  target?: number;
}

export interface ReportGenerator {
  generate: (type: ReportType, params: ReportParams) => Promise<Report>;
  schedule: (report: ScheduledReport) => Promise<void>;
  export: (report: Report, format: ExportFormat) => Promise<string>;
}

export type ReportType = 'performance' | 'campaign' | 'content' | 'roi' | 'viral';

export interface ReportParams {
  timeRange: TimeRange;
  metrics: string[];
  filters?: Record<string, any>;
}

export interface Report {
  id: string;
  type: ReportType;
  generatedAt: Date;
  data: any;
  insights: string[];
}

export interface ScheduledReport {
  reportType: ReportType;
  schedule: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  params: ReportParams;
}

export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'png';

export interface InsightEngine {
  analyze: (data: any) => Promise<Insight[]>;
  predict: (metrics: DashboardMetric[]) => Promise<Prediction[]>;
  recommend: (context: any) => Promise<Recommendation[]>;
}

export interface Insight {
  type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  action?: string;
}

export interface Prediction {
  metric: string;
  forecast: number;
  confidence: number;
  factors: string[];
}

export interface Recommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  expectedImpact: string;
  implementation: string[];
}