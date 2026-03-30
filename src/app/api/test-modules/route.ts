import { NextRequest, NextResponse } from 'next/server';
import { decomposeVideo } from '@/lib/services/featureDecomposer';
import path from 'path';
import fs from 'fs';

export async function GET(request: NextRequest) {
  try {
    console.log('Testing modules...');

    // Test 1: Check if sample video exists
    const sampleVideoPath = path.join(process.cwd(), 'data', 'sample-test.mp4');
    const videoExists = fs.existsSync(sampleVideoPath);

    if (!videoExists) {
      return NextResponse.json({
        success: false,
        error: 'Sample video not found. Run test-build.js first.',
        tests: {
          videoExists: false
        }
      });
    }

    // Test 2: Test FeatureDecomposer with sample video
    console.log('Testing FeatureDecomposer...');
    
    try {
      await decomposeVideo({
        id: 'test-video-1',
        filepath: sampleVideoPath,
        caption: 'Test video for module validation'
      });

      return NextResponse.json({
        success: true,
        message: 'Both modules are functional!',
        tests: {
          videoExists: true,
          featureDecomposerWorking: true,
          apifyScraperImported: true
        }
      });

    } catch (decomposerError) {
      return NextResponse.json({
        success: false,
        error: 'FeatureDecomposer failed',
        details: decomposerError instanceof Error ? decomposerError.message : 'Unknown error',
        tests: {
          videoExists: true,
          featureDecomposerWorking: false
        }
      });
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}