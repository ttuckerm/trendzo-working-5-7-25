import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    phase: 'Phase 2: Prediction Engine Activation',
    tests: [] as any[],
    overall_status: 'testing',
    successful_services: 0,
    total_services: 0
  };

  // Test 1: Basic imports
  try {
    console.log('🧪 Testing basic viral prediction imports...');
    
    // Test individual service imports
    const services = [
      { name: 'DynamicPercentileSystem', path: '@/lib/services/viral-prediction/dynamic-percentile-system' },
      { name: 'ApifyTikTokIntegration', path: '@/lib/services/viral-prediction/apify-integration' },
      { name: 'FrameworkParser', path: '@/lib/services/viral-prediction/framework-parser' },
      { name: 'UnifiedPredictionEngine', path: '@/lib/services/viral-prediction/unified-prediction-engine' }
    ];

    for (const service of services) {
      testResults.total_services++;
      try {
        const module = await import(service.path);
        const ServiceClass = module[service.name];
        
        if (ServiceClass) {
          // Try to instantiate if it's a class
          const instance = new ServiceClass();
          testResults.tests.push({
            service: service.name,
            status: 'success',
            test: 'import_and_instantiate',
            message: 'Service imported and instantiated successfully'
          });
          testResults.successful_services++;
        } else {
          testResults.tests.push({
            service: service.name,
            status: 'warning',
            test: 'import_only',
            message: 'Module imported but class not found'
          });
        }
      } catch (error) {
        testResults.tests.push({
          service: service.name,
          status: 'error',
          test: 'import_failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    console.log(`✅ Service import tests completed: ${testResults.successful_services}/${testResults.total_services} successful`);

  } catch (error) {
    testResults.tests.push({
      service: 'import_test_framework',
      status: 'error',
      test: 'framework_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Types import
  try {
    console.log('🧪 Testing viral prediction types...');
    const typesModule = await import('@/lib/types/viral-prediction');
    testResults.tests.push({
      service: 'viral-prediction-types',
      status: 'success',
      test: 'types_import',
      message: 'Types imported successfully'
    });
  } catch (error) {
    testResults.tests.push({
      service: 'viral-prediction-types',
      status: 'error',
      test: 'types_import_failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Determine overall status
  testResults.overall_status = testResults.successful_services > 0 ? 'partial_success' : 'failed';
  if (testResults.successful_services === testResults.total_services) {
    testResults.overall_status = 'success';
  }

  return NextResponse.json(testResults);
} 