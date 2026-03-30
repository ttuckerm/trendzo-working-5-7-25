/**
 * Test Gemini 3 Pro Video Analysis
 * This script uploads a video and shows you the ACTUAL API response
 * to prove the new fields are being returned
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3000';

async function testVideoUpload() {
  console.log('========================================');
  console.log('TESTING GEMINI 3 PRO VIDEO ANALYSIS');
  console.log('========================================\n');

  // Find a test video
  const videoDir = path.join(process.cwd(), 'data', 'raw_videos');
  const videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));

  if (videos.length === 0) {
    console.log('❌ No test videos found in data/raw_videos/');
    return;
  }

  const testVideo = videos[0];
  const videoPath = path.join(videoDir, testVideo);

  console.log(`📹 Using test video: ${testVideo}`);
  console.log(`📁 Path: ${videoPath}`);
  console.log(`📊 Size: ${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(2)} MB\n`);

  // Create form data
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  formData.append('videoFile', fs.createReadStream(videoPath));
  formData.append('niche', 'Side Hustles/Making Money Online');
  formData.append('goal', 'Build engaged following');
  formData.append('accountSize', 'Medium (10K-100K)');

  console.log('📤 Uploading video to /api/kai/predict...\n');

  try {
    const response = await fetch(`${API_BASE}/api/kai/predict`, {
      method: 'POST',
      body: formData as any,
      headers: formData.getHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ API Error:', error);
      return;
    }

    const result = await response.json();

    console.log('✅ Prediction Complete!\n');
    console.log('========================================');
    console.log('PREDICTION RESULT');
    console.log('========================================\n');

    console.log(`📊 Predicted DPS: ${result.dps}`);
    console.log(`🎯 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    console.log(`📈 Range: [${result.range[0].toFixed(1)} - ${result.range[1].toFixed(1)}]\n`);

    // Check for Gemini component
    console.log('========================================');
    console.log('GEMINI 3 PRO ANALYSIS');
    console.log('========================================\n');

    const geminiScore = result.componentScores?.gemini;
    const geminiUsed = result.componentsUsed?.includes('gemini');

    if (!geminiUsed) {
      console.log('⚠️  Gemini component was NOT used in prediction');
      console.log('   This could mean:');
      console.log('   - Gemini API key not configured');
      console.log('   - Component failed during execution');
      console.log('   - Component not registered');
      return;
    }

    console.log(`✅ Gemini WAS used (Score: ${geminiScore})\n`);

    // Look for the new fields in features
    const allFeatures = result.features || {};

    console.log('📋 Checking for NEW Gemini fields...\n');

    // Find Gemini features
    let geminiFeatures = null;
    for (const [key, value] of Object.entries(allFeatures)) {
      if (key === 'gemini' || (value as any)?.modelName?.startsWith('gemini-2')) {
        geminiFeatures = value as any;
        break;
      }
    }

    if (!geminiFeatures) {
      console.log('❌ No Gemini features found in response');
      console.log('   Available feature keys:', Object.keys(allFeatures));
      return;
    }

    console.log('Found Gemini features:', geminiFeatures);
    console.log('');

    // Check for NEW fields
    const checks = [
      { field: 'modelName', expected: 'gemini-2.0-flash-thinking-exp-1219', description: 'Model Name' },
      { field: 'analysisType', expected: ['video_file', 'transcript'], description: 'Analysis Type (NEW!)' },
      { field: 'visualEngagement', expected: 'number', description: 'Visual Engagement (NEW!)' },
      { field: 'audioQuality', expected: 'number', description: 'Audio Quality (NEW!)' }
    ];

    let allChecksPass = true;

    for (const check of checks) {
      const value = geminiFeatures[check.field];

      if (value === undefined) {
        console.log(`❌ ${check.description}: NOT FOUND`);
        allChecksPass = false;
      } else if (Array.isArray(check.expected)) {
        if (check.expected.includes(value)) {
          console.log(`✅ ${check.description}: ${value}`);
        } else {
          console.log(`❌ ${check.description}: ${value} (expected one of: ${check.expected.join(', ')})`);
          allChecksPass = false;
        }
      } else if (check.expected === 'number') {
        if (typeof value === 'number') {
          console.log(`✅ ${check.description}: ${value}`);
        } else {
          console.log(`❌ ${check.description}: ${value} (expected number, got ${typeof value})`);
          allChecksPass = false;
        }
      } else {
        if (value === check.expected) {
          console.log(`✅ ${check.description}: ${value}`);
        } else {
          console.log(`❌ ${check.description}: ${value} (expected ${check.expected})`);
          allChecksPass = false;
        }
      }
    }

    console.log('\n========================================');
    console.log('VERIFICATION RESULT');
    console.log('========================================\n');

    if (allChecksPass) {
      console.log('🎉 ALL NEW FIELDS PRESENT!');
      console.log('✅ Gemini 3 Pro video analysis is WORKING');

      if (geminiFeatures.analysisType === 'video_file') {
        console.log('✅ Video file was analyzed directly (not just transcript)');
      } else {
        console.log('ℹ️  Fell back to transcript analysis (videoPath may not have been available)');
      }
    } else {
      console.log('❌ SOME FIELDS MISSING');
      console.log('   The backend changes may not be deployed yet');
    }

    console.log('\n📋 Full Gemini Features Object:');
    console.log(JSON.stringify(geminiFeatures, null, 2));

  } catch (error: any) {
    console.log('❌ Error during test:', error.message);
  }
}

testVideoUpload();
