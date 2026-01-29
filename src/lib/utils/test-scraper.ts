#!/usr/bin/env ts-node

import { VideoScraperService } from '../services/videoScraperService';

/**
 * Standalone test script for the VideoScraperService
 * Usage: npx ts-node src/lib/utils/test-scraper.ts
 */

async function testScraper() {
  // Hardcoded TikTok URL for testing
  const testUrl = 'https://www.tiktok.com/@username/video/1234567890123456789';
  
  console.log('=== SCRAPER ISOLATION TEST ===');
  console.log('[TEST START] Testing URL:', testUrl);
  console.log('[TEST START] Timestamp:', new Date().toISOString());
  console.log('');

  try {
    console.log('[SCRAPER CALL] Invoking VideoScraperService.scrapeVideo()...');
    
    const scrapedData = await VideoScraperService.scrapeVideo(testUrl);
    
    console.log('[SCRAPER SUCCESS] Scraper completed successfully');
    console.log('[SCRAPER SUCCESS] Full data object returned:');
    console.log(JSON.stringify({
      platform: scrapedData.platform,
      author: scrapedData.author,
      description: scrapedData.description,
      thumbnail_url: scrapedData.thumbnail_url,
      likes: scrapedData.like_count,
      comments: scrapedData.comment_count,
      shares: scrapedData.share_count,
      views: scrapedData.view_count,
      engagement_score: scrapedData.engagement_score,
      hashtags: scrapedData.hashtags,
      hasRawData: !!scrapedData.raw_data
    }, null, 2));
    
    console.log('');
    console.log('[TEST RESULT] ✅ Scraper is working correctly');
    console.log('[TEST RESULT] Data quality check:');
    console.log(`  - Author: ${scrapedData.author || 'MISSING'}`);
    console.log(`  - Thumbnail: ${scrapedData.thumbnail_url ? 'FOUND' : 'MISSING'}`);
    console.log(`  - Likes: ${scrapedData.like_count || 0}`);
    console.log(`  - Comments: ${scrapedData.comment_count || 0}`);
    console.log(`  - Shares: ${scrapedData.share_count || 0}`);
    console.log(`  - Engagement Score: ${scrapedData.engagement_score || 0}`);
    
  } catch (error) {
    console.error('[SCRAPER ERROR] ❌ Scraper failed with error:');
    console.error('[SCRAPER ERROR] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[SCRAPER ERROR] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[SCRAPER ERROR] Full error object:', error);
    
    if (error instanceof Error && error.stack) {
      console.error('[SCRAPER ERROR] Stack trace:');
      console.error(error.stack);
    }
    
    console.log('');
    console.log('[TEST RESULT] ❌ Scraper failed - check errors above');
    process.exit(1);
  }
}

// Alternative function to test with a different URL
async function testWithCustomUrl(url: string) {
  console.log('=== CUSTOM URL TEST ===');
  console.log('[CUSTOM TEST] Testing URL:', url);
  
  try {
    const result = await VideoScraperService.scrapeVideo(url);
    console.log('[CUSTOM TEST] Success:', {
      platform: result.platform,
      author: result.author,
      hasData: !!(result.like_count || result.comment_count || result.share_count)
    });
  } catch (error) {
    console.error('[CUSTOM TEST] Error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the test
if (require.main === module) {
  console.log('VideoScraperService Test Runner');
  console.log('==============================');
  
  // Check if custom URL provided as argument
  const customUrl = process.argv[2];
  
  if (customUrl) {
    console.log('Using custom URL from command line argument');
    testWithCustomUrl(customUrl).catch(console.error);
  } else {
    console.log('Using default test URL');
    testScraper().catch(console.error);
  }
}

// Export for programmatic use
export { testScraper, testWithCustomUrl };