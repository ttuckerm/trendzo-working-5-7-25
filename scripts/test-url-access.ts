/**
 * Minimal Test: Verify URL accessibility
 * Tests if we can download video data from TikTok CDN URLs
 */

import https from 'https';
import http from 'http';

const TEST_URL = 'https://v16m-webapp.tiktokcdn-us.com/4cb9092de1743d7135d2c91b5ca08381/68ee968b/video/tos/useast5/tos-useast5-v-0068c799-tx/1ff187040327472195014cb6d978cbc5/?a=1988&bti=ODszNWYuMDE6&ch=0&cr=3&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=68418&bt=34209&ft=4KLMeMzm8Zmo0O7SeI4jVzgbQpWrKsd.&mime_type=video_mp4&qs=13&rc=ajY0Nm45cnV0NjMzbzczNUBpajY0Nm45cnV0NjMzbzczNUBnYzVjMmQ0ZGlhLS1kMTFzYSNnYzVjMmQ0ZGlhLS1kMTFzcw%3D%3D&l=202510121829192FC81122817BC1E887BD&btag=e00070000';

async function testUrlAccess(url: string, useHeaders: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = useHeaders ? {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.tiktok.com/',
        'Accept': '*/*'
      }
    } : {};

    https.get(url, options, (response) => {
      console.log(`Status: ${response.statusCode}`);
      console.log(`Headers:`, response.headers);

      if (response.statusCode === 200) {
        console.log('✅ URL is accessible');
        resolve();
      } else {
        console.log('❌ URL returned non-200 status');
        reject(new Error(`HTTP ${response.statusCode}`));
      }

      response.resume(); // Drain response
    }).on('error', reject);
  });
}

async function main() {
  console.log('Test 1: Direct request (no headers)');
  try {
    await testUrlAccess(TEST_URL, false);
  } catch (error: any) {
    console.log('Failed:', error.message);
  }

  console.log('\nTest 2: With browser headers');
  try {
    await testUrlAccess(TEST_URL, true);
  } catch (error: any) {
    console.log('Failed:', error.message);
  }
}

main();
