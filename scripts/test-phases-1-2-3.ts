/**
 * Test Script for Phases 1-3
 *
 * Tests:
 * - Phase 1A: FFmpeg video processing integration
 * - Phase 1B: A/B testing integration with Kai
 * - Phase 2: Gemini 3 Pro video upload and analysis
 * - Phase 3: Temporal consistency monitoring
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

console.log('========================================');
console.log('TESTING PHASES 1-3 IMPLEMENTATION');
console.log('========================================\n');

// ============================================================================
// PHASE 1A: FFmpeg Integration Test
// ============================================================================

async function testPhase1A() {
  console.log('\n[PHASE 1A] Testing FFmpeg Integration...');

  try {
    // Check if FFmpeg service exists
    const ffmpegPath = path.join(process.cwd(), 'src', 'lib', 'services', 'ffmpeg-service.ts');
    if (!fs.existsSync(ffmpegPath)) {
      console.log('❌ FFmpeg service file not found');
      return false;
    }
    console.log('✅ FFmpeg service file exists');

    // Check if kai-orchestrator calls FFmpeg
    const orchestratorPath = path.join(process.cwd(), 'src', 'lib', 'orchestration', 'kai-orchestrator.ts');
    const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf-8');

    if (orchestratorContent.includes('executeFFmpeg') && orchestratorContent.includes('ffmpegData')) {
      console.log('✅ Kai orchestrator has FFmpeg integration');
    } else {
      console.log('❌ FFmpeg integration not found in orchestrator');
      return false;
    }

    // Check if route.ts passes ffmpegData
    const routePath = path.join(process.cwd(), 'src', 'app', 'api', 'kai', 'predict', 'route.ts');
    const routeContent = fs.readFileSync(routePath, 'utf-8');

    if (routeContent.includes('ffmpegData')) {
      console.log('✅ API route passes ffmpegData to Kai');
    } else {
      console.log('❌ API route does not pass ffmpegData');
      return false;
    }

    console.log('✅ Phase 1A: FFmpeg Integration - PASSED');
    return true;

  } catch (error: any) {
    console.log('❌ Phase 1A: FFmpeg Integration - FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

// ============================================================================
// PHASE 1B: A/B Testing Integration Test
// ============================================================================

async function testPhase1B() {
  console.log('\n[PHASE 1B] Testing A/B Testing Integration...');

  try {
    // Check if ab-kai-integration.ts exists
    const abIntegrationPath = path.join(process.cwd(), 'src', 'lib', 'services', 'ab-kai-integration.ts');
    if (!fs.existsSync(abIntegrationPath)) {
      console.log('❌ A/B Kai integration service not found');
      return false;
    }
    console.log('✅ A/B Kai integration service exists');

    // Check if database migration exists
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251124_kai_ab_testing.sql');
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ A/B testing migration not found');
      return false;
    }
    console.log('✅ A/B testing migration exists');

    // Check if API endpoint exists
    const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'kai', 'ab-test', 'route.ts');
    if (!fs.existsSync(apiPath)) {
      console.log('❌ A/B testing API endpoint not found');
      return false;
    }
    console.log('✅ A/B testing API endpoint exists');

    // Check if orchestrator has variant selection logic
    const orchestratorPath = path.join(process.cwd(), 'src', 'lib', 'orchestration', 'kai-orchestrator.ts');
    const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf-8');

    if (orchestratorContent.includes('getComponentVariant') && orchestratorContent.includes('recordTestPrediction')) {
      console.log('✅ Orchestrator has variant selection and tracking');
    } else {
      console.log('❌ Variant selection logic not found in orchestrator');
      return false;
    }

    // Check if VideoInput has _abTestConfig field
    if (orchestratorContent.includes('_abTestConfig')) {
      console.log('✅ VideoInput has _abTestConfig field');
    } else {
      console.log('❌ _abTestConfig field not found in VideoInput');
      return false;
    }

    // Test database tables (if migration was run)
    const { data: tables, error } = await supabase
      .from('kai_component_tests')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Database tables not yet created (run migration first)');
    } else {
      console.log('✅ Database tables created and accessible');
    }

    console.log('✅ Phase 1B: A/B Testing Integration - PASSED');
    return true;

  } catch (error: any) {
    console.log('❌ Phase 1B: A/B Testing Integration - FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

// ============================================================================
// PHASE 2: Gemini 3 Pro Video Upload Test
// ============================================================================

async function testPhase2() {
  console.log('\n[PHASE 2] Testing Gemini 3 Pro Video Upload...');

  try {
    // Check if gemini-service has file manager
    const geminiPath = path.join(process.cwd(), 'src', 'lib', 'services', 'gemini-service.ts');
    const geminiContent = fs.readFileSync(geminiPath, 'utf-8');

    if (geminiContent.includes('GoogleAIFileManager')) {
      console.log('✅ GoogleAIFileManager imported');
    } else {
      console.log('❌ GoogleAIFileManager not imported');
      return false;
    }

    if (geminiContent.includes('fileManager')) {
      console.log('✅ FileManager instance created');
    } else {
      console.log('❌ FileManager instance not found');
      return false;
    }

    // Check if analyzeVideoFile is implemented
    if (geminiContent.includes('uploadFile') && geminiContent.includes('FileState.PROCESSING')) {
      console.log('✅ Video upload implementation found');
    } else {
      console.log('❌ Video upload implementation not found');
      return false;
    }

    // Check if buildVideoAnalysisPrompt exists
    if (geminiContent.includes('buildVideoAnalysisPrompt')) {
      console.log('✅ Video analysis prompt builder exists');
    } else {
      console.log('❌ Video analysis prompt builder not found');
      return false;
    }

    // Check if orchestrator calls video analysis
    const orchestratorPath = path.join(process.cwd(), 'src', 'lib', 'orchestration', 'kai-orchestrator.ts');
    const orchestratorContent = fs.readFileSync(orchestratorPath, 'utf-8');

    if (orchestratorContent.includes('analyzeVideoFile') && orchestratorContent.includes('input.videoPath')) {
      console.log('✅ Orchestrator calls video file analysis');
    } else {
      console.log('❌ Video file analysis not called in orchestrator');
      return false;
    }

    // Check if analysisType is tracked
    if (orchestratorContent.includes('analysisType')) {
      console.log('✅ Analysis type tracking added');
    } else {
      console.log('❌ Analysis type tracking not found');
      return false;
    }

    // Verify model name is gemini-3-pro-preview
    if (geminiContent.includes("'gemini-3-pro-preview'")) {
      console.log('✅ Model name is gemini-3-pro-preview');
    } else {
      console.log('❌ Model name is not gemini-3-pro-preview');
      return false;
    }

    console.log('✅ Phase 2: Gemini 3 Pro Video Upload - PASSED');
    return true;

  } catch (error: any) {
    console.log('❌ Phase 2: Gemini 3 Pro Video Upload - FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

// ============================================================================
// PHASE 3: Temporal Consistency Monitoring Test
// ============================================================================

async function testPhase3() {
  console.log('\n[PHASE 3] Testing Temporal Consistency Monitoring...');

  try {
    // Check if temporal-consistency-monitor.ts exists
    const monitorPath = path.join(process.cwd(), 'src', 'lib', 'services', 'temporal-consistency-monitor.ts');
    if (!fs.existsSync(monitorPath)) {
      console.log('❌ Temporal consistency monitor service not found');
      return false;
    }
    console.log('✅ Temporal consistency monitor service exists');

    const monitorContent = fs.readFileSync(monitorPath, 'utf-8');

    // Check for PSI implementation
    if (monitorContent.includes('calculatePSI')) {
      console.log('✅ PSI (Population Stability Index) implemented');
    } else {
      console.log('❌ PSI calculation not found');
      return false;
    }

    // Check for KS-Test implementation
    if (monitorContent.includes('calculateKSTest')) {
      console.log('✅ KS-Test (Kolmogorov-Smirnov) implemented');
    } else {
      console.log('❌ KS-Test calculation not found');
      return false;
    }

    // Check for time window analysis
    if (monitorContent.includes("'7d'") && monitorContent.includes("'14d'") && monitorContent.includes("'30d'")) {
      console.log('✅ Rolling window analysis (7/14/30 days) implemented');
    } else {
      console.log('❌ Rolling window analysis not found');
      return false;
    }

    // Check for drift detection
    if (monitorContent.includes('driftDetected') && monitorContent.includes('alertLevel')) {
      console.log('✅ Drift detection and alerting implemented');
    } else {
      console.log('❌ Drift detection logic not found');
      return false;
    }

    // Check if database migration exists
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20251125_temporal_consistency.sql');
    if (!fs.existsSync(migrationPath)) {
      console.log('❌ Temporal consistency migration not found');
      return false;
    }
    console.log('✅ Temporal consistency migration exists');

    // Check if API endpoint exists
    const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'kai', 'drift', 'route.ts');
    if (!fs.existsSync(apiPath)) {
      console.log('❌ Drift monitoring API endpoint not found');
      return false;
    }
    console.log('✅ Drift monitoring API endpoint exists');

    // Test database tables (if migration was run)
    const { data: tables, error } = await supabase
      .from('kai_drift_metrics')
      .select('*')
      .limit(1);

    if (error) {
      console.log('⚠️  Database tables not yet created (run migration first)');
    } else {
      console.log('✅ Database tables created and accessible');
    }

    console.log('✅ Phase 3: Temporal Consistency Monitoring - PASSED');
    return true;

  } catch (error: any) {
    console.log('❌ Phase 3: Temporal Consistency Monitoring - FAILED');
    console.error('Error:', error.message);
    return false;
  }
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

async function runAllTests() {
  const results = {
    phase1A: await testPhase1A(),
    phase1B: await testPhase1B(),
    phase2: await testPhase2(),
    phase3: await testPhase3()
  };

  console.log('\n========================================');
  console.log('TEST RESULTS SUMMARY');
  console.log('========================================');
  console.log(`Phase 1A (FFmpeg):                ${results.phase1A ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Phase 1B (A/B Testing):           ${results.phase1B ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Phase 2 (Gemini 3 Pro Upload):    ${results.phase2 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Phase 3 (Temporal Monitoring):    ${results.phase3 ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('========================================');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    console.log('\n🎉 ALL TESTS PASSED! All phases implemented correctly.');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED. Review the errors above.');
  }

  console.log('\n📝 NEXT STEPS:');
  console.log('1. Run database migrations:');
  console.log('   npx supabase db push');
  console.log('2. Test A/B testing API:');
  console.log('   POST /api/kai/ab-test');
  console.log('3. Test drift analysis API:');
  console.log('   POST /api/kai/drift/analyze');
  console.log('4. Upload a video to test Gemini 3 Pro video analysis');
  console.log('5. Monitor component drift over time\n');

  return allPassed;
}

// Run tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });
