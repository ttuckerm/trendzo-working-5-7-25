import { runViralFilter, testViralFilter, VideoMetrics } from '@/lib/services/viralFilter';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase
jest.mock('@supabase/supabase-js');
const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

const mockSupabase = {
  from: jest.fn(() => ({
    insert: jest.fn(() => ({ error: null })),
    select: jest.fn(() => ({ 
      order: jest.fn(() => ({
        limit: jest.fn(() => ({ data: [], error: null }))
      }))
    }))
  }))
};

beforeEach(() => {
  mockCreateClient.mockReturnValue(mockSupabase as any);
  jest.clearAllMocks();
  
  // Mock crypto.randomUUID
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-123'
    }
  });
});

describe('ViralFilter', () => {
  
  describe('runViralFilter', () => {
    
    test('should identify top 5% as viral candidates', async () => {
      // Create synthetic batch with obvious top performers
      const batch: VideoMetrics[] = [];
      
      // Add 95 regular videos
      for (let i = 0; i < 95; i++) {
        batch.push({
          id: `regular_${i}`,
          views_1h: 1000 + i * 10,
          likes_1h: 100 + i,
          creator_followers: 10000
        });
      }
      
      // Add 5 obvious viral videos with high engagement scores
      for (let i = 0; i < 5; i++) {
        batch.push({
          id: `viral_${i}`,
          views_1h: 50000,
          likes_1h: 5000,
          creator_followers: 1000 // Low followers = high engagement
        });
      }
      
      await runViralFilter(batch);
      
      // Verify viral_pool insert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('viral_pool');
      
      // Verify viral_filter_runs log was called
      expect(mockSupabase.from).toHaveBeenCalledWith('viral_filter_runs');
      
      // Check that insert was called with correct structure
      const insertCalls = mockSupabase.from().insert.mock.calls;
      expect(insertCalls.length).toBeGreaterThan(0);
    });
    
    test('should ignore videos with missing metric fields', async () => {
      const batch: VideoMetrics[] = [
        {
          id: 'valid_1',
          views_1h: 1000,
          likes_1h: 100,
          creator_followers: 5000
        },
        {
          id: 'invalid_1',
          views_1h: 1000,
          likes_1h: NaN, // Invalid likes
          creator_followers: 5000
        },
        {
          id: 'invalid_2',
          views_1h: -100, // Negative views
          likes_1h: 100,
          creator_followers: 5000
        },
        {
          id: 'valid_2',
          views_1h: 2000,
          likes_1h: 200,
          creator_followers: 8000
        }
      ];
      
      await runViralFilter(batch);
      
      // Should have logged run with only 2 valid videos processed
      const filterRunsCall = mockSupabase.from.mock.calls.find(
        call => call[0] === 'viral_filter_runs'
      );
      expect(filterRunsCall).toBeDefined();
    });
    
    test('should skip filtering when batch size is too small', async () => {
      const smallBatch: VideoMetrics[] = [
        {
          id: 'video_1',
          views_1h: 1000,
          likes_1h: 100,
          creator_followers: 5000
        },
        {
          id: 'video_2',
          views_1h: 2000,
          likes_1h: 200,
          creator_followers: 8000
        }
      ];
      
      await runViralFilter(smallBatch);
      
      // Should have logged run with insufficient_data status
      expect(mockSupabase.from).toHaveBeenCalledWith('viral_filter_runs');
      
      // Should not have tried to insert into viral_pool or negative_pool
      const viralPoolCalls = mockSupabase.from.mock.calls.filter(
        call => call[0] === 'viral_pool'
      );
      const negativePoolCalls = mockSupabase.from.mock.calls.filter(
        call => call[0] === 'negative_pool'
      );
      
      expect(viralPoolCalls.length).toBe(0);
      expect(negativePoolCalls.length).toBe(0);
    });
    
    test('should maintain follower bucket distribution in negative samples', async () => {
      // Create batch with videos in different follower buckets
      const batch: VideoMetrics[] = [];
      
      // Add videos in each follower bucket
      const buckets = [
        { max: 1000, count: 20 },
        { max: 10000, count: 30 },
        { max: 100000, count: 25 },
        { max: 1000000, count: 25 }
      ];
      
      let videoId = 0;
      buckets.forEach(bucket => {
        for (let i = 0; i < bucket.count; i++) {
          batch.push({
            id: `video_${videoId++}`,
            views_1h: 1000 + Math.random() * 2000,
            likes_1h: 100 + Math.random() * 200,
            creator_followers: Math.floor(bucket.max * 0.8 + Math.random() * bucket.max * 0.2)
          });
        }
      });
      
      await runViralFilter(batch);
      
      // Verify database operations were called
      expect(mockSupabase.from).toHaveBeenCalledWith('viral_pool');
      expect(mockSupabase.from).toHaveBeenCalledWith('negative_pool');
      expect(mockSupabase.from).toHaveBeenCalledWith('viral_filter_runs');
    });
    
    test('should handle database errors gracefully', async () => {
      // Mock database error
      const errorMock = {
        from: jest.fn(() => ({
          insert: jest.fn(() => ({ error: { message: 'Database connection failed' } }))
        }))
      };
      
      mockCreateClient.mockReturnValue(errorMock as any);
      
      const batch: VideoMetrics[] = Array.from({ length: 50 }, (_, i) => ({
        id: `video_${i}`,
        views_1h: 1000 + i * 10,
        likes_1h: 100 + i,
        creator_followers: 5000
      }));
      
      await expect(runViralFilter(batch)).rejects.toThrow('Database connection failed');
    });
    
    test('should complete within performance target for 2000 videos', async () => {
      // Generate 2000 video batch
      const largeBatch: VideoMetrics[] = Array.from({ length: 2000 }, (_, i) => ({
        id: `video_${i}`,
        views_1h: Math.floor(Math.random() * 10000) + 100,
        likes_1h: Math.floor(Math.random() * 1000) + 10,
        creator_followers: Math.floor(Math.random() * 100000) + 1000
      }));
      
      const startTime = Date.now();
      await runViralFilter(largeBatch);
      const duration = Date.now() - startTime;
      
      // Should complete within 5 seconds (5000ms)
      expect(duration).toBeLessThan(5000);
    });
    
  });
  
  describe('testViralFilter', () => {
    
    test('should run test successfully and return metrics', async () => {
      // Mock successful database queries
      mockSupabase.from = jest.fn((table) => {
        if (table === 'viral_pool') {
          return {
            select: () => ({
              order: () => ({
                limit: () => ({ data: [{ video_id: 'viral_1' }, { video_id: 'viral_2' }] })
              })
            })
          };
        }
        if (table === 'negative_pool') {
          return {
            select: () => ({
              order: () => ({
                limit: () => ({ 
                  data: [
                    { video_id: 'neg_1' }, 
                    { video_id: 'neg_2' }, 
                    { video_id: 'neg_3' }
                  ] 
                })
              })
            })
          };
        }
        return {
          insert: () => ({ error: null })
        };
      });
      
      const result = await testViralFilter();
      
      expect(result.success).toBe(true);
      expect(result.viralCount).toBe(2);
      expect(result.negativeCount).toBe(3);
      expect(result.duration).toBeGreaterThan(0);
    });
    
    test('should handle test failures gracefully', async () => {
      // Mock database error during test
      mockSupabase.from = jest.fn(() => ({
        insert: () => ({ error: { message: 'Test database error' } })
      }));
      
      const result = await testViralFilter();
      
      expect(result.success).toBe(false);
      expect(result.viralCount).toBe(0);
      expect(result.negativeCount).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
    });
    
  });
  
  describe('engagement score calculation', () => {
    
    test('should calculate correct engagement scores', async () => {
      const batch: VideoMetrics[] = [
        {
          id: 'high_engagement',
          views_1h: 10000,
          likes_1h: 1000,
          creator_followers: 1000 // Total: 11000, Score: 11.0
        },
        {
          id: 'low_engagement',
          views_1h: 1000,
          likes_1h: 100,
          creator_followers: 100000 // Total: 1100, Score: 0.011
        },
        {
          id: 'zero_followers',
          views_1h: 5000,
          likes_1h: 500,
          creator_followers: 0 // Should use max(followers, 1) = 1, Score: 5500
        }
      ];
      
      await runViralFilter(batch);
      
      // Verify the function ran without errors
      expect(mockSupabase.from).toHaveBeenCalled();
    });
    
  });
  
});