export interface ExpertAdjustment {
  timestamp: string;
  adjustedConfidence: number;
  reason?: string;
  adjustedOutcome: boolean;
  value: number;
  expertId?: string;
}

export interface Prediction {
  id: string;
  title: string;
  description: string;
  category: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  timestamp: string;
  predictedValue: number;
  actualValue?: number;
  predictedOutcome: boolean;
  actualOutcome: boolean;
  metadata: PredictionMetadata;
  expertAdjustment?: ExpertAdjustment;
  similarityScore?: number;
  groupSize?: number;
  averageConfidence?: number;
  severity: 'low' | 'medium' | 'high';
}

export interface PredictionMetrics {
  accuracy: number;
  meanAbsoluteError: number;
  meanSquaredError: number;
  expertAdjustmentRate: number;
  confidenceScore: number;
  timestamp: Date;
}

export interface PredictionFeedback {
  predictionId: string;
  expertId: string;
  adjustedValue: number;
  feedback: string;
  timestamp: Date;
}

export interface PredictionMetadata {
  source: string;
  factors: string[];
  notes?: string;
  refinementApplied?: boolean;
  patternWeight?: number;
  lastRefined?: string;
  confidenceAdjustmentFactors?: {
    expertAccuracy: number;
    patternConsistency: number;
    feedbackFrequency: number;
  };
}

export interface ConfidenceUpdate {
  predictionId: string;
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentFactors: {
    expertAccuracy: number;
    patternConsistency: number;
    feedbackFrequency: number;
  };
} 