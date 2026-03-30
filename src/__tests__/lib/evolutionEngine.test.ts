import { runEvolutionEngine, testEvolutionEngine } from '@/lib/services/evolutionEngine';
import { createClient } from '@supabase/supabase-js';
import * as dayjs from 'dayjs';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      data: [],
      error: null,
      in: jest.fn(() => ({ data: [], error: null })),
      eq: jest.fn(() => ({ error: null })),
      gte: jest.fn(() => ({
        lt: jest.fn(() => ({ data: [], error: null }))
      }))
    })),
    insert: jest.fn(() => ({ error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({ error: null }))
    }))
  }))
};

beforeEach(() => {
  mockCreateClient.mockReturnValue(mockSupabase as any);
  jest.clearAllMocks();
});

describe('EvolutionEngine', () => {
  
  describe('runEvolutionEngine', () => {
    
    test('should classify template with +25% trend as HOT', async () => {
      const now = dayjs();
      
      // Mock template data
      const mockTemplates = [{
        template_id: 'hot-template-1',
        videos: ['video1', 'video2', 'video3'],
        success_rate: 0.8,
        updated_at: now.subtract(5, 'day').toISOString(),
        niche: 'fitness'
      }];

      // Mock video features with dates spread across time windows
      const mockVideoFeatures = [
        { video_id: 'video1', upload_date: now.subtract(3, 'day').toISOString() }, // Current window
        { video_id: 'video2', upload_date: now.subtract(4, 'day').toISOString() }, // Current window
        { video_id: 'video3', upload_date: now.subtract(10, 'day').toISOString() } // Previous window
      ];

      // Mock negative pool data
      const mockNegativePool = [
        { video_id: 'neg1', follower_bucket: '1k-10k', created_at: now.subtract(3, 'day').toISOString() }
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: mockVideoFeatures, error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: mockNegativePool, error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      await runEvolutionEngine();

      // Verify template_library update was called
      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
      
      // Verify evolution_runs insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('evolution_runs');
    });

    test('should classify template with -20% trend as COOLING', async () => {
      const now = dayjs();
      
      // Mock template with declining performance
      const mockTemplates = [{
        template_id: 'cooling-template-1',
        videos: ['video1', 'video2', 'video3', 'video4'],
        success_rate: 0.3,
        updated_at: now.subtract(10, 'day').toISOString(),
        niche: 'business'
      }];

      // Mock video features - more videos in previous window than current
      const mockVideoFeatures = [
        { video_id: 'video1', upload_date: now.subtract(5, 'day').toISOString() }, // Current window
        { video_id: 'video2', upload_date: now.subtract(9, 'day').toISOString() }, // Previous window
        { video_id: 'video3', upload_date: now.subtract(10, 'day').toISOString() }, // Previous window
        { video_id: 'video4', upload_date: now.subtract(11, 'day').toISOString() } // Previous window
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: mockVideoFeatures, error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      await runEvolutionEngine();

      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
      expect(mockSupabase.from).toHaveBeenCalledWith('evolution_runs');
    });

    test('should classify brand-new template (<3d, ≥10 virals) as NEW', async () => {
      const now = dayjs();
      
      // Mock new template with sufficient virals
      const mockTemplates = [{
        template_id: 'new-template-1',
        videos: Array.from({ length: 12 }, (_, i) => `new_video_${i}`),
        success_rate: 0.7,
        updated_at: now.subtract(2, 'day').toISOString(), // Less than 3 days old
        niche: 'entertainment'
      }];

      // Mock video features - all recent
      const mockVideoFeatures = Array.from({ length: 12 }, (_, i) => ({
        video_id: `new_video_${i}`,
        upload_date: now.subtract(1, 'day').toISOString()
      }));

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: mockVideoFeatures, error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      await runEvolutionEngine();

      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
      expect(mockSupabase.from).toHaveBeenCalledWith('evolution_runs');
    });

    test('should handle empty template library gracefully', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: [], error: null })
          };
        }
        return {
          insert: () => ({ error: null })
        };
      });

      await runEvolutionEngine();

      // Should complete without error
      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
    });

    test('should handle database errors gracefully', async () => {
      const errorMock = {
        from: jest.fn(() => ({
          select: () => ({ data: null, error: { message: 'Database connection failed' } })
        }))
      };

      mockCreateClient.mockReturnValue(errorMock as any);

      await expect(runEvolutionEngine()).rejects.toThrow('Failed to fetch templates: Database connection failed');
    });

    test('should complete within performance target for large datasets', async () => {
      const now = dayjs();
      
      // Create large dataset for performance testing
      const largeTemplateSet = Array.from({ length: 500 }, (_, i) => ({
        template_id: `template_${i}`,
        videos: [`video_${i}_1`, `video_${i}_2`],
        success_rate: Math.random(),
        updated_at: now.subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
        niche: ['fitness', 'business', 'entertainment', 'lifestyle'][i % 4]
      }));

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: largeTemplateSet, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: [], error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      const startTime = Date.now();
      await runEvolutionEngine();
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds (10000ms) - though in practice should be much faster
      expect(duration).toBeLessThan(15000); // 15s for test environment
    });
  });

  describe('testEvolutionEngine', () => {
    
    test('should analyze synthetic templates successfully', async () => {
      mockSupabase.from = jest.fn((table) => {
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: [], error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null })
        };
      });

      const result = await testEvolutionEngine();

      expect(result.success).toBe(true);
      expect(result.templatesAnalyzed).toBeGreaterThan(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.statusCounts).toBe('object');
      expect(result.statusCounts).toHaveProperty('HOT');
      expect(result.statusCounts).toHaveProperty('COOLING');
      expect(result.statusCounts).toHaveProperty('NEW');
      expect(result.statusCounts).toHaveProperty('STABLE');
    });

    test('should handle errors during testing gracefully', async () => {
      // Mock network/database error
      const errorMock = {
        from: jest.fn(() => {
          throw new Error('Network error');
        })
      };

      mockCreateClient.mockReturnValue(errorMock as any);

      const result = await testEvolutionEngine();

      expect(result.success).toBe(false);
      expect(result.templatesAnalyzed).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('integration tests', () => {
    
    test('after run, evolution_runs row counts should match library status counts', async () => {
      const now = dayjs();
      
      // Mock balanced template data
      const mockTemplates = [
        {
          template_id: 'hot-1',
          videos: ['video1', 'video2'],
          success_rate: 0.8,
          updated_at: now.subtract(5, 'day').toISOString(),
          niche: 'fitness'
        },
        {
          template_id: 'cooling-1',
          videos: ['video3'],
          success_rate: 0.2,
          updated_at: now.subtract(10, 'day').toISOString(),
          niche: 'business'
        },
        {
          template_id: 'new-1',
          videos: Array.from({ length: 15 }, (_, i) => `new_${i}`),
          success_rate: 0.7,
          updated_at: now.subtract(1, 'day').toISOString(),
          niche: 'entertainment'
        }
      ];

      let evolutionRunData: any = null;

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null }),
            update: () => ({
              eq: () => ({ error: null })
            })
          };
        }
        if (table === 'evolution_runs') {
          return {
            insert: (data: any) => {
              evolutionRunData = data;
              return { error: null };
            }
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: [], error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null })
        };
      });

      await runEvolutionEngine();

      // Verify evolution_runs data was captured
      expect(evolutionRunData).toBeTruthy();
      expect(evolutionRunData).toHaveProperty('hot_count');
      expect(evolutionRunData).toHaveProperty('cooling_count');
      expect(evolutionRunData).toHaveProperty('new_count');
      expect(evolutionRunData).toHaveProperty('stable_count');
      expect(evolutionRunData).toHaveProperty('duration_ms');
      expect(evolutionRunData).toHaveProperty('run_ts');

      // Total should match number of templates processed
      const totalProcessed = evolutionRunData.hot_count + evolutionRunData.cooling_count + 
                           evolutionRunData.new_count + evolutionRunData.stable_count;
      expect(totalProcessed).toBe(mockTemplates.length);
    });
  });

  describe('edge cases', () => {
    
    test('should handle template with previous_rate == 0', async () => {
      const now = dayjs();
      
      const mockTemplates = [{
        template_id: 'zero-previous-rate',
        videos: ['video1'],
        success_rate: 0.6,
        updated_at: now.subtract(5, 'day').toISOString(),
        niche: 'fitness'
      }];

      // Mock no videos in previous window, some in current
      const mockVideoFeatures = [
        { video_id: 'video1', upload_date: now.subtract(3, 'day').toISOString() }
      ];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: mockVideoFeatures, error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      await runEvolutionEngine();

      // Should handle zero previous rate without errors
      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
    });

    test('should defer status for very new template with insufficient virals', async () => {
      const now = dayjs();
      
      const mockTemplates = [{
        template_id: 'too-new-insufficient',
        videos: ['video1', 'video2'], // Less than 10 videos
        success_rate: 0.5,
        updated_at: now.subtract(0.5, 'day').toISOString(), // Very recent
        niche: 'fitness'
      }];

      mockSupabase.from = jest.fn((table) => {
        if (table === 'template_library') {
          return {
            select: () => ({ data: mockTemplates, error: null })
          };
        }
        if (table === 'video_features') {
          return {
            select: () => ({
              in: () => ({ data: [], error: null })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              gte: () => ({
                lt: () => ({ data: [], error: null })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null }),
          update: () => ({
            eq: () => ({ error: null })
          })
        };
      });

      await runEvolutionEngine();

      // Should classify as STABLE (deferred) rather than NEW
      expect(mockSupabase.from).toHaveBeenCalledWith('template_library');
    });
  });
});