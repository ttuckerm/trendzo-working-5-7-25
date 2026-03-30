/**
 * Test Gemini 3.0 Pro Video Analysis
 * Analyzes a real TikTok video from your data folder
 */

import { geminiAnalyzer } from '../src/lib/services/gemini-video-analyzer';
import fs from 'fs';
import path from 'path';

async function testGeminiAnalysis() {
  console.log('\n🎬 TESTING GEMINI 3.0 PRO VIDEO ANALYSIS\n');
  console.log('═'.repeat(80));

  // Find a sample video from your data folder
  const videoDir = path.join(process.cwd(), 'data', 'raw_videos');
  const videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));

  if (videos.length === 0) {
    console.error('❌ No videos found in data/raw_videos');
    process.exit(1);
  }

  // Use the first video
  const testVideo = path.join(videoDir, videos[0]);
  console.log(`\n📹 Analyzing: ${videos[0]}\n`);

  try {
    console.log('⏳ Running Gemini 3.0 Pro analysis...');
    console.log('   (This may take 10-30 seconds for multimodal processing)\n');

    const startTime = Date.now();
    const analysis = await geminiAnalyzer.analyzeVideo(testVideo);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log('✅ ANALYSIS COMPLETE!\n');
    console.log('═'.repeat(80));
    console.log(`⏱️  Processing Time: ${duration} seconds\n`);

    // Display results
    console.log('📊 CONTENT ANALYSIS');
    console.log('─'.repeat(80));
    console.log(`Main Topic: ${analysis.content.mainTopic}`);
    console.log(`Content Type: ${analysis.content.contentType}`);
    console.log(`Emotional Tone: ${analysis.content.emotionalTone}`);
    console.log(`Target Audience: ${analysis.content.targetAudience}`);
    console.log(`\nKey Messages:`);
    analysis.content.keyMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg}`);
    });
    console.log(`\nViral Elements:`);
    analysis.content.viralElements.forEach((elem, i) => {
      console.log(`  ${i + 1}. ${elem}`);
    });

    console.log('\n\n🎨 VISUAL ANALYSIS');
    console.log('─'.repeat(80));
    console.log(`Visual Style: ${analysis.visual.visualStyle}`);
    console.log(`Composition: ${analysis.visual.composition}`);
    console.log(`Dominant Colors: ${analysis.visual.dominantColors.join(', ')}`);
    console.log(`\nCamera Movements:`);
    analysis.visual.cameraMovements.forEach((move, i) => {
      console.log(`  ${i + 1}. ${move}`);
    });
    console.log(`\nText on Screen:`);
    analysis.visual.textOnScreen.forEach((text, i) => {
      console.log(`  ${i + 1}. "${text}"`);
    });
    console.log(`\nScene Breakdown:`);
    analysis.visual.sceneBreakdown.slice(0, 5).forEach((scene, i) => {
      console.log(`  ${i + 1}. ${scene}`);
    });

    console.log('\n\n🎵 AUDIO ANALYSIS');
    console.log('─'.repeat(80));
    console.log(`Background Music: ${analysis.audio.backgroundMusic}`);
    console.log(`Music Genre: ${analysis.audio.musicGenre}`);
    console.log(`Voiceover Tone: ${analysis.audio.voiceoverTone}`);
    console.log(`Speech Cadence: ${analysis.audio.speechCadence}`);
    console.log(`Audio Quality: ${analysis.audio.audioQuality}`);
    console.log(`\nSound Effects:`);
    analysis.audio.soundEffects.forEach((sfx, i) => {
      console.log(`  ${i + 1}. ${sfx}`);
    });

    console.log('\n\n📈 ENGAGEMENT PREDICTIONS');
    console.log('─'.repeat(80));
    console.log(`Hook Strength:       ${(analysis.engagement.hookStrength * 100).toFixed(1)}%`);
    console.log(`Retention Potential: ${(analysis.engagement.retentionPotential * 100).toFixed(1)}%`);
    console.log(`Shareability:        ${(analysis.engagement.shareability * 100).toFixed(1)}%`);
    console.log(`Emotional Impact:    ${(analysis.engagement.emotionalImpact * 100).toFixed(1)}%`);
    console.log(`Viral Potential:     ${(analysis.engagement.viralPotential * 100).toFixed(1)}%`);

    console.log('\n\n📝 TRANSCRIPT');
    console.log('─'.repeat(80));
    console.log(analysis.transcript.fullText.substring(0, 500));
    if (analysis.transcript.fullText.length > 500) {
      console.log('...\n(truncated)');
    }
    console.log(`\nKey Phrases:`);
    analysis.transcript.keyPhrases.forEach((phrase, i) => {
      console.log(`  ${i + 1}. "${phrase}"`);
    });
    console.log(`\nCall to Action: ${analysis.transcript.callToAction}`);

    console.log('\n\n' + '═'.repeat(80));
    console.log('🎉 TEST COMPLETE! Gemini 3.0 Pro is working perfectly!');
    console.log('═'.repeat(80) + '\n');

    // Save analysis to file
    const outputFile = path.join(process.cwd(), 'gemini-analysis-sample.json');
    fs.writeFileSync(outputFile, JSON.stringify(analysis, null, 2));
    console.log(`💾 Full analysis saved to: ${outputFile}\n`);

  } catch (error: any) {
    console.error('\n❌ TEST FAILED\n');
    console.error('Error:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  }
}

// Run the test
testGeminiAnalysis();
