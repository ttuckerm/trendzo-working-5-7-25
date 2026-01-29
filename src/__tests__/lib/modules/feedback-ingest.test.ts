/**
 * FeedbackIngest Test Suite
 * Tests for real-world metrics collection with external API mocking
 */

// import nock from 'nock'; // Commented out - using mock fetch instead
import { ingestMetrics, getFeedbackIngestStatus } from '../../../lib/modules/feedback-ingest';

// Mock Supabase
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      gte: jest.fn(() => ({
        neq: jest.fn(() => ({
          or: jest.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      order: jest.fn(() => ({
        limit: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    })),
    upsert: jest.fn(() => Promise.resolve({ error: null })),
    update: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ error: null }))
    }))
  })),
  functions: {
    invoke: jest.fn(() => Promise.resolve({ data: {}, error: null }))
  }
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock global fetch
global.fetch = jest.fn();

// Mock dayjs
const mockDayjs = {
  subtract: jest.fn(() => ({
    toISOString: jest.fn(() => '2024-01-19T10:00:00Z')
  })),
  add: jest.fn(() => ({
    toISOString: jest.fn(() => '2024-01-20T10:15:00Z')
  }))
};

jest.mock('dayjs', () => jest.fn(() => mockDayjs));

describe('FeedbackIngest', () => {
  const metricsApiBase = 'https://metrics.myproxy.com';
  
  const mockVideoPredictions = [
    {
      video_id: 'video-123',
      created_at: '2024-01-20T09:00:00Z',
      last_metrics_pull_at: null,
      status: 'active'
    },
    {
      video_id: 'video-456',
      created_at: '2024-01-20T08:00:00Z', 
      last_metrics_pull_at: '2024-01-20T07:00:00Z',
      status: 'active'
    }
  ];

  const mockMetricsResponse = {
    views_1h: 1500,
    likes_1h: 75,
    shares_1h: 12,
    views_24h: 8500,
    likes_24h: 425,
    shares_24h: 68,
    views_72h: 15000,
    likes_72h: 750,
    shares_72h: 120
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variable
    process.env.METRICS_API_BASE = metricsApiBase;
    
    // Default successful database responses
    mockSupabase.from().select().gte().neq().or.mockResolvedValue({
      data: mockVideoPredictions,
      error: null
    });

    // Mock successful fetch responses by default
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockMetricsResponse)
    });
  });

  describe('Test Case 1: Successful Fetch Updates Database', () => {
    it('should fetch metrics and update video_metrics and last_metrics_pull_at', async () => {
      // Fetch responses are already mocked in beforeEach

      await ingestMetrics();

      // Verify video_metrics upsert was called
      expect(mockSupabase.from).toHaveBeenCalledWith('video_metrics');
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'video-123',
          ...mockMetricsResponse,
          pulled_at: expect.any(String)
        }),
        { onConflict: 'video_id' }
      );

      // Verify last_metrics_pull_at update
      expect(mockSupabase.from).toHaveBeenCalledWith('video_predictions');
      expect(mockSupabase.from().update).toHaveBeenCalledWith({
        last_metrics_pull_at: expect.any(String)
      });

      // Verify event emission
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('metrics_ingested', {
        body: {
          videos_processed: 2,
          timestamp: expect.any(String)
        }
      });
    });
  });

  describe('Test Case 2: API 404 Sets Status Deleted', () => {
    it('should mark video as deleted when API returns 404', async () => {
      // Mock 404 response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await ingestMetrics();

      // Verify video marked as deleted
      expect(mockSupabase.from().update).toHaveBeenCalledWith({ status: 'deleted' });
      
      // Should not upsert metrics for deleted video
      expect(mockSupabase.from().upsert).not.toHaveBeenCalledWith(
        expect.objectContaining({ video_id: 'video-123' })
      );
    });
  });

  describe('Test Case 3: Network Failure After Retries', () => {
    it('should retry and eventually skip video on persistent network failure', async () => {
      // Mock network failures for all retry attempts
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await ingestMetrics();

      // Verify error was logged
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch metrics for video video-123 after 3 attempts'),
        expect.any(String)
      );

      // Should not update database for failed video
      expect(mockSupabase.from().upsert).not.toHaveBeenCalledWith(
        expect.objectContaining({ video_id: 'video-123' })
      );

      consoleSpy.mockRestore();
    }, 15000); // Increase timeout for retry logic
  });

  describe('Retry Logic', () => {
    it('should succeed on second attempt after initial failure', async () => {
      // First attempt fails, second succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Server error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockMetricsResponse)
        });

      await ingestMetrics();

      // Should successfully update metrics despite initial failure
      expect(mockSupabase.from().upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          video_id: 'video-123',
          ...mockMetricsResponse
        }),
        { onConflict: 'video_id' }
      );
    }, 10000);
  });

  describe('Performance Requirements', () => {
    it('should process videos efficiently with concurrency', async () => {
      // Mock many videos
      const manyVideos = Array.from({ length: 50 }, (_, i) => ({
        video_id: `video-${i}`,
        created_at: '2024-01-20T09:00:00Z',
        last_metrics_pull_at: null,
        status: 'active'
      }));

      mockSupabase.from().select().gte().neq().or.mockResolvedValue({
        data: manyVideos,
        error: null
      });

      // Mock API responses for all videos - fetch will return success for all calls
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMetricsResponse)
      });

      const startTime = Date.now();
      await ingestMetrics();
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (allowing for test overhead)
      expect(duration).toBeLessThan(10000); // 10 seconds for 50 videos in test environment
    }, 15000);
  });

  describe('Input Validation', () => {
    it('should handle invalid API response format', async () => {
      // Mock invalid response
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ invalid: 'response' }) // Missing required fields
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await ingestMetrics();

      // Should log error for invalid response
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to fetch metrics for video video-123'),
        expect.any(String)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Database Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      mockSupabase.from().select().gte().neq().or.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      });

      await expect(ingestMetrics()).rejects.toThrow('Failed to fetch video predictions');
    });

    it('should continue processing other videos if one fails to update', async () => {
      // Mock successful fetch responses
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockMetricsResponse)
      });

      // Mock database error for first video only
      mockSupabase.from().upsert
        .mockResolvedValueOnce({ error: { message: 'Database error' } })
        .mockResolvedValueOnce({ error: null });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await ingestMetrics();

      // Should log error for failed video but continue processing
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to upsert metrics for video video-123'),
        expect.any(Object)
      );

      // Should still process second video
      expect(mockSupabase.from().upsert).toHaveBeenCalledTimes(2);

      consoleSpy.mockRestore();
    });
  });

  describe('Status Function', () => {
    it('should return operational status with recent activity', async () => {
      const mockRecentMetrics = [
        { pulled_at: '2024-01-20T10:00:00Z', video_id: 'video-123' },
        { pulled_at: '2024-01-20T09:45:00Z', video_id: 'video-456' }
      ];

      mockSupabase.from().select().order().limit.mockResolvedValue({
        data: mockRecentMetrics,
        error: null
      });

      const status = await getFeedbackIngestStatus();

      expect(status).toEqual({
        status: 'operational',
        last_run: '2024-01-20T10:00:00Z',
        videos_processed: 2,
        next_run: expect.any(String)
      });
    });

    it('should handle status check errors gracefully', async () => {
      mockSupabase.from().select().order().limit.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const status = await getFeedbackIngestStatus();

      expect(status).toEqual({ status: 'error' });
    });
  });
});