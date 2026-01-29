import { Prediction, PredictionMetrics, PredictionFeedback } from '../types/prediction';

export const calculateAccuracy = (predictions: Prediction[]): number => {
  const predictionsWithActual = predictions.filter(p => p.actualValue !== undefined);
  if (predictionsWithActual.length === 0) return 0;

  const totalError = predictionsWithActual.reduce((acc, pred) => {
    const error = Math.abs((pred.actualValue! - pred.predictedValue) / pred.actualValue!);
    return acc + error;
  }, 0);

  return 1 - (totalError / predictionsWithActual.length);
};

export const calculateMetrics = (predictions: Prediction[]): PredictionMetrics => {
  const predictionsWithActual = predictions.filter(p => p.actualValue !== undefined);
  const totalPredictions = predictionsWithActual.length;

  if (totalPredictions === 0) {
    return {
      accuracy: 0,
      meanAbsoluteError: 0,
      meanSquaredError: 0,
      expertAdjustmentRate: 0,
      confidenceScore: 0,
      timestamp: new Date(),
    };
  }

  const mae = predictionsWithActual.reduce((acc, pred) => 
    acc + Math.abs(pred.actualValue! - pred.predictedValue), 0) / totalPredictions;

  const mse = predictionsWithActual.reduce((acc, pred) => 
    acc + Math.pow(pred.actualValue! - pred.predictedValue, 2), 0) / totalPredictions;

  const expertAdjustments = predictions.filter(p => p.expertAdjustment).length;
  const expertAdjustmentRate = expertAdjustments / predictions.length;

  const avgConfidence = predictions.reduce((acc, pred) => acc + pred.confidence, 0) / predictions.length;

  return {
    accuracy: calculateAccuracy(predictions),
    meanAbsoluteError: mae,
    meanSquaredError: mse,
    expertAdjustmentRate,
    confidenceScore: avgConfidence,
    timestamp: new Date(),
  };
};

export const updateModelWithFeedback = async (
  feedback: PredictionFeedback,
  predictions: Prediction[]
): Promise<void> => {
  try {
    // 1. Find similar predictions based on input features
    const targetPrediction = predictions.find(p => p.id === feedback.predictionId);
    if (!targetPrediction) throw new Error('Prediction not found');

    const similarPredictions = predictions.filter(p => {
      // Calculate feature similarity
      const similarity = Object.entries(p.inputFeatures).reduce((acc, [key, value]) => {
        const targetValue = targetPrediction.inputFeatures[key];
        if (typeof value === 'number' && typeof targetValue === 'number') {
          // Normalize numerical differences
          const diff = Math.abs(value - targetValue) / Math.max(1, targetValue);
          return acc + (1 - diff);
        }
        return acc + (value === targetValue ? 1 : 0);
      }, 0) / Object.keys(p.inputFeatures).length;

      return similarity > 0.8; // Consider predictions with >80% feature similarity
    });

    // 2. Calculate adjustment factor based on expert feedback
    const originalValue = targetPrediction.predictedValue;
    const adjustedValue = feedback.adjustedValue;
    const adjustmentFactor = adjustedValue / originalValue;

    // 3. Apply weighted adjustments to similar predictions
    const adjustedPredictions = similarPredictions.map(pred => ({
      ...pred,
      predictedValue: pred.predictedValue * adjustmentFactor,
      confidence: Math.max(0.1, pred.confidence * 0.9) // Reduce confidence slightly
    }));

    // 4. Update confidence scoring based on expert feedback patterns
    const expertAdjustments = predictions
      .filter(p => p.expertAdjustment)
      .map(p => Math.abs(p.expertAdjustment!.value - p.predictedValue) / p.predictedValue);
    
    const avgAdjustmentSize = expertAdjustments.reduce((a, b) => a + b, 0) / 
      Math.max(1, expertAdjustments.length);

    // 5. Send the updates to your ML model API
    const modelUpdate = {
      originalPrediction: targetPrediction,
      expertFeedback: feedback,
      similarPredictions: adjustedPredictions,
      adjustmentMetrics: {
        adjustmentFactor,
        avgAdjustmentSize,
        confidenceImpact: avgAdjustmentSize > 0.2 ? 'high' : 'low'
      }
    };

    // In a real implementation, you would send this to your ML model API
    await fetch('/api/ml/update-model', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(modelUpdate)
    });

    console.log('Model updated with feedback:', modelUpdate);
  } catch (error) {
    console.error('Error updating model:', error);
    throw error;
  }
};

export const getPredictionTrends = (
  predictions: Prediction[],
  timeframe: 'day' | 'week' | 'month'
): PredictionMetrics[] => {
  // Group predictions by timeframe
  const groupedPredictions = predictions.reduce((acc, pred) => {
    const date = new Date(pred.timestamp);
    const key = timeframe === 'day' 
      ? date.toISOString().split('T')[0]
      : timeframe === 'week'
      ? `${date.getFullYear()}-W${Math.floor(date.getDate() / 7)}`
      : `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!acc[key]) acc[key] = [];
    acc[key].push(pred);
    return acc;
  }, {} as Record<string, Prediction[]>);

  // Calculate metrics for each group
  return Object.entries(groupedPredictions)
    .map(([_, preds]) => calculateMetrics(preds))
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}; 