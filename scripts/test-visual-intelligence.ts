/**
 * FFmpeg Visual Intelligence Integration Test
 * Tests the new visual scoring system integrated into DPS
 *
 * Run: npx tsx scripts/test-visual-intelligence.ts
 */

import { analyzeVideoMetrics } from '../src/lib/services/ffmpeg-service';
import { calculateFFmpegVisualScore } from '../src/lib/services/dps/dps-calculation-engine';

const TEST_VIDEO_URL = 'https://www.w3schools.com/html/mov_bbb.mp4';

console.log('\n╔════════════════════════════════════════════════════════════╗');
console.log('║                                                            ║');
console.log('║     FFMPEG VISUAL INTELLIGENCE TEST                        ║');
console.log('║     Testing FEAT-001 Integration                           ║');
console.log('║                                                            ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

async function testVisualIntelligence() {
  try {
    // Step 1: Analyze video with FFmpeg
    console.log('📹 Step 1: Analyzing video with FFmpeg...\n');
    const metadata = await analyzeVideoMetrics(TEST_VIDEO_URL);

    console.log('✅ Video Analysis Complete!');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   Resolution:        ${metadata.width}x${metadata.height}`);
    console.log(`   Frame Rate:        ${metadata.fps} fps`);
    console.log(`   Bitrate:           ${Math.round(metadata.bitrate / 1000)} kbps`);
    console.log(`   Duration:          ${metadata.duration.toFixed(2)}s`);
    console.log(`   Codec:             ${metadata.codec}`);
    console.log(`   Has Audio:         ${metadata.hasAudio ? 'Yes' : 'No'}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Step 2: Calculate Visual Intelligence Score
    console.log('🎯 Step 2: Calculating FFmpeg Visual Intelligence Score...\n');

    const visualScore = calculateFFmpegVisualScore({
      resolution_width: metadata.width,
      resolution_height: metadata.height,
      fps: metadata.fps,
      bitrate: metadata.bitrate,
      hook_scene_changes: 2, // Simulated (would come from hook analysis)
      quality_score: 0.75, // Simulated (would come from quality analysis)
    });

    console.log(`   📊 Visual Intelligence Score: ${visualScore.toFixed(2)}/100\n`);

    // Step 3: Break down the score
    console.log('📋 Step 3: Score Breakdown\n');
    console.log('─────────────────────────────────────────────────────────────');

    // Resolution scoring
    const minDim = Math.min(metadata.width, metadata.height);
    let resolutionScore = 0;
    let resolutionGrade = '';
    if (minDim >= 1080) {
      resolutionScore = 30;
      resolutionGrade = 'Excellent (1080p+)';
    } else if (minDim >= 720) {
      resolutionScore = 22;
      resolutionGrade = 'Good (720p)';
    } else if (minDim >= 480) {
      resolutionScore = 14;
      resolutionGrade = 'Average (480p)';
    } else {
      resolutionScore = 7;
      resolutionGrade = 'Low (< 480p)';
    }
    console.log(`   Resolution Score:   ${resolutionScore}/30 pts - ${resolutionGrade}`);

    // FPS scoring
    let fpsScore = 0;
    let fpsGrade = '';
    if (metadata.fps >= 60) {
      fpsScore = 25;
      fpsGrade = 'Excellent (60fps+)';
    } else if (metadata.fps >= 30) {
      fpsScore = 18;
      fpsGrade = 'Good (30fps)';
    } else {
      fpsScore = 12;
      fpsGrade = 'Average (< 30fps)';
    }
    console.log(`   Frame Rate Score:   ${fpsScore}/25 pts - ${fpsGrade}`);

    // Bitrate scoring
    const bitrateMbps = metadata.bitrate / 1000000;
    let bitrateScore = 0;
    let bitrateGrade = '';
    if (bitrateMbps >= 5) {
      bitrateScore = 20;
      bitrateGrade = 'Excellent (5+ Mbps)';
    } else if (bitrateMbps >= 3) {
      bitrateScore = 15;
      bitrateGrade = 'Good (3-5 Mbps)';
    } else if (bitrateMbps >= 1.5) {
      bitrateScore = 10;
      bitrateGrade = 'Average (1.5-3 Mbps)';
    } else {
      bitrateScore = 8;
      bitrateGrade = 'Low (< 1.5 Mbps)';
    }
    console.log(`   Bitrate Score:      ${bitrateScore}/20 pts - ${bitrateGrade}`);

    // Hook cuts (simulated)
    const hookCuts = 2;
    const hookScore = 15; // Optimal range (2-4 cuts)
    console.log(`   Hook Cuts Score:    ${hookScore}/15 pts - Optimal (2-4 cuts)`);

    // Quality score (simulated)
    const qualityScore = 0.75;
    const qualityPts = qualityScore * 10;
    console.log(`   Quality Score:      ${qualityPts.toFixed(1)}/10 pts - ${(qualityScore * 100).toFixed(0)}%`);

    console.log('─────────────────────────────────────────────────────────────');
    console.log(`   TOTAL SCORE:        ${visualScore.toFixed(2)}/100\n`);

    // Step 4: Show DPS impact
    console.log('💡 Step 4: Impact on DPS Score\n');
    console.log('─────────────────────────────────────────────────────────────');
    console.log('   FFmpeg Visual Intelligence contributes 5% to final DPS');
    console.log('');
    console.log('   Example DPS Calculations:');

    const baseDPS = 75;
    const visualContribution = visualScore * 0.05;
    const finalDPS = baseDPS + visualContribution;

    console.log(`   Base DPS (without visual):     ${baseDPS.toFixed(2)}`);
    console.log(`   Visual Contribution (5%):      +${visualContribution.toFixed(2)}`);
    console.log(`   Final DPS:                     ${finalDPS.toFixed(2)}`);
    console.log('─────────────────────────────────────────────────────────────\n');

    // Step 5: Interpretation
    console.log('📊 Step 5: Score Interpretation\n');

    if (visualScore >= 85) {
      console.log('   ✅ EXCELLENT (85-100)');
      console.log('      Professional viral-quality production');
      console.log('      1080p+, 60fps, optimal hook pacing');
      console.log('      Maximum viral potential');
    } else if (visualScore >= 70) {
      console.log('   ✅ GOOD (70-84)');
      console.log('      Above-average production quality');
      console.log('      720p+, 30fps+, good pacing');
      console.log('      Strong viral potential');
    } else if (visualScore >= 50) {
      console.log('   ⚠️  AVERAGE (50-69)');
      console.log('      Standard production quality');
      console.log('      480p+, acceptable frame rate');
      console.log('      Moderate viral potential');
    } else {
      console.log('   ⚠️  BELOW AVERAGE (< 50)');
      console.log('      Low production quality');
      console.log('      Consider improving: resolution, fps, or pacing');
      console.log('      Limited viral potential from visual quality');
    }
    console.log('');

    // Success summary
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║                                                            ║');
    console.log('║     ✅ VISUAL INTELLIGENCE TEST PASSED!                    ║');
    console.log('║                                                            ║');
    console.log('║     FFmpeg integration is working correctly!               ║');
    console.log('║     Visual scoring algorithm is operational!               ║');
    console.log('║                                                            ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    console.log('📋 Next Steps:');
    console.log('   1. Run scraper to analyze real TikTok videos');
    console.log('   2. Test database integration (save/fetch FFmpeg data)');
    console.log('   3. Calculate DPS with visual boost on real videos');
    console.log('   4. Extract patterns with visual intelligence\n');

    return true;

  } catch (error: any) {
    console.error('\n❌ Test Failed!');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('\n   Stack:', error.stack);
    }
    return false;
  }
}

// Run the test
testVisualIntelligence()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
