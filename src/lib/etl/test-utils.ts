import { TikTokVideo } from '../types/trendingTemplate';

/**
 * Test utilities for ETL processes
 */

/**
 * Creates a mock TikTok video for testing
 */
export function createMockTikTokVideo(testId: string): any {
  return {
    id: `mock-video-${testId}`,
    text: `This is a test video for ETL testing - ${testId}`,
    createTime: Date.now(),
    authorMeta: {
      id: 'test-author',
      name: 'Test User',
      nickname: 'testuser',
      verified: false
    },
    videoMeta: {
      height: 1080,
      width: 1920,
      duration: 30
    },
    hashtags: ['test', 'etl', 'tiktok'],
    stats: {
      diggCount: 100,
      shareCount: 50,
      commentCount: 25,
      playCount: 1000
    },
    videoUrl: 'https://example.com/test-video.mp4',
    webVideoUrl: 'https://example.com/test-video'
  };
}

/**
 * Utility for logging test results in a structured way
 */
export function logTestResult(testName: string, success: boolean, details?: any) {
  if (success) {
    console.log(`✅ ${testName}: PASSED`);
    if (details) {
      console.log('  Details:', details);
    }
  } else {
    console.error(`❌ ${testName}: FAILED`);
    if (details) {
      console.error('  Error:', details);
    }
  }
}

/**
 * Utility to measure execution time of a function
 */
export async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T, executionTime: number }> {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  return { result, executionTime };
} 