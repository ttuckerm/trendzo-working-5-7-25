/**
 * Types for Template Remix functionality
 */

import { TrendingTemplate } from './trendingTemplate';

/**
 * Represents a remixed template variation
 */
export interface RemixedTemplate {
  id: string;
  originalTemplateId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  userId: string;
  isPublic: boolean;
  
  // Template customization fields
  customizations?: TemplateCustomization[];
  
  // Applied suggestions from AI
  appliedSuggestions?: RemixSuggestion[];
  
  // Performance prediction
  performancePrediction?: PerformancePrediction;
  
  // Actual performance metrics
  actualPerformance?: ActualPerformance;
  
  // Reference to original template
  originalTemplate?: TrendingTemplate;
  
  // Preview URL
  previewUrl?: string;
  
  // Usage statistics
  stats?: {
    views: number;
    likes: number;
    shares: number;
    saves: number;
  };
}

/**
 * Represents a customization applied to a template
 */
export interface TemplateCustomization {
  id: string;
  type: 'text' | 'style' | 'layout' | 'timing' | 'transition' | 'other';
  name: string;
  description: string;
  value: any;
  originalValue: any;
  section: string;
  timestamp: string;
  aiGenerated: boolean;
}

/**
 * Represents a suggestion for template customization
 */
export interface RemixSuggestion {
  id: string;
  name: string;
  description: string;
  reasoning: string;
  currentValue: any;
  suggestedValue: any;
  applied?: boolean;
  type: 'caption' | 'hashtags' | 'timing' | 'design' | 'audio' | 'text' | 'other';
  impact: 'high' | 'medium' | 'low';
}

/**
 * Performance predictions for a remixed template
 */
export interface PerformancePrediction {
  engagementScore: number;
  viralityPotential: number;
  predictedViews: number;
  predictedLikes: number;
  targetAudience?: string[];
  bestTimeToPost?: string;
}

/**
 * Actual performance metrics for a template after publishing
 */
export interface ActualPerformance {
  measurementDate: string;
  period: '24h' | '7d' | '30d';
  actualViews: number;
  actualLikes: number;
  actualShares: number;
  actualComments: number;
  engagementRate: number;
  completionRate?: number;
  clickThroughRate?: number;
  conversionRate?: number;
}

/**
 * Performance comparison between predicted and actual metrics
 */
export interface PerformanceComparison {
  templateId: string;
  createdAt: string;
  prediction: PerformancePrediction;
  actual: ActualPerformance;
  accuracyMetrics: {
    viewsAccuracy: number;  // percentage accuracy of view prediction
    likesAccuracy: number;  // percentage accuracy of likes prediction
    engagementAccuracy: number;  // percentage accuracy of engagement prediction
    overallAccuracy: number;  // weighted overall accuracy
  };
  appliedSuggestions: RemixSuggestion[];
  modelUsed: 'openai' | 'claude';
  optimizationGoal: 'engagement' | 'conversion' | 'brand' | 'trends';
  feedbackNotes?: string;
}

/**
 * AI suggestion for template customization
 */
export interface AISuggestion {
  id: string;
  type: 'text' | 'style' | 'layout' | 'timing' | 'transition' | 'other';
  name: string;
  description: string;
  suggestedValue: any;
  currentValue: any;
  section: string;
  reasoning: string;
  generatedAt: string;
  applied: boolean;
}

/**
 * Request for AI-assisted template customization
 */
export interface AICustomizationRequest {
  templateId: string;
  goal: 'engagement' | 'virality' | 'conversion' | 'branding';
  targetAudience?: string[];
  constraints?: string[];
  currentCustomizations?: TemplateCustomization[];
  sectionFocus?: string;
  previousPerformance?: PerformanceComparison[];  // Added for feedback loop
}

/**
 * Response from the AI customization API
 */
export interface AICustomizationResponse {
  templateId: string;
  insights: string[];
  suggestions: RemixSuggestion[];
  performancePrediction?: PerformancePrediction;
}

/**
 * Template remix settings
 */
export interface RemixSettings {
  userId: string;
  allowAiSuggestions: boolean;
  autoSave: boolean;
  defaultVisibility: 'public' | 'private';
  variationCount: number;
  preferredCustomizationTypes: ('text' | 'style' | 'layout' | 'timing' | 'transition' | 'other')[];
}

/**
 * Request payload for generating template variations
 */
export interface GenerateVariationsRequest {
  templateId: string;
  goal?: 'engagement' | 'conversion' | 'brand' | 'trends';
  customPrompt?: string;
  contentType?: 'video' | 'image' | 'carousel';
  targetAudience?: string[];
  previousPerformance?: PerformanceComparison[];  // Added for feedback loop
} 