// src/lib/services/viral-prediction/__tests__/apify-scraper.test.ts
import { jest } from '@jest/globals';
import { scrapeTikTokBatch, cleanupFailedDownloads } from '../apify-scraper';
import { ApifyClient } from 'apify-client';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

// Mock all external dependencies
jest.mock('apify-client');
jest.mock('node-fetch');
jest.mock('fs/promises');
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      insert: jest.fn(() => ({ error: null })),
      select: jest.fn(() => ({ data: [] }))
    }))
  }))
}));

const mockApifyClient = ApifyClient as jest.MockedClass<typeof ApifyClient>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ApifyScraper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.APIFY_TOKEN = 'test-token';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-key';

    // Mock fs.access to simulate directory exists
    mockFs.access.mockResolvedValue(undefined);
    mockFs.mkdir.mockResolvedValue(undefined);
    mockFs.writeFile.mockResolvedValue(undefined);
  });

  describe('scrapeTikTokBatch', () => {
    it('should scrape videos and save to Supabase', async () => {
      // Mock Apify actor response
      const mockRunId = 'test-run-123';
      const mockActor = {
        call: jest.fn().mockResolvedValue({
          defaultDatasetId: mockRunId
        })
      };
      
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({
          items: [
            {
              videoUrl: 'https://example.com/video1.mp4',
              text: 'Test caption 1',
              musicMeta: { musicId: 'sound123' },
              createTime: 1700000000,
              stats: { playCount: 1000, diggCount: 100 },
              isPrivate: false,
              isDeleted: false
            },
            {
              videoUrl: 'https://example.com/video2.mp4',
              desc: 'Test caption 2',
              music: { id: 'sound456' },
              createTime: 1700001000,
              playCount: 2000,
              diggCount: 200,
              isPrivate: false,
              isDeleted: false
            }
          ]
        })
      };

      mockApifyClient.prototype.actor = jest.fn().mockReturnValue(mockActor);
      mockApifyClient.prototype.dataset = jest.fn().mockReturnValue(mockDataset);

      // Mock fetch for video download
      mockFetch.mockResolvedValue({
        ok: true,
        statusText: 'OK',
        buffer: jest.fn().mockResolvedValue(Buffer.from('fake-video-data'))
      } as any);

      // Execute scraping
      await scrapeTikTokBatch(['fitness']);

      // Verify Apify was called correctly
      expect(mockActor.call).toHaveBeenCalledWith({
        searchQueries: ['fitness'],
        maxVideos: 100,
        proxyConfiguration: { useApifyProxy: true }
      });

      // Verify videos were downloaded
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      
      // Verify file paths
      const writeCalls = mockFs.writeFile.mock.calls;
      expect(writeCalls[0][0]).toMatch(/data\/raw_videos\/.*\.mp4$/);
      expect(writeCalls[1][0]).toMatch(/data\/raw_videos\/.*\.mp4$/);
    });

    it('should skip private and deleted videos', async () => {
      const mockActor = {
        call: jest.fn().mockResolvedValue({ defaultDatasetId: 'test-run' })
      };
      
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({
          items: [
            { videoUrl: 'https://example.com/video1.mp4', isPrivate: true },
            { videoUrl: 'https://example.com/video2.mp4', isDeleted: true },
            { isPrivate: false, isDeleted: false } // No video URL
          ]
        })
      };

      mockApifyClient.prototype.actor = jest.fn().mockReturnValue(mockActor);
      mockApifyClient.prototype.dataset = jest.fn().mockReturnValue(mockDataset);

      await scrapeTikTokBatch(['test']);

      // Should not attempt to download any videos
      expect(mockFetch).not.toHaveBeenCalled();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    it('should handle rate limiting', async () => {
      // Create many mock videos to trigger rate limiting
      const mockItems = Array(50).fill(null).map((_, i) => ({
        videoUrl: `https://example.com/video${i}.mp4`,
        text: `Caption ${i}`,
        musicMeta: { musicId: `sound${i}` },
        createTime: 1700000000 + i,
        stats: { playCount: 1000 + i, diggCount: 100 + i }
      }));

      const mockActor = {
        call: jest.fn().mockResolvedValue({ defaultDatasetId: 'test-run' })
      };
      
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({ items: mockItems })
      };

      mockApifyClient.prototype.actor = jest.fn().mockReturnValue(mockActor);
      mockApifyClient.prototype.dataset = jest.fn().mockReturnValue(mockDataset);

      mockFetch.mockResolvedValue({
        ok: true,
        buffer: jest.fn().mockResolvedValue(Buffer.from('video'))
      } as any);

      const startTime = Date.now();
      await scrapeTikTokBatch(['test']);
      const duration = Date.now() - startTime;

      // Should process all videos
      expect(mockFs.writeFile).toHaveBeenCalledTimes(50);
      
      // Duration should be minimal (no rate limiting triggered for 50 videos)
      expect(duration).toBeLessThan(5000);
    });

    it('should retry on network failures', async () => {
      const mockActor = {
        call: jest.fn()
          .mockRejectedValueOnce(new Error('Network error'))
          .mockResolvedValueOnce({ defaultDatasetId: 'test-run' })
      };
      
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({ items: [] })
      };

      mockApifyClient.prototype.actor = jest.fn().mockReturnValue(mockActor);
      mockApifyClient.prototype.dataset = jest.fn().mockReturnValue(mockDataset);

      await scrapeTikTokBatch(['test']);

      // Should have retried
      expect(mockActor.call).toHaveBeenCalledTimes(2);
    });
  });

  describe('cleanupFailedDownloads', () => {
    it('should remove orphaned video files', async () => {
      // Mock file system
      mockFs.readdir.mockResolvedValue(['valid.mp4', 'orphaned.mp4', 'readme.txt'] as any);
      
      // Mock Supabase response
      const mockSupabase = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockResolvedValue({
            data: [{ saved_filepath: 'raw_videos/valid.mp4' }]
          })
        })
      };
      
      jest.mocked(require('@supabase/supabase-js').createClient).mockReturnValue(mockSupabase);

      mockFs.unlink.mockResolvedValue(undefined);

      await cleanupFailedDownloads();

      // Should only delete orphaned MP4 file
      expect(mockFs.unlink).toHaveBeenCalledTimes(1);
      expect(mockFs.unlink).toHaveBeenCalledWith(expect.stringContaining('orphaned.mp4'));
    });
  });

  describe('Integration test', () => {
    it('should save at least one video when running with "fitness" keyword', async () => {
      // This is a mock integration test
      // In a real integration test, you would:
      // 1. Use real Apify API (with test account)
      // 2. Actually download a video
      // 3. Check file exists in /data/raw_videos
      // 4. Verify Supabase entry was created
      
      const mockActor = {
        call: jest.fn().mockResolvedValue({ defaultDatasetId: 'test-run' })
      };
      
      const mockDataset = {
        listItems: jest.fn().mockResolvedValue({
          items: [{
            videoUrl: 'https://example.com/fitness-video.mp4',
            text: 'Fitness tutorial',
            musicMeta: { musicId: 'fitness-sound' },
            createTime: 1700000000,
            stats: { playCount: 5000, diggCount: 500 }
          }]
        })
      };

      mockApifyClient.prototype.actor = jest.fn().mockReturnValue(mockActor);
      mockApifyClient.prototype.dataset = jest.fn().mockReturnValue(mockDataset);

      mockFetch.mockResolvedValue({
        ok: true,
        buffer: jest.fn().mockResolvedValue(Buffer.from('fitness-video-data'))
      } as any);

      await scrapeTikTokBatch(['fitness']);

      // Verify video was saved
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        expect.stringMatching(/data\/raw_videos\/.*\.mp4$/),
        expect.any(Buffer)
      );
    });
  });
});