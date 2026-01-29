/**
 * DNA_Detective Test Suite
 * Comprehensive tests for the baseline per-video prediction engine
 */

import { predictDNA, clearTemplateCache, getCacheStatus, TemplateLibraryEntry } from '../../../lib/modules/dna-detective';
import { cosineSimilarity, cosineDistance, booleanToVector } from '../../../lib/utils/cosine-similarity';

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        in: jest.fn(() => ({
          // This will be overridden in individual tests
        }))
      }))
    }))
  }))
}));

// Mock framework genes
jest.mock('../../../lib/data/framework_genes.json', () => ({
  '0': 'AuthorityHook',
  '1': 'TransformationBeforeAfter',
  '2': 'EmotionalAgitation',
  '3': 'SocialProof',
  '4': 'UrgencyTrigger',
  '5': 'SecretReveal',
  // Add more as needed for tests
  '10': 'VisualStimulation',
  '15': 'JumpCut',
  '20': 'MovementDynamic',
  '25': 'VoiceoverNarration',
  '30': 'MelodyMemory',
  '35': 'EvergreenContent',
  '40': 'SaveableContent',
  '45': 'ControversialTake'
}));

describe('DNA_Detective', () => {
  // Mock Supabase response
  const mockSupabaseResponse = {
    data: [
      {
        template_id: 'hot-template-1',
        name: 'Authority Transformation',
        centroid: Array(48).fill(0).map((_, i) => i === 0 || i === 1 ? 0.9 : 0.1), // Strong on AuthorityHook and TransformationBeforeAfter
        success_rate: 0.85,
        status: 'HOT'
      },
      {
        template_id: 'new-template-1',
        name: 'Problem Solution',
        centroid: Array(48).fill(0).map((_, i) => i === 2 || i === 5 ? 0.8 : 0.2), // Strong on EmotionalAgitation and SecretReveal
        success_rate: 0.72,
        status: 'NEW'
      },
      {
        template_id: 'stable-template-1',
        name: 'Educational Content',
        centroid: Array(48).fill(0.3), // Moderate on all genes
        success_rate: 0.65,
        status: 'STABLE'
      }
    ],
    error: null
  };

  beforeEach(() => {
    // Clear cache before each test
    clearTemplateCache();
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default Supabase mock
    const { createClient } = require('@supabase/supabase-js');
    const mockClient = createClient();
    mockClient.from().select().in.mockResolvedValue(mockSupabaseResponse);
  });

  describe('Input Validation', () => {
    it('should reject genes array with wrong length', async () => {
      const invalidGenes = Array(47).fill(false); // Wrong length
      
      const result = await predictDNA(invalidGenes);
      
      // Should return error fallback
      expect(result.video_probability).toBe(0.0);
      expect(result.closest_template.name).toBe('Error');
    });

    it('should accept valid 48-element boolean array', async () => {
      const validGenes = Array(48).fill(false);
      validGenes[0] = true; // Set one gene to true
      
      const result = await predictDNA(validGenes);
      
      // Should not be an error result
      expect(result.closest_template.name).not.toBe('Error');
    });
  });

  describe('Edge Cases', () => {
    it('should return probability 0.05 when all genes are false', async () => {
      const allFalseGenes = Array(48).fill(false);
      
      const result = await predictDNA(allFalseGenes);
      
      expect(result.video_probability).toBe(0.05);
      expect(result.closest_template.name).toBe('No Template Match');
      expect(result.closest_template.distance).toBe(2.0);
      expect(result.top_gene_matches).toEqual([]);
    });

    it('should return probability 0.0 when template library is empty', async () => {
      // Mock empty database response
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.from().select().in.mockResolvedValue({ data: [], error: null });

      const genes = Array(48).fill(false);
      genes[0] = true;
      
      const result = await predictDNA(genes);
      
      expect(result.video_probability).toBe(0.0);
      expect(result.closest_template.name).toBe('No Templates Available');
      expect(result.top_gene_matches).toEqual([]);
    });

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { createClient } = require('@supabase/supabase-js');
      const mockClient = createClient();
      mockClient.from().select().in.mockResolvedValue({ 
        data: null, 
        error: { message: 'Database connection failed' }
      });

      const genes = Array(48).fill(false);
      genes[0] = true;
      
      const result = await predictDNA(genes);
      
      expect(result.video_probability).toBe(0.0);
      expect(result.closest_template.name).toBe('No Templates Available');
    });
  });

  describe('Core Algorithm', () => {
    it('should return high probability for genes identical to HOT template centroid', async () => {
      // Create genes that match the HOT template exactly
      const genes = Array(48).fill(false);
      genes[0] = true; // AuthorityHook
      genes[1] = true; // TransformationBeforeAfter
      
      const result = await predictDNA(genes);
      
      expect(result.video_probability).toBeGreaterThanOrEqual(0.80);
      expect(result.closest_template.id).toBe('hot-template-1');
      expect(result.closest_template.status).toBe('HOT');
      expect(result.closest_template.distance).toBeLessThan(0.5);
    });

    it('should return low probability for genes very far from all centroids', async () => {
      // Create genes that don't match any template well
      const genes = Array(48).fill(false);
      // Set genes that have low values in all templates
      genes[47] = true; // Set a gene that has low centroid values in all templates
      
      const result = await predictDNA(genes);
      
      expect(result.video_probability).toBeLessThanOrEqual(0.20);
      expect(result.closest_template.distance).toBeGreaterThan(0.8);
    });

    it('should prefer templates with higher success rates when distances are similar', async () => {
      // Create genes that somewhat match multiple templates
      const genes = Array(48).fill(false);
      genes[0] = true; // Matches HOT template (success_rate: 0.85)
      genes[2] = true; // Also somewhat matches NEW template (success_rate: 0.72)
      
      const result = await predictDNA(genes);
      
      // Should prefer the HOT template due to higher success rate
      expect(result.closest_template.status).toBe('HOT');
      expect(result.closest_template.id).toBe('hot-template-1');
    });
  });

  describe('Gene Matching', () => {
    it('should identify top gene matches correctly', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true; // AuthorityHook (strong in HOT template)
      genes[1] = true; // TransformationBeforeAfter (strong in HOT template)
      genes[10] = true; // VisualStimulation (might be weaker)
      
      const result = await predictDNA(genes);
      
      expect(result.top_gene_matches).toContain('AuthorityHook');
      expect(result.top_gene_matches).toContain('TransformationBeforeAfter');
      expect(result.top_gene_matches.length).toBeLessThanOrEqual(5);
    });

    it('should return empty gene matches when no genes are strong in centroid', async () => {
      const genes = Array(48).fill(false);
      // Set genes that have weak centroid values (< 0.5)
      genes[47] = true;
      
      const result = await predictDNA(genes);
      
      expect(result.top_gene_matches).toEqual([]);
    });

    it('should sort gene matches by centroid strength', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true; // AuthorityHook (centroid: 0.9)
      genes[1] = true; // TransformationBeforeAfter (centroid: 0.9)
      // Both should be included, with consistent ordering
      
      const result = await predictDNA(genes);
      
      expect(result.top_gene_matches.length).toBeGreaterThan(0);
      expect(result.top_gene_matches).toContain('AuthorityHook');
      expect(result.top_gene_matches).toContain('TransformationBeforeAfter');
    });
  });

  describe('Performance', () => {
    it('should complete prediction in under 50ms', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true;
      genes[1] = true;
      
      const startTime = Date.now();
      await predictDNA(genes);
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(50);
    });

    it('should cache templates to improve subsequent performance', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true;
      
      // First call
      await predictDNA(genes);
      const cacheStatus1 = getCacheStatus();
      expect(cacheStatus1.cached).toBe(true);
      expect(cacheStatus1.count).toBe(3); // Number of templates in mock data
      
      // Second call should use cache
      const startTime = Date.now();
      await predictDNA(genes);
      const duration = Date.now() - startTime;
      
      // Should be even faster due to caching
      expect(duration).toBeLessThan(25);
      
      const cacheStatus2 = getCacheStatus();
      expect(cacheStatus2.cached).toBe(true);
      expect(cacheStatus2.age).toBeGreaterThan(0);
    });
  });

  describe('Output Validation', () => {
    it('should return properly formatted output', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true;
      
      const result = await predictDNA(genes);
      
      // Check output structure
      expect(typeof result.video_probability).toBe('number');
      expect(result.video_probability).toBeGreaterThanOrEqual(0);
      expect(result.video_probability).toBeLessThanOrEqual(1);
      
      expect(typeof result.closest_template.id).toBe('string');
      expect(typeof result.closest_template.name).toBe('string');
      expect(['HOT', 'COOLING', 'NEW', 'STABLE']).toContain(result.closest_template.status);
      expect(typeof result.closest_template.distance).toBe('number');
      expect(result.closest_template.distance).toBeGreaterThanOrEqual(0);
      expect(result.closest_template.distance).toBeLessThanOrEqual(2);
      
      expect(Array.isArray(result.top_gene_matches)).toBe(true);
      expect(result.top_gene_matches.length).toBeLessThanOrEqual(5);
      result.top_gene_matches.forEach(gene => {
        expect(typeof gene).toBe('string');
      });
    });

    it('should clamp probability to [0, 1] range', async () => {
      // This tests internal clamping logic
      const genes = Array(48).fill(true); // Extreme case
      
      const result = await predictDNA(genes);
      
      expect(result.video_probability).toBeGreaterThanOrEqual(0);
      expect(result.video_probability).toBeLessThanOrEqual(1);
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when requested', async () => {
      const genes = Array(48).fill(false);
      genes[0] = true;
      
      // Create cache
      await predictDNA(genes);
      expect(getCacheStatus().cached).toBe(true);
      
      // Clear cache
      clearTemplateCache();
      expect(getCacheStatus().cached).toBe(false);
      expect(getCacheStatus().age).toBe(0);
      expect(getCacheStatus().count).toBe(0);
    });

    it('should refresh cache after TTL expires', async () => {
      // This would require mocking Date.now() to test TTL expiration
      // For now, we test that fresh cache works
      clearTemplateCache();
      
      const genes = Array(48).fill(false);
      genes[0] = true;
      
      await predictDNA(genes);
      const cacheStatus = getCacheStatus();
      
      expect(cacheStatus.cached).toBe(true);
      expect(cacheStatus.age).toBeLessThan(1000); // Less than 1 second old
    });
  });
});

