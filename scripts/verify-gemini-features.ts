/**
 * Verify Gemini 3 Pro Features in API Response
 * This script uploads a video and checks the API response for Gemini features
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3001';

async function verifyGeminiFeatures() {
  console.log('========================================');
  console.log('VERIFYING GEMINI 3 PRO FEATURES');
  console.log('========================================\n');

  // Find a test video
  const videoDir = path.join(process.cwd(), 'data', 'raw_videos');
  const videos = fs.readdirSync(videoDir).filter(f => f.endsWith('.mp4'));

  if (videos.length === 0) {
    console.log('❌ No test videos found');
    return;
  }

  const testVideo = videos[0];
  const videoPath = path.join(videoDir, testVideo);

  console.log(`📹 Testing with: ${testVideo}\n`);

  // Create form data
  const FormData = (await import('form-data')).default;
  const formData = new FormData();

  formData.append('video', fs.createReadStream(videoPath));
  formData.append('niche', 'Side Hustles/Making Money Online');
  formData.append('goal', 'Build engaged following');
  formData.append('accountSize', 'Medium (10K-100K)');

  console.log('📤 Uploading video...\n');

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
    console.log('CHECKING FOR GEMINI FEATURES');
    console.log('========================================\n');

    // Check if features field exists
    if (!result.features) {
      console.log('❌ CRITICAL: features field NOT FOUND in response');
      console.log('   Available keys:', Object.keys(result));
      return;
    }

    console.log('✅ features field EXISTS in response\n');

    // Check if gemini features exist
    if (!result.features.gemini) {
      console.log('❌ gemini features NOT FOUND');
      console.log('   Available feature keys:', Object.keys(result.features));
      return;
    }

    console.log('✅ gemini features FOUND\n');

    const geminiFeatures = result.features.gemini;

    console.log('📋 Gemini 3 Pro Features:\n');
    console.log(JSON.stringify(geminiFeatures, null, 2));

    console.log('\n========================================');
    console.log('VERIFICATION CHECKLIST');
    console.log('========================================\n');

    const checks = [
      { field: 'modelName', expected: 'gemini-3-pro-preview' },
      { field: 'analysisType', expected: ['video_file', 'transcript'] },
      { field: 'visualEngagement', type: 'number' },
      { field: 'audioQuality', type: 'number' }
    ];

    let allPass = true;

    for (const check of checks) {
      const value = geminiFeatures[check.field];

      if (value === undefined) {
        console.log(`❌ ${check.field}: NOT FOUND`);
        allPass = false;
      } else if (check.expected) {
        if (Array.isArray(check.expected)) {
          if (check.expected.includes(value)) {
            console.log(`✅ ${check.field}: ${value}`);
          } else {
            console.log(`❌ ${check.field}: ${value} (expected: ${check.expected.join('/')})`);
            allPass = false;
          }
        } else if (value === check.expected) {
          console.log(`✅ ${check.field}: ${value}`);
        } else {
          console.log(`❌ ${check.field}: ${value} (expected: ${check.expected})`);
          allPass = false;
        }
      } else if (check.type === 'number') {
        if (typeof value === 'number') {
          console.log(`✅ ${check.field}: ${value}`);
        } else {
          console.log(`❌ ${check.field}: ${value} (expected number, got ${typeof value})`);
          allPass = false;
        }
      }
    }

    console.log('\n========================================');
    console.log('FINAL RESULT');
    console.log('========================================\n');

    if (allPass) {
      console.log('🎉 ALL CHECKS PASSED!');
      console.log('✅ Gemini 3 Pro video analysis is working');
      console.log('✅ Features are being returned in API response');
      console.log('✅ Frontend should now display Gemini section');
    } else {
      console.log('⚠️  SOME CHECKS FAILED');
      console.log('   Review the errors above');
    }

  } catch (error: any) {
    console.log('❌ Error:', error.message);
  }
}

verifyGeminiFeatures();
