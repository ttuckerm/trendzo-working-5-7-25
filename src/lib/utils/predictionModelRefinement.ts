import { Prediction } from '../types/prediction';

interface ExpertAdjustmentWeight {
  expertId: string;
  categoryWeights: Record<string, number>;
  overallAccuracy: number;
  lastUpdated: Date;
}

interface ModelAdjustment {
  category: string;
  confidenceAdjustment: number;
  valueAdjustment: number;
  patternWeight: number;
}

interface FeedbackLoop {
  predictionId: string;
  originalPrediction: Prediction;
  expertAdjustment: {
    value: number;
    confidence: number;
    reasoning: string;
  };
  actualOutcome?: number;
  impactScore?: number;
}

interface ConfidenceUpdate {
  predictionId: string;
  originalConfidence: number;
  adjustedConfidence: number;
  adjustmentFactors: {
    expertAccuracy: number;
    patternConsistency: number;
    feedbackFrequency: number;
  };
}

// Track expert adjustment weights based on their historical accuracy
export const updateExpertWeights = async (
  expertId: string,
  feedbackLoops: FeedbackLoop[]
): Promise<ExpertAdjustmentWeight> => {
  const categoryAccuracy: Record<string, { correct: number; total: number }> = {};
  let totalCorrect = 0;
  let totalPredictions = 0;

  // Calculate accuracy per category and overall
  feedbackLoops.forEach(feedback => {
    if (!feedback.actualOutcome) return;

    const category = feedback.originalPrediction.category;
    const isCorrect = Math.abs(feedback.expertAdjustment.value - feedback.actualOutcome) <
      Math.abs(feedback.originalPrediction.predictedValue - feedback.actualOutcome);

    if (!categoryAccuracy[category]) {
      categoryAccuracy[category] = { correct: 0, total: 0 };
    }

    if (isCorrect) {
      categoryAccuracy[category].correct++;
      totalCorrect++;
    }
    categoryAccuracy[category].total++;
    totalPredictions++;
  });

  // Calculate weights per category
  const categoryWeights: Record<string, number> = {};
  Object.entries(categoryAccuracy).forEach(([category, stats]) => {
    categoryWeights[category] = stats.correct / stats.total;
  });

  return {
    expertId,
    categoryWeights,
    overallAccuracy: totalCorrect / totalPredictions,
    lastUpdated: new Date()
  };
};

// Apply expert feedback to adjust the prediction model
export const refinePredictionModel = async (
  prediction: Prediction,
  expertAdjustments: FeedbackLoop[]
): Promise<ModelAdjustment> => {
  const category = prediction.category;
  
  // Calculate average adjustments for this category
  const categoryAdjustments = expertAdjustments.filter(
    adj => adj.originalPrediction.category === category
  );

  const avgConfidenceAdjustment = categoryAdjustments.reduce(
    (sum, adj) => sum + (adj.expertAdjustment.confidence - adj.originalPrediction.confidence),
    0
  ) / categoryAdjustments.length;

  const avgValueAdjustment = categoryAdjustments.reduce(
    (sum, adj) => {
      const originalValue = adj.originalPrediction.predictedValue;
      const adjustedValue = adj.expertAdjustment.value;
      return sum + ((adjustedValue - originalValue) / originalValue);
    },
    0
  ) / categoryAdjustments.length;

  // Calculate pattern weight based on expert agreement
  const patternWeight = categoryAdjustments.reduce(
    (agreement, adj) => {
      const similarAdjustments = categoryAdjustments.filter(
        other => Math.abs(
          (other.expertAdjustment.value - other.originalPrediction.predictedValue) -
          (adj.expertAdjustment.value - adj.originalPrediction.predictedValue)
        ) / adj.originalPrediction.predictedValue < 0.1
      ).length;
      return agreement + (similarAdjustments / categoryAdjustments.length);
    },
    0
  ) / categoryAdjustments.length;

  return {
    category,
    confidenceAdjustment: avgConfidenceAdjustment,
    valueAdjustment: avgValueAdjustment,
    patternWeight: patternWeight
  };
};

// Apply model adjustments to new predictions
export const applyModelRefinements = async (
  prediction: Prediction,
  modelAdjustments: ModelAdjustment[]
): Promise<Prediction> => {
  const categoryAdjustment = modelAdjustments.find(
    adj => adj.category === prediction.category
  );

  if (!categoryAdjustment) return prediction;

  const adjustedPrediction: Prediction = {
    ...prediction,
    predictedValue: prediction.predictedValue * (1 + categoryAdjustment.valueAdjustment),
    confidence: Math.min(
      1,
      Math.max(0, prediction.confidence + categoryAdjustment.confidenceAdjustment)
    ),
    metadata: {
      ...prediction.metadata,
      refinementApplied: true,
      patternWeight: categoryAdjustment.patternWeight,
      lastRefined: new Date().toISOString()
    }
  };

  return adjustedPrediction;
};

export const updateConfidenceScores = async (
  predictions: Prediction[],
  expertWeights: ExpertAdjustmentWeight,
  feedbackHistory: FeedbackLoop[]
): Promise<ConfidenceUpdate[]> => {
  // Track adjustment patterns per category
  const categoryPatterns = new Map<string, {
    adjustments: number;
    consistentDirection: number;
    totalFeedback: number;
  }>();

  // Analyze feedback patterns
  feedbackHistory.forEach(feedback => {
    const category = feedback.originalPrediction.category;
    const pattern = categoryPatterns.get(category) || {
      adjustments: 0,
      consistentDirection: 0,
      totalFeedback: 0
    };

    pattern.adjustments++;
    pattern.totalFeedback++;

    // Check if adjustment direction is consistent with previous ones
    const currentDirection = feedback.expertAdjustment.value > feedback.originalPrediction.predictedValue;
    const previousFeedback = feedbackHistory
      .filter(f => f.originalPrediction.category === category)
      .slice(-3);
    
    if (previousFeedback.every(f => 
      (f.expertAdjustment.value > f.originalPrediction.predictedValue) === currentDirection
    )) {
      pattern.consistentDirection++;
    }

    categoryPatterns.set(category, pattern);
  });

  // Calculate confidence updates for each prediction
  return predictions.map(prediction => {
    const categoryPattern = categoryPatterns.get(prediction.category);
    if (!categoryPattern) {
      return {
        predictionId: prediction.id,
        originalConfidence: prediction.confidence,
        adjustedConfidence: prediction.confidence,
        adjustmentFactors: {
          expertAccuracy: 1,
          patternConsistency: 1,
          feedbackFrequency: 1
        }
      };
    }

    // Expert accuracy factor
    const expertAccuracy = expertWeights.categoryWeights[prediction.category] || 1;

    // Pattern consistency factor
    const patternConsistency = categoryPattern.consistentDirection / Math.max(1, categoryPattern.adjustments);

    // Feedback frequency factor
    const feedbackFrequency = Math.min(1, categoryPattern.totalFeedback / 10);

    // Calculate confidence adjustment
    const confidenceAdjustment = (
      expertAccuracy * 0.4 +
      patternConsistency * 0.4 +
      feedbackFrequency * 0.2
    );

    // Apply confidence adjustment
    const adjustedConfidence = Math.min(
      1,
      Math.max(
        0.1,
        prediction.confidence * confidenceAdjustment
      )
    );

    return {
      predictionId: prediction.id,
      originalConfidence: prediction.confidence,
      adjustedConfidence,
      adjustmentFactors: {
        expertAccuracy,
        patternConsistency,
        feedbackFrequency
      }
    };
  });
}; 