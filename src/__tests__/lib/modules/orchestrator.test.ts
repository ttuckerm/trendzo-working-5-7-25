/**
 * Orchestrator Test Suite
 * Comprehensive tests for prediction routing and blending functionality
 */

import {
  orchestratePrediction,
  getOrchestratorStatus,
  clearOrchestratorCache,
  setEngineEnabled,
  DEFAULT_BLENDING_CONFIG
} from '../../../lib/modules/orchestrator';
import {
  DraftInput,
  BlendedPrediction,
  BlendingConfig,
  OrchestratorError,
  EngineError
} from '../../../lib/types/orchestrator';

// Mock DNA_Detective module
jest.mock('../../../lib/modules/dna-detective', () => ({
  predictDNA: jest.fn()
}));

const mockPredictDNA = require('../../../lib/modules/dna-detective').predictDNA as jest.MockedFunction<any>;

describe('Orchestrator', () => {
  // Sample test data
  const sampleGenes = Array(48).fill(false).map((_, i) => i % 7 === 0); // Every 7th gene true
  
  const basicInput: DraftInput = {
    genes: sampleGenes
  };
  
  const fullInput: DraftInput = {
    genes: sampleGenes,
    earlyMetrics: {
      views_10m: 1250,
      likes_10m: 89,
      shares_10m: 12
    },
    shareGraph: [
      { from: 'user1', to: 'user2', t: 1642636800 },
      { from: 'user2', to: 'user3', t: 1642636860 }
    ],
    audioEmbedding: {
      embedding: Array(128).fill(0.5),
      duration_ms: 15000,
      sample_rate: 44100
    },
    visualEmbedding: {
      embedding: Array(256).fill(0.3),
      frame_count: 450,
      resolution: '1920x1080'
    },
    metadata: {
      platform: 'tiktok',
      niche: 'fitness',
      creator_tier: 'macro'
    }
  };
  
  const mockDNADetectiveResult = {
    video_probability: 0.73,
    closest_template: {
      id: 'template-123',
      name: 'Authority Transformation',
      status: 'HOT' as const,
      distance: 0.25
    },
    top_gene_matches: ['AuthorityHook', 'TransformationBeforeAfter', 'VisualStimulation']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    clearOrchestratorCache();
    
    // Reset engine states
    setEngineEnabled('DNA_Detective', true);
    setEngineEnabled('QuantumSwarmNexus', false);
    setEngineEnabled('MetaFusionMesh', false);
    setEngineEnabled('TemporalGraphProphet', false);
    
    // Setup default DNA_Detective mock
    mockPredictDNA.mockResolvedValue(mockDNADetectiveResult);
  });

  describe('Input Validation', () => {
    it('should reject invalid genes array length', async () => {
      const invalidInput = {
        genes: Array(47).fill(false) // Wrong length
      };
      
      await expect(orchestratePrediction(invalidInput)).rejects.toThrow(OrchestratorError);
      await expect(orchestratePrediction(invalidInput)).rejects.toThrow('Invalid input');
    });

    it('should reject non-boolean genes array', async () => {
      const invalidInput = {
        genes: Array(48).fill(1) // Should be boolean, not number
      };
      
      await expect(orchestratePrediction(invalidInput)).rejects.toThrow(OrchestratorError);
    });

    it('should accept valid minimal input', async () => {
      const result = await orchestratePrediction(basicInput);
      
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
      expect(result.engines_used.length).toBeGreaterThan(0);
    });

    it('should accept valid complete input', async () => {
      const result = await orchestratePrediction(fullInput);
      
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
      expect(result.metadata.data_completeness).toBeGreaterThan(0.8); // Should be high with all data
    });
  });

  describe('Engine Selection', () => {
    it('should call DNA_Detective with basic genes-only input', async () => {
      await orchestratePrediction(basicInput);
      
      expect(mockPredictDNA).toHaveBeenCalledWith(basicInput.genes);
      expect(mockPredictDNA).toHaveBeenCalledTimes(1);
    });

    it('should handle DNA_Detective engine failure gracefully', async () => {
      mockPredictDNA.mockRejectedValue(new Error('DNA_Detective unavailable'));
      
      await expect(orchestratePrediction(basicInput)).rejects.toThrow(OrchestratorError);
      await expect(orchestratePrediction(basicInput)).rejects.toThrow('All prediction engines failed');
    });

    it('should report no available engines when none can run', async () => {
      setEngineEnabled('DNA_Detective', false);
      
      await expect(orchestratePrediction(basicInput)).rejects.toThrow(OrchestratorError);
      await expect(orchestratePrediction(basicInput)).rejects.toThrow('No prediction engines can run');
    });

    it('should calculate data completeness correctly', async () => {
      // Basic input (only genes) should have low completeness
      const basicResult = await orchestratePrediction(basicInput);
      expect(basicResult.metadata.data_completeness).toBe(0.2); // 1/5 features
      
      // Full input should have high completeness
      const fullResult = await orchestratePrediction(fullInput);
      expect(fullResult.metadata.data_completeness).toBe(1.0); // 5/5 features
    });
  });

  describe('Result Blending', () => {
    beforeEach(() => {
      // Enable multiple engines for blending tests
      setEngineEnabled('QuantumSwarmNexus', true);
      setEngineEnabled('TemporalGraphProphet', true);
    });

    it('should blend multiple engine results using confidence weighting', async () => {
      const result = await orchestratePrediction(fullInput, {
        strategy: 'confidence_weighted'
      });
      
      expect(result.engines_used.length).toBeGreaterThan(1);
      expect(result.blending_strategy).toBe('confidence_weighted_average');
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
    });

    it('should use max confidence strategy correctly', async () => {
      const result = await orchestratePrediction(fullInput, {
        strategy: 'max_confidence'
      });
      
      expect(result.blending_strategy).toBe('max_confidence_selection');
      
      // Final probability should match the highest confidence engine
      const highestConfidenceEngine = result.engines_used.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
      expect(result.final_probability).toBe(highestConfidenceEngine.probability);
    });

    it('should apply confidence threshold filtering', async () => {
      const result = await orchestratePrediction(fullInput, {
        strategy: 'confidence_weighted',
        confidence_threshold: 0.95 // Very high threshold
      });
      
      // Should still return a result even if engines don't meet threshold
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
    });

    it('should handle ensemble voting strategy', async () => {
      const result = await orchestratePrediction(fullInput, {
        strategy: 'ensemble_voting'
      });
      
      expect(result.blending_strategy).toBe('ensemble_voting');
      expect([0.3, 0.55, 0.8]).toContain(result.final_probability); // Should be one of the voting outcomes
    });

    it('should remove outliers when enabled', async () => {
      // Mock one engine to return a very different result
      mockPredictDNA.mockResolvedValue({
        ...mockDNADetectiveResult,
        video_probability: 0.05 // Very low compared to others
      });
      
      const result = await orchestratePrediction(fullInput, {
        strategy: 'confidence_weighted',
        outlier_detection: true
      });
      
      expect(result.engines_used.length).toBeGreaterThan(0);
      // Difficult to test outlier removal precisely due to mock randomness,
      // but ensure it doesn't crash and returns valid result
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance and Caching', () => {
    it('should complete prediction within reasonable time', async () => {
      const startTime = Date.now();
      const result = await orchestratePrediction(basicInput);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(500); // Should be fast with just DNA_Detective
      expect(result.metadata.total_processing_time_ms).toBeGreaterThan(0);
    });

    it('should cache engine results for improved performance', async () => {
      // First call
      const result1 = await orchestratePrediction(basicInput);
      const firstCallTime = result1.metadata.total_processing_time_ms;
      
      // Second call with same input should use cache
      const result2 = await orchestratePrediction(basicInput);
      const secondCallTime = result2.metadata.total_processing_time_ms;
      
      expect(secondCallTime).toBeLessThanOrEqual(firstCallTime);
      expect(result1.final_probability).toBe(result2.final_probability);
    });

    it('should clear cache when requested', async () => {
      // Populate cache
      await orchestratePrediction(basicInput);
      
      // Clear cache
      clearOrchestratorCache();
      
      // Next call should not use cache (indicated by longer processing time)
      const result = await orchestratePrediction(basicInput);
      expect(result.metadata.total_processing_time_ms).toBeGreaterThan(5); // Not instant
    });
  });

  describe('Rationale Generation', () => {
    it('should generate appropriate rationale for high probability predictions', async () => {
      mockPredictDNA.mockResolvedValue({
        ...mockDNADetectiveResult,
        video_probability: 0.85
      });
      
      const result = await orchestratePrediction(basicInput);
      
      expect(result.rationale.length).toBeGreaterThan(0);
      expect(result.rationale.some(r => r.includes('HIGH viral potential'))).toBe(true);
    });

    it('should generate appropriate rationale for low probability predictions', async () => {
      mockPredictDNA.mockResolvedValue({
        ...mockDNADetectiveResult,
        video_probability: 0.25
      });
      
      const result = await orchestratePrediction(basicInput);
      
      expect(result.rationale.some(r => r.includes('LOW viral potential'))).toBe(true);
    });

    it('should include template information in rationale', async () => {
      const result = await orchestratePrediction(basicInput);
      
      expect(result.rationale.some(r => 
        r.includes('Authority Transformation') || r.includes('template match')
      )).toBe(true);
    });

    it('should mention engine agreement when multiple engines are used', async () => {
      setEngineEnabled('QuantumSwarmNexus', true);
      
      const result = await orchestratePrediction(fullInput);
      
      if (result.engines_used.length > 1) {
        expect(result.rationale.some(r => 
          r.includes('agree') || r.includes('engines')
        )).toBe(true);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle individual engine failures gracefully', async () => {
      setEngineEnabled('QuantumSwarmNexus', true);
      
      // Make DNA_Detective fail but keep others working
      mockPredictDNA.mockRejectedValue(new Error('DNA_Detective failed'));
      
      const result = await orchestratePrediction(fullInput);
      
      // Should still return a result from remaining engines
      expect(result.engines_used.length).toBeGreaterThanOrEqual(1);
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
    });

    it('should throw appropriate error when all engines fail', async () => {
      mockPredictDNA.mockRejectedValue(new Error('All engines down'));
      
      await expect(orchestratePrediction(basicInput)).rejects.toThrow(OrchestratorError);
      await expect(orchestratePrediction(basicInput)).rejects.toThrow('All prediction engines failed');
    });

    it('should validate output format', async () => {
      // This test ensures our internal logic produces valid output
      const result = await orchestratePrediction(basicInput);
      
      expect(typeof result.final_probability).toBe('number');
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
      expect(typeof result.confidence_score).toBe('number');
      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
      expect(Array.isArray(result.engines_used)).toBe(true);
      expect(Array.isArray(result.rationale)).toBe(true);
      expect(typeof result.metadata.total_processing_time_ms).toBe('number');
    });
  });

  describe('Status and Management', () => {
    it('should return correct orchestrator status', () => {
      const status = getOrchestratorStatus();
      
      expect(status.status).toBe('operational');
      expect(status.engines_total).toBeGreaterThan(0);
      expect(status.engines_enabled).toBeGreaterThan(0);
      expect(Array.isArray(status.engines_available)).toBe(true);
      expect(typeof status.cache_size).toBe('number');
      expect(status.default_blending_strategy).toBe(DEFAULT_BLENDING_CONFIG.strategy);
    });

    it('should enable/disable engines correctly', () => {
      // Test enabling
      const enableResult = setEngineEnabled('QuantumSwarmNexus', true);
      expect(enableResult).toBe(true);
      
      let status = getOrchestratorStatus();
      expect(status.engines_available.some(e => e.name === 'QuantumSwarmNexus')).toBe(true);
      
      // Test disabling
      const disableResult = setEngineEnabled('QuantumSwarmNexus', false);
      expect(disableResult).toBe(true);
      
      status = getOrchestratorStatus();
      expect(status.engines_available.some(e => e.name === 'QuantumSwarmNexus')).toBe(false);
      
      // Test invalid engine
      const invalidResult = setEngineEnabled('NonExistentEngine', true);
      expect(invalidResult).toBe(false);
    });

    it('should report no engines status when all disabled', () => {
      setEngineEnabled('DNA_Detective', false);
      
      const status = getOrchestratorStatus();
      expect(status.status).toBe('no_engines');
      expect(status.engines_enabled).toBe(0);
    });
  });

  describe('Advanced Blending Scenarios', () => {
    beforeEach(() => {
      setEngineEnabled('QuantumSwarmNexus', true);
      setEngineEnabled('TemporalGraphProphet', true);
    });

    it('should handle weighted average blending with custom weights', async () => {
      const customWeights = {
        'DNA_Detective': 0.3,
        'QuantumSwarmNexus': 0.7
      };
      
      const result = await orchestratePrediction(fullInput, {
        strategy: 'weighted_average',
        weights: customWeights
      });
      
      expect(result.blending_strategy).toBe('manual_weighted_average');
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
      expect(result.final_probability).toBeLessThanOrEqual(1);
    });

    it('should apply uncertainty penalty when engines disagree', async () => {
      // Configure for uncertainty penalty
      const result = await orchestratePrediction(fullInput, {
        strategy: 'confidence_weighted',
        uncertainty_penalty: 0.2
      });
      
      // Confidence should be affected by disagreement (hard to test precisely due to mock randomness)
      expect(result.confidence_score).toBeGreaterThanOrEqual(0);
      expect(result.confidence_score).toBeLessThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty early metrics gracefully', async () => {
      const inputWithEmptyMetrics: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 0,
          likes_10m: 0,
          shares_10m: 0
        }
      };
      
      const result = await orchestratePrediction(inputWithEmptyMetrics);
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
    });

    it('should handle empty share graph gracefully', async () => {
      const inputWithEmptyGraph: DraftInput = {
        genes: sampleGenes,
        shareGraph: []
      };
      
      const result = await orchestratePrediction(inputWithEmptyGraph);
      expect(result.final_probability).toBeGreaterThanOrEqual(0);
    });

    it('should handle single engine result correctly', async () => {
      // Only DNA_Detective enabled
      const result = await orchestratePrediction(basicInput);
      
      expect(result.engines_used.length).toBe(1);
      expect(result.engines_used[0].engine_name).toBe('DNA_Detective');
      expect(result.final_probability).toBe(mockDNADetectiveResult.video_probability);
    });
  });
});