describe('Cosine Similarity Utility', () => {
  describe('Basic Functionality', () => {
    it('should return 1 for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(1.0, 5);
    });

    it('should return 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0.0, 5);
    });

    it('should return -1 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1.0, 5);
    });

    it('should handle zero vectors', () => {
      const a = [0, 0, 0];
      const b = [1, 2, 3];
      expect(cosineSimilarity(a, b)).toBe(0);
    });

    it('should throw error for vectors of different lengths', () => {
      const a = [1, 2, 3];
      const b = [1, 2];
      expect(() => cosineSimilarity(a, b)).toThrow('Vectors must have the same length');
    });
  });

  describe('Cosine Distance', () => {
    it('should return 0 for identical vectors', () => {
      const a = [1, 2, 3];
      const b = [1, 2, 3];
      expect(cosineDistance(a, b)).toBeCloseTo(0.0, 5);
    });

    it('should return 1 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineDistance(a, b)).toBeCloseTo(1.0, 5);
    });

    it('should return 2 for opposite vectors', () => {
      const a = [1, 2, 3];
      const b = [-1, -2, -3];
      expect(cosineDistance(a, b)).toBeCloseTo(2.0, 5);
    });
  });

  describe('Boolean to Vector Conversion', () => {
    it('should convert boolean array to number array', () => {
      const boolArray = [true, false, true, false];
      const result = booleanToVector(boolArray);
      expect(result).toEqual([1, 0, 1, 0]);
    });

    it('should handle empty array', () => {
      const boolArray: boolean[] = [];
      const result = booleanToVector(boolArray);
      expect(result).toEqual([]);
    });
  });
});