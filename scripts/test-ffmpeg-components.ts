/**
 * Test FFmpeg-Based Components
 *
 * Tests Components 15 (Audio Analysis) and 16 (Visual Scene Detection)
 * with real video files using existing FFmpeg infrastructure.
 */

import { AudioAnalyzer } from '@/lib/components/audio-analyzer';
import { VisualSceneDetector } from '@/lib/components/visual-scene-detector';
import path from 'path';

async function main() {
  console.log('=== TESTING FFMPEG-BASED COMPONENTS ===\n');

  // Use a real video file from data/raw_videos (newest kai video)
  const videoPath = path.join(process.cwd(), 'data', 'raw_videos', 'kai_1763584272153.mp4');
  console.log(`Testing with video: ${videoPath}\n`);

  // Test Component 15: Audio Analysis
  console.log('=== Component 15: Audio Analysis ===\n');
  const audioStartTime = Date.now();

  try {
    const audioResult = await AudioAnalyzer.analyze(videoPath);
    const audioLatency = Date.now() - audioStartTime;

    console.log(`Status: ${audioResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Latency: ${audioLatency}ms`);

    if (audioResult.success) {
      console.log(`\nAudio Score: ${audioResult.audioScore}/10`);
      console.log(`Speaking Pace: ${audioResult.speakingPace}`);
      console.log(`Energy Level: ${audioResult.energyLevel}`);
      console.log(`Silence Ratio: ${(audioResult.silenceRatio * 100).toFixed(1)}%`);
      console.log(`Volume Variance: ${(audioResult.volumeVariance * 100).toFixed(1)}%`);

      if (audioResult.rawMetrics) {
        console.log(`\nRaw Metrics:`);
        console.log(`  Mean Volume: ${audioResult.rawMetrics.meanVolume.toFixed(1)} dB`);
        console.log(`  Max Volume: ${audioResult.rawMetrics.maxVolume.toFixed(1)} dB`);
        console.log(`  Silence Duration: ${audioResult.rawMetrics.silenceDuration.toFixed(1)}s / ${audioResult.rawMetrics.totalDuration.toFixed(1)}s`);
      }

      const audioDPS = AudioAnalyzer.toDPS(audioResult);
      console.log(`\nDPS Prediction: ${audioDPS}`);

      console.log(`\nInsights:`);
      for (const insight of audioResult.insights) {
        console.log(`  • ${insight}`);
      }
    } else {
      console.log(`Error: ${audioResult.error}`);
    }
  } catch (error: any) {
    console.log(`❌ EXCEPTION: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');

  // Test Component 16: Visual Scene Detection
  console.log('=== Component 16: Visual Scene Detection ===\n');
  const visualStartTime = Date.now();

  try {
    const visualResult = await VisualSceneDetector.analyze(videoPath);
    const visualLatency = Date.now() - visualStartTime;

    console.log(`Status: ${visualResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`Latency: ${visualLatency}ms`);

    if (visualResult.success) {
      console.log(`\nVisual Score: ${visualResult.visualScore}/10`);
      console.log(`Editing Pace: ${visualResult.editingPace}`);
      console.log(`Cuts Per Second: ${visualResult.cutsPerSecond}`);
      console.log(`Total Scene Changes: ${visualResult.sceneChanges}`);
      console.log(`Has Text Overlay: ${visualResult.hasTextOverlay ? 'Yes' : 'No'}`);

      if (visualResult.rawMetrics) {
        console.log(`\nRaw Metrics:`);
        console.log(`  Frames Analyzed: ${visualResult.rawMetrics.totalFramesAnalyzed}`);
        console.log(`  Hook Period Cuts: ${visualResult.rawMetrics.hookPeriodCuts} (first 3 seconds)`);
        console.log(`  Average Brightness: ${(visualResult.rawMetrics.averageBrightness * 100).toFixed(1)}%`);
        console.log(`  Duration: ${visualResult.rawMetrics.duration.toFixed(1)}s`);
      }

      const visualDPS = VisualSceneDetector.toDPS(visualResult);
      console.log(`\nDPS Prediction: ${visualDPS}`);

      console.log(`\nInsights:`);
      for (const insight of visualResult.insights) {
        console.log(`  • ${insight}`);
      }
    } else {
      console.log(`Error: ${visualResult.error}`);
    }
  } catch (error: any) {
    console.log(`❌ EXCEPTION: ${error.message}`);
  }

  console.log('\n' + '='.repeat(80) + '\n');
  console.log('=== TEST COMPLETE ===');
}

main().catch(console.error);
