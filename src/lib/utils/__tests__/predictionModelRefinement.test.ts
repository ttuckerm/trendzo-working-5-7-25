import {
  updateExpertWeights,
  refinePredictionModel,
  applyModelRefinements
} from '../predictionModelRefinement';
import { Prediction } from '../../types/prediction';

describe('Prediction Model Refinement', () => {
  const mockPrediction: Prediction = {
    id: '1',
    category: 'Product',
    confidence: 0.8,
    trend: 'up',
    timestamp: new Date(),
    predictedValue: 100,
    metadata: {
      source: 'algorithm',
      factors: ['growth_rate', 'engagement'],
    }
  };

  const mockFeedbackLoop = {
    predictionId: '1',
    originalPrediction: {
      ...mockPrediction,
      predictedValue: 100
    },
    expertAdjustment: {
      value: 120,
      confidence: 0.9,
      reasoning: 'Seasonal factors not considered'
    },
    actualOutcome: 115
  };

  describe('updateExpertWeights', () => {
    it('should calculate expert weights based on historical accuracy', async () => {
      const expertId = 'expert1';
      const feedbackLoops = [mockFeedbackLoop];

      const result = await updateExpertWeights(expertId, feedbackLoops);

      expect(result.expertId).toBe(expertId);
      expect(result.categoryWeights).toHaveProperty('Product');
      expect(result.overallAccuracy).toBeGreaterThan(0);
      expect(result.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('refinePredictionModel', () => {
    it('should calculate model adjustments based on expert feedback', async () => {
      const expertAdjustments = [mockFeedbackLoop];

      const result = await refinePredictionModel(mockPrediction, expertAdjustments);

      expect(result.category).toBe('Product');
      expect(result.confidenceAdjustment).toBeDefined();
      expect(result.valueAdjustment).toBeDefined();
      expect(result.patternWeight).toBeGreaterThan(0);
    });
  });

  describe('applyModelRefinements', () => {
    it('should apply model adjustments to new predictions', async () => {
      const modelAdjustments = [{
        category: 'Product',
        confidenceAdjustment: 0.1,
        valueAdjustment: 0.2,
        patternWeight: 0.8
      }];

      const result = await applyModelRefinements(mockPrediction, modelAdjustments);

      expect(result.predictedValue).toBeGreaterThan(mockPrediction.predictedValue);
      expect(result.confidence).toBeGreaterThan(mockPrediction.confidence);
      expect(result.metadata.refinementApplied).toBe(true);
      expect(result.metadata.patternWeight).toBeDefined();
      expect(result.metadata.lastRefined).toBeDefined();
    });

    it('should return original prediction if no matching category adjustment', async () => {
      const modelAdjustments = [{
        category: 'Different',
        confidenceAdjustment: 0.1,
        valueAdjustment: 0.2,
        patternWeight: 0.8
      }];

      const result = await applyModelRefinements(mockPrediction, modelAdjustments);

      expect(result).toEqual(mockPrediction);
    });
  });
}); 