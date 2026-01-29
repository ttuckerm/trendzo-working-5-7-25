/**
 * Orchestrator MVP Test Suite
 * Tests for the simplified prediction router and blender
 */

import { predictDraft, DraftInput, PredictionResult } from '../../../lib/modules/orchestrator-mvp';

// Mock DNA_Detective module
jest.mock('../../../lib/modules/dna-detective', () => ({
  predictDNA: jest.fn()
}));

const mockPredictDNA = require('../../../lib/modules/dna-detective').predictDNA as jest.MockedFunction<any>;

describe('Orchestrator MVP', () => {
  const sampleGenes = Array(48).fill(false).map((_, i) => i % 7 === 0); // Every 7th gene true
  
  const mockDNAResult = {
    video_probability: 0.73,
    closest_template: {
      id: 'template-123',
      name: 'Authority Transformation',
      status: 'HOT' as const,
      distance: 0.25
    },
    top_gene_matches: ['AuthorityHook', 'TransformationBeforeAfter']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPredictDNA.mockResolvedValue(mockDNAResult);
  });

  describe('Input Validation', () => {
    it('should reject invalid genes array length', async () => {
      const invalidInput: DraftInput = {
        genes: Array(47).fill(false) // Wrong length
      };
      
      await expect(predictDraft(invalidInput)).rejects.toThrow('Invalid input: genes must be boolean array of length 48');
    });

    it('should reject missing genes', async () => {
      const invalidInput = {} as DraftInput;
      
      await expect(predictDraft(invalidInput)).rejects.toThrow('Invalid input: genes must be boolean array of length 48');
    });
  });

  describe('Test Case 1: Genes Only', () => {
    it('should use only DNA_Detective with genes-only input', async () => {
      const input: DraftInput = {
        genes: sampleGenes
      };
      
      const result = await predictDraft(input);
      
      expect(mockPredictDNA).toHaveBeenCalledWith(sampleGenes);
      expect(mockPredictDNA).toHaveBeenCalledTimes(1);
      
      expect(result.enginesUsed).toEqual(['DNA_Detective']);
      expect(result.probability).toBe(0.73); // Should match DNA_Detective result exactly
      expect(result.probability).toBeGreaterThanOrEqual(0);
      expect(result.probability).toBeLessThanOrEqual(1);
      expect(result.rationales.length).toBeGreaterThan(0);
      expect(result.rationales[0]).toContain('Authority Transformation');
      expect(result.rationales[0]).toContain('0.250');
    });
  });

  describe('Test Case 2: Early Metrics Trigger QuantumSwarmNexus', () => {
    it('should include QuantumSwarmNexus when views_10m >= 500', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 1000,
          likes_10m: 50,
          shares_10m: 10
        }
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toContain('DNA_Detective');
      expect(result.enginesUsed).toContain('QuantumSwarmNexus');
      expect(result.enginesUsed.length).toBe(2);
      
      // Should be blended: DNA_Detective(0.73) * 0.6 + QuantumSwarmNexus(0.5) * 0.4 = 0.638
      expect(result.probability).toBeCloseTo(0.638, 3);
      
      expect(result.rationales).toContain('High early velocity triggered QuantumSwarm routing');
    });

    it('should NOT include QuantumSwarmNexus when views_10m < 500', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 300, // Below threshold
          likes_10m: 20,
          shares_10m: 5
        }
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toEqual(['DNA_Detective']);
      expect(result.probability).toBe(0.73); // Only DNA_Detective
      expect(result.rationales).not.toContain('High early velocity triggered QuantumSwarm routing');
    });
  });

  describe('Test Case 3: Share Graph Trigger', () => {
    it('should include QuantumSwarmNexus when shareGraph length >= 50', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        shareGraph: Array(60).fill(null).map((_, i) => ({
          from: `user${i}`,
          to: `user${i + 1}`,
          t: 1642636800 + i
        }))
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toContain('DNA_Detective');
      expect(result.enginesUsed).toContain('QuantumSwarmNexus');
      expect(result.probability).toBeCloseTo(0.638, 3); // Same blended result
      expect(result.rationales).toContain('Large share graph triggered QuantumSwarm routing');
    });

    it('should NOT include QuantumSwarmNexus when shareGraph length < 50', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        shareGraph: Array(30).fill(null).map((_, i) => ({
          from: `user${i}`,
          to: `user${i + 1}`,
          t: 1642636800 + i
        }))
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toEqual(['DNA_Detective']);
      expect(result.probability).toBe(0.73);
    });
  });

  describe('Test Case 4: Engine Failure Handling', () => {
    it('should continue with other engines when DNA_Detective throws', async () => {
      mockPredictDNA.mockRejectedValue(new Error('DNA_Detective failed'));
      
      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 1000,
          likes_10m: 50,
          shares_10m: 10
        }
      };
      
      const result = await predictDraft(input);
      
      // Should still return QuantumSwarmNexus result
      expect(result.enginesUsed).toEqual(['QuantumSwarmNexus']);
      expect(result.probability).toBe(0.5); // QuantumSwarmNexus stub value
      expect(result.rationales.length).toBeGreaterThan(0);
    });

    it('should return probability 0 when all engines fail', async () => {
      mockPredictDNA.mockRejectedValue(new Error('DNA_Detective failed'));
      
      const input: DraftInput = {
        genes: sampleGenes // Only DNA_Detective would be called, and it fails
      };
      
      const result = await predictDraft(input);
      
      expect(result.probability).toBe(0.0);
      expect(result.enginesUsed).toEqual([]);
      expect(result.rationales).toEqual(['All prediction engines failed']);
    });
  });

  describe('Weight Blending Logic', () => {
    it('should correctly blend probabilities with fixed weights', async () => {
      // DNA_Detective returns 0.8, QuantumSwarmNexus returns 0.5 (stub)
      mockPredictDNA.mockResolvedValue({
        ...mockDNAResult,
        video_probability: 0.8
      });

      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 1000,
          likes_10m: 50,
          shares_10m: 10
        }
      };
      
      const result = await predictDraft(input);
      
      // Expected: 0.8 * 0.6 + 0.5 * 0.4 = 0.48 + 0.2 = 0.68
      expect(result.probability).toBeCloseTo(0.68, 3);
      expect(result.enginesUsed.length).toBe(2);
    });

    it('should handle single engine weight normalization', async () => {
      const input: DraftInput = {
        genes: sampleGenes
      };
      
      const result = await predictDraft(input);
      
      // With only DNA_Detective, weight normalizes to 1.0
      expect(result.probability).toBe(0.73);
      expect(result.enginesUsed).toEqual(['DNA_Detective']);
    });
  });

  describe('Rationale Generation', () => {
    it('should include DNA template match rationale', async () => {
      const input: DraftInput = {
        genes: sampleGenes
      };
      
      const result = await predictDraft(input);
      
      expect(result.rationales).toContain('DNA match to template Authority Transformation at distance 0.250');
    });

    it('should include both rationales when both engines called', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 1000,
          likes_10m: 50,
          shares_10m: 10
        }
      };
      
      const result = await predictDraft(input);
      
      expect(result.rationales).toContain('DNA match to template Authority Transformation at distance 0.250');
      expect(result.rationales).toContain('High early velocity triggered QuantumSwarm routing');
    });

    it('should provide fallback rationale when no template data available', async () => {
      mockPredictDNA.mockResolvedValue({
        video_probability: 0.5,
        closest_template: null,
        top_gene_matches: []
      });

      const input: DraftInput = {
        genes: sampleGenes
      };
      
      const result = await predictDraft(input);
      
      expect(result.rationales).toContain('Basic gene analysis completed');
    });
  });

  describe('Performance Requirements', () => {
    it('should complete genes-only prediction quickly', async () => {
      const input: DraftInput = {
        genes: sampleGenes
      };
      
      const startTime = Date.now();
      await predictDraft(input);
      const duration = Date.now() - startTime;
      
      // P95 <= 100ms target (allowing some margin for test environment)
      expect(duration).toBeLessThan(200);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty shareGraph', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        shareGraph: []
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toEqual(['DNA_Detective']);
      expect(result.probability).toBe(0.73);
    });

    it('should handle exactly threshold values', async () => {
      // Test exactly at views_10m = 500 threshold
      const input: DraftInput = {
        genes: sampleGenes,
        earlyMetrics: {
          views_10m: 500,
          likes_10m: 25,
          shares_10m: 5
        }
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toContain('QuantumSwarmNexus');
    });

    it('should handle exactly shareGraph = 50 threshold', async () => {
      const input: DraftInput = {
        genes: sampleGenes,
        shareGraph: Array(50).fill(null).map((_, i) => ({
          from: `user${i}`,
          to: `user${i + 1}`,
          t: 1642636800 + i
        }))
      };
      
      const result = await predictDraft(input);
      
      expect(result.enginesUsed).toContain('QuantumSwarmNexus');
    });
  });
});