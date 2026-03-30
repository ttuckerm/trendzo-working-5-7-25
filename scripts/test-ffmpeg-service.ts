/**
 * Test FFmpeg Service
 *
 * Validates FFmpeg integration with a sample TikTok video
 *
 * Usage:
 * tsx scripts/test-ffmpeg-service.ts
 */

import ffmpegService from '../src/lib/services/ffmpeg-service';

const TEST_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4'; // Public test video

async function testFFmpegService() {
  console.log('🎬 FFmpeg Service Test Started\n');

  try {
    // Test 1: Analyze Video Metrics
    console.log('📊 Test 1: Analyzing video metadata...');
    const startMetadata = Date.now();
    const metadata = await ffmpegService.analyzeVideoMetrics(TEST_VIDEO_URL);
    const metadataTime = Date.now() - startMetadata;

    console.log('✅ Metadata extracted in', metadataTime, 'ms');
    console.log('   Duration:', metadata.duration, 'seconds');
    console.log('   Resolution:', `${metadata.width}x${metadata.height}`);
    console.log('   FPS:', metadata.fps);
    console.log('   Codec:', metadata.codec);
    console.log('   Bitrate:', Math.round(metadata.bitrate / 1000), 'kbps');
    console.log('   Has Audio:', metadata.hasAudio);
    console.log('   Total Frames:', metadata.totalFrames);
    console.log('');

    // Test 2: Extract Thumbnails
    console.log('🖼️  Test 2: Extracting thumbnails...');
    const startThumbs = Date.now();

    const hookTime = 1.5;
    const midTime = metadata.duration / 2;
    const endTime = Math.max(0, metadata.duration - 1);

    const thumbnails = await ffmpegService.extractThumbnails(TEST_VIDEO_URL, {
      timestamps: [hookTime, midTime, endTime],
      width: 640,
      format: 'jpg',
    });

    const thumbsTime = Date.now() - startThumbs;

    console.log('✅ Thumbnails extracted in', thumbsTime, 'ms');
    thumbnails.forEach(thumb => {
      console.log(`   ${thumb.timestamp}s → ${thumb.path}`);
    });
    console.log('');

    // Test 3: Extract Frames (first 3 seconds)
    console.log('🎞️  Test 3: Extracting frames from hook (0-3s)...');
    const startFrames = Date.now();

    const frames = await ffmpegService.extractFrames(TEST_VIDEO_URL, {
      fps: 2, // 2 frames per second
      startTime: 0,
      endTime: 3,
      width: 320,
      format: 'jpg',
    });

    const framesTime = Date.now() - startFrames;

    console.log('✅ Frames extracted in', framesTime, 'ms');
    console.log(`   Extracted ${frames.length} frames`);
    frames.slice(0, 3).forEach(frame => {
      console.log(`   Frame #${frame.frameNumber} @ ${frame.timestamp.toFixed(2)}s → ${frame.path}`);
    });
    if (frames.length > 3) {
      console.log(`   ... and ${frames.length - 3} more`);
    }
    console.log('');

    // Test 4: Hook Pattern Analysis
    console.log('🔍 Test 4: Analyzing hook pattern...');
    const startHook = Date.now();

    const hookAnalysis = await ffmpegService.analyzeHookPattern(TEST_VIDEO_URL);
    const hookTime2 = Date.now() - startHook;

    console.log('✅ Hook analysis completed in', hookTime2, 'ms');
    console.log(`   Extracted ${hookAnalysis.frames.length} frames from hook`);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════');
    console.log('✅ All FFmpeg Service Tests Passed!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Total Time:', Date.now() - startMetadata, 'ms');
    console.log('');
    console.log('📋 Performance Summary:');
    console.log('   Metadata extraction:', metadataTime, 'ms');
    console.log('   Thumbnail extraction:', thumbsTime, 'ms');
    console.log('   Frame extraction:', framesTime, 'ms');
    console.log('   Hook analysis:', hookTime2, 'ms');
    console.log('');

    // Cleanup
    console.log('🧹 Cleaning up temp files...');
    const allFiles = [
      ...thumbnails.map(t => t.path),
      ...frames.map(f => f.path),
      ...hookAnalysis.frames.map(f => f.path),
    ];
    await ffmpegService.cleanupVideoAssets(allFiles);
    console.log('✅ Cleanup complete');

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run tests
testFFmpegService();
