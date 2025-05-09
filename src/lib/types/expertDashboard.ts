import { Prediction, PredictionFeedback, ExpertAdjustment } from './prediction';

export interface BulkAdjustment {
  predictionIds: string[];
  adjustmentFactor: number;
  reason: string;
  expertId: string;
  timestamp: Date;
}

export interface AccuracyImprovement {
  category: string;
  originalAccuracy: number;
  adjustedAccuracy: number;
  improvement: number;
}

export interface ExpertActivity {
  expertId: string;
  adjustmentCount: number;
  averageImpact: number;
  lastActive: string;
}

export interface ExpertStats {
  totalAdjustments: number;
  averageImpact: number;
  accuracyImprovement: number;
  recentActivity: { date: Date; count: number; }[];
}

export interface PredictionGroup {
  id: string;
  predictions: Prediction[];
  similarityScore?: number;
  averageConfidence: number;
}

// New interfaces for Historical Impact Analysis

export interface HistoricalImpact {
  id: string;
  period: string; // e.g., "2023-Q1", "Apr 2023", etc.
  startDate: Date;
  endDate: Date;
  originalAccuracy: number;
  adjustedAccuracy: number;
  improvementPercent: number;
  totalPredictions: number;
  adjustedPredictions: number;
  adjustmentRate: number;
  confidenceChange: number;
  expertIds: string[];
}

export interface AdjustmentTypeImpact {
  adjustmentType: string; // Category of adjustment (e.g., "growth", "audience", "content")
  totalCount: number;
  averageImprovement: number;
  successRate: number; // Percentage of adjustments that improved accuracy
  confidenceChange: number;
  timeseriesData: TimeseriesDataPoint[];
}

export interface TimeseriesDataPoint {
  date: Date;
  value: number;
  category?: string;
}

export interface AdjustmentImpactDetails {
  adjustmentId: string;
  category: string;
  timestamp: Date;
  originalValue: number;
  adjustedValue: number;
  actualValue?: number;
  originalError?: number;
  adjustedError?: number;
  improvementPercent?: number;
  expertId: string;
  reason?: string;
}

export interface HistoricalImpactAnalysis {
  timeframes: HistoricalImpact[];
  adjustmentTypes: AdjustmentTypeImpact[];
  topImpactfulAdjustments: AdjustmentImpactDetails[];
  expertPerformance: ExpertPerformance[];
  trendData: {
    accuracy: TimeseriesDataPoint[];
    adjustmentVolume: TimeseriesDataPoint[];
    impactOverTime: TimeseriesDataPoint[];
  };
}

export interface ExpertPerformance {
  expertId: string;
  name: string;
  adjustmentCount: number;
  averageImpact: number;
  successRate: number;
  topCategories: {
    category: string;
    adjustmentCount: number;
    averageImpact: number;
  }[];
} 