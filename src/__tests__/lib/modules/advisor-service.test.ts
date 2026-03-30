/**
 * AdvisorService Test Suite
 * Tests for template match and fix-list generation
 */

import { advise, AdvisorInput, AdvisorOutput } from '../../../lib/modules/advisor-service';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      insert: jest.fn()
    }))
  }))
}));

// Mock lodash clamp
jest.mock('lodash', () => ({
  clamp: jest.fn((value, min, max) => Math.min(Math.max(value, min), max))
}));

// Mock framework genes
jest.mock('../../../lib/data/framework_genes.json', () => ({
  0: 'AuthorityHook',
  1: 'TransformationBeforeAfter',
  2: 'SecretReveal',
  3: 'ControversyPolarizing',
  4: 'TrendConnection',
  5: 'PersonalStory',
  6: 'VisualHook',
  7: 'CallToAction'
}));

const mockSupabase = require('@supabase/supabase-js').createClient();

describe('AdvisorService', () => {
  const baseInput: AdvisorInput = {
    video_id: 'test-video-123',
    genes: Array(48).fill(false),
    prediction: {
      probability: 0.60,
      closest_template: {
        id: 'template-456',
        name: 'Authority Transformation',
        status: 'HOT',
        distance: 0.25
      },
      enginesUsed: ['DNA_Detective']
    }
  };

  const mockTemplate = {
    id: 'template-456',
    name: 'Authority Transformation',
    status: 'HOT',
    centroid: Array(48).fill(0.3), // Most genes inactive
    created_at: '2024-01-20T10:00:00Z'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default successful template fetch
    mockSupabase.from().select().eq().single.mockResolvedValue({
      data: mockTemplate,
      error: null
    });
    
    // Default successful insert
    mockSupabase.from().insert.mockResolvedValue({
      data: {},
      error: null
    });
  });

  describe('Test Case 1: Draft Missing Two Genes', () => {
    it('should generate fix_list with 2 items and increase expected_prob by 0.20', async () => {
      // Setup: Template has genes 0 and 1 active (≥ 0.5), draft has them inactive
      const templateWithActiveGenes = {
        ...mockTemplate,
        centroid: Array(48).fill(0.3).map((val, i) => i === 0 || i === 1 ? 0.8 : val)
      };
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: templateWithActiveGenes,
        error: null
      });

      const input = {
        ...baseInput,
        genes: Array(48).fill(false) // Missing genes 0 and 1
      };

      const result = await advise(input);

      expect(result.recommendation.fix_list).toHaveLength(2);
      expect(result.recommendation.expected_probability).toBeCloseTo(0.80); // 0.60 + (2 * 0.10)
      expect(result.recommendation.template_id).toBe('template-456');
      expect(result.recommendation.template_name).toBe('Authority Transformation');
      
      // Check that fixes are generated for AuthorityHook and TransformationBeforeAfter
      expect(result.recommendation.fix_list[0]).toContain('Authority');
      expect(result.recommendation.fix_list[1]).toContain('before/after');
    });
  });

  describe('Test Case 2: Draft Perfect Match', () => {
    it('should return "No changes needed" when all required genes are present', async () => {
      // Setup: Template has genes 0 and 1 active, draft also has them active
      const templateWithActiveGenes = {
        ...mockTemplate,
        centroid: Array(48).fill(0.3).map((val, i) => i === 0 || i === 1 ? 0.8 : val)
      };
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: templateWithActiveGenes,
        error: null
      });

      const input = {
        ...baseInput,
        genes: Array(48).fill(false).map((val, i) => i === 0 || i === 1 ? true : val) // Has required genes
      };

      const result = await advise(input);

      expect(result.recommendation.fix_list).toEqual(['No changes needed—publish as is.']);
      expect(result.recommendation.expected_probability).toBe(0.60); // No change
      expect(result.recommendation.template_id).toBe('template-456');
    });
  });

  describe('Test Case 3: Closest Template COOLING', () => {
    it('should warn about cooling template in fix_list', async () => {
      const coolingTemplate = {
        ...mockTemplate,
        status: 'COOLING'
      };
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: coolingTemplate,
        error: null
      });

      const result = await advise(baseInput);

      expect(result.recommendation.fix_list).toEqual(['Template cooling—consider different topic']);
      expect(result.recommendation.template_id).toBe('template-456');
      expect(result.recommendation.template_name).toBe('Authority Transformation');
    });
  });

  describe('Fix Recommendation Generation', () => {
    it('should generate contextual fixes for different gene types', async () => {
      // Setup template with multiple gene types active
      const multiGeneTemplate = {
        ...mockTemplate,
        centroid: Array(48).fill(0.3).map((val, i) => {
          if ([0, 1, 2, 3, 4].includes(i)) return 0.8; // Multiple genes active
          return val;
        })
      };
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: multiGeneTemplate,
        error: null
      });

      const input = {
        ...baseInput,
        genes: Array(48).fill(false) // Missing all active genes
      };

      const result = await advise(input);

      expect(result.recommendation.fix_list).toHaveLength(5); // Max 5 fixes
      expect(result.recommendation.fix_list[0]).toContain('Authority');
      expect(result.recommendation.fix_list[1]).toContain('before/after');
      expect(result.recommendation.fix_list[2]).toContain('secret');
      expect(result.recommendation.fix_list[3]).toContain('controversial');
      expect(result.recommendation.fix_list[4]).toContain('trend');
    });

    it('should limit fixes to maximum of 5 items', async () => {
      // Setup template with 10 genes active
      const manyGenesTemplate = {
        ...mockTemplate,
        centroid: Array(48).fill(0.3).map((val, i) => i < 10 ? 0.8 : val)
      };
      
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: manyGenesTemplate,
        error: null
      });

      const input = {
        ...baseInput,
        genes: Array(48).fill(false) // Missing all 10 active genes
      };

      const result = await advise(input);

      expect(result.recommendation.fix_list).toHaveLength(5); // Capped at 5
      expect(result.recommendation.expected_probability).toBeCloseTo(1.0); // Clamped at 1.0
    });
  });

  describe('Error Handling', () => {
    it('should handle template not found gracefully', async () => {
      mockSupabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'Template not found' }
      });

      const result = await advise(baseInput);

      expect(result.recommendation.fix_list).toEqual(['Analysis unavailable—system error occurred']);
      expect(result.recommendation.template_id).toBe('template-456');
      expect(result.recommendation.expected_probability).toBe(0.60);
    });

    it('should handle database errors gracefully', async () => {
      mockSupabase.from().select().eq().single.mockRejectedValue(new Error('Database connection failed'));

      const result = await advise(baseInput);

      expect(result.recommendation.fix_list).toEqual(['Analysis unavailable—system error occurred']);
      expect(result.recommendation.expected_probability).toBe(0.60);
    });
  });

  describe('Performance Requirements', () => {
    it('should complete analysis quickly', async () => {
      const startTime = Date.now();
      await advise(baseInput);
      const duration = Date.now() - startTime;

      // Target: < 10ms (allowing margin for test environment)
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Database Integration', () => {
    it('should save advisory data to video_advice table', async () => {
      await advise(baseInput);

      expect(mockSupabase.from).toHaveBeenCalledWith('video_advice');
      expect(mockSupabase.from().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'test-video-123',
          template_id: 'template-456',
          original_prob: 0.60,
          expected_prob: expect.any(Number),
          fix_list: expect.any(Array),
          created_at: expect.any(String)
        })
      );
    });
  });

  describe('Input Validation', () => {
    it('should handle invalid gene array length', async () => {
      const invalidInput = {
        ...baseInput,
        genes: Array(47).fill(false) // Wrong length
      };

      // Should still work - no explicit validation in spec
      const result = await advise(invalidInput);
      expect(result).toBeDefined();
      expect(result.recommendation).toBeDefined();
    });
  });
});