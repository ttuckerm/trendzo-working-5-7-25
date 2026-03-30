/**
 * Analyze One Video with FFmpeg
 * Quick test to analyze any video file and see visual intelligence
 *
 * Usage:
 * npx tsx scripts/analyze-one-video.ts <video-url-or-path>
 *
 * Example:
 * npx tsx scripts/analyze-one-video.ts https://www.w3schools.com/html/mov_bbb.mp4
 * npx tsx scripts/analyze-one-video.ts C:/path/to/video.mp4
 */

import { analyzeVideoMetrics } from '../src/lib/services/ffmpeg-service';
import { calculateFFmpegVisualScore } from '../src/lib/services/dps/dps-calculation-engine';

const videoPath = process.argv[2];

if (!videoPath) {
  console.error('\n❌ Error: Please provide a video URL or path\n');
  console.log('Usage:');
  console.log('  npx tsx scripts/analyze-one-video.ts <video-url-or-path>\n');
  console.log('Examples:');
  console.log('  npx tsx scripts/analyze-one-video.ts https://example.com/video.mp4');
  console.log('  npx tsx scripts/analyze-one-video.ts C:/videos/tiktok.mp4\n');
  process.exit(1);
}

async function analyzeVideo() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║     FFMPEG VIDEO ANALYZER                                  ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`📹 Analyzing video: ${videoPath}\n`);
  console.log('⏳ This may take a few seconds...\n');

  try {
    const startTime = Date.now();
    const metadata = await analyzeVideoMetrics(videoPath);
    const analysisTime = Date.now() - startTime;

    console.log('✅ Analysis Complete!\n');
    console.log('═══════════════════════════════════════════════════════════════════════════════════════\n');
    console.log('📊 VIDEO METADATA:\n');
    console.log(`   Resolution:        ${metadata.width}x${metadata.height} (${metadata.aspectRatio})`);
    console.log(`   Frame Rate:        ${metadata.fps} fps`);
    console.log(`   Duration:          ${metadata.duration.toFixed(2)}s`);
    console.log(`   Total Frames:      ${metadata.totalFrames || 'N/A'}`);
    console.log(`   Codec:             ${metadata.codec}`);
    console.log(`   Format:            ${metadata.format}`);
    console.log(`   Bitrate:           ${Math.round(metadata.bitrate / 1000)} kbps (${(metadata.bitrate / 1000000).toFixed(2)} Mbps)`);
    console.log(`   Has Audio:         ${metadata.hasAudio ? 'Yes' : 'No'}`);
    if (metadata.audioCodec) {
      console.log(`   Audio Codec:       ${metadata.audioCodec}`);
    }
    if (metadata.fileSize) {
      console.log(`   File Size:         ${(metadata.fileSize / 1024 / 1024).toFixed(2)} MB`);
    }
    console.log(`\n   Analysis Time:     ${analysisTime}ms\n`);

    console.log('───────────────────────────────────────────────────────────────────────────────────────\n');
    console.log('🎯 VISUAL INTELLIGENCE SCORE:\n');

    // Calculate visual score (simulating hook cuts and quality)
    const hookCuts = 3; // Simulated optimal value
    const qualityScore = 0.85; // Simulated high quality

    const visualScore = calculateFFmpegVisualScore({
      resolution_width: metadata.width,
      resolution_height: metadata.height,
      fps: metadata.fps,
      bitrate: metadata.bitrate,
      hook_scene_changes: hookCuts,
      quality_score: qualityScore,
    });

    console.log(`   📊 Overall Score:  ${visualScore.toFixed(2)}/100\n`);

    // Score breakdown
    const minDim = Math.min(metadata.width, metadata.height);
    let resScore = 0, fpsScore = 0, bitrateScore = 0;

    if (minDim >= 1080) resScore = 30;
    else if (minDim >= 720) resScore = 22;
    else if (minDim >= 480) resScore = 14;
    else resScore = 7;

    if (metadata.fps >= 60) fpsScore = 25;
    else if (metadata.fps >= 30) fpsScore = 18;
    else fpsScore = 12;

    const bitrateMbps = metadata.bitrate / 1000000;
    if (bitrateMbps >= 5) bitrateScore = 20;
    else if (bitrateMbps >= 3) bitrateScore = 15;
    else if (bitrateMbps >= 1.5) bitrateScore = 10;
    else bitrateScore = 8;

    console.log('   Score Breakdown:');
    console.log(`   ├─ Resolution:     ${resScore}/30 pts ${getGrade(resScore, 30)}`);
    console.log(`   ├─ Frame Rate:     ${fpsScore}/25 pts ${getGrade(fpsScore, 25)}`);
    console.log(`   ├─ Bitrate:        ${bitrateScore}/20 pts ${getGrade(bitrateScore, 20)}`);
    console.log(`   ├─ Hook Cuts:      15/15 pts ✅ (simulated)`);
    console.log(`   └─ Quality:        ${(qualityScore * 10).toFixed(1)}/10 pts ✅ (simulated)\n`);

    console.log('───────────────────────────────────────────────────────────────────────────────────────\n');
    console.log('💡 DPS IMPACT:\n');

    const exampleBaseDPS = 75;
    const visualContribution = visualScore * 0.05;
    const finalDPS = exampleBaseDPS + visualContribution;

    console.log(`   Visual Score:      ${visualScore.toFixed(2)}/100`);
    console.log(`   Contribution:      ${visualContribution.toFixed(2)} points (5% weight)`);
    console.log(`   Example DPS:       ${exampleBaseDPS} → ${finalDPS.toFixed(2)}\n`);

    console.log('───────────────────────────────────────────────────────────────────────────────────────\n');
    console.log('📋 VIRAL QUALITY ASSESSMENT:\n');

    if (visualScore >= 85) {
      console.log('   ✅ EXCELLENT - Professional viral-quality production');
      console.log('      This video has the visual quality of top-performing content.');
      console.log('      High resolution, smooth frame rate, and excellent bitrate.');
    } else if (visualScore >= 70) {
      console.log('   ✅ GOOD - Above-average production quality');
      console.log('      This video meets high quality standards for viral content.');
      console.log('      Good resolution and frame rate with solid encoding.');
    } else if (visualScore >= 50) {
      console.log('   ⚠️  AVERAGE - Standard production quality');
      console.log('      This video has acceptable quality but could be improved.');
      console.log('      Consider increasing resolution or frame rate for better performance.');
    } else {
      console.log('   ⚠️  BELOW AVERAGE - Low production quality');
      console.log('      This video may struggle to go viral due to quality issues.');
      console.log('      Recommendations:');
      if (minDim < 720) console.log('      • Increase resolution to 720p or 1080p');
      if (metadata.fps < 30) console.log('      • Increase frame rate to 30fps or 60fps');
      if (bitrateMbps < 3) console.log('      • Increase bitrate for better video quality');
    }

    console.log('\n═══════════════════════════════════════════════════════════════════════════════════════\n');

  } catch (error: any) {
    console.error('\n❌ Analysis Failed!');
    console.error(`   Error: ${error.message}\n`);
    if (error.stack) {
      console.error('   Stack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

function getGrade(score: number, max: number): string {
  const percentage = (score / max) * 100;
  if (percentage >= 90) return '✅';
  if (percentage >= 70) return '👍';
  if (percentage >= 50) return '⚠️';
  return '❌';
}

analyzeVideo();
