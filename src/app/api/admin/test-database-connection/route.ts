import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AlertService } from '@/lib/services/alertService';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}
const supabase = new Proxy({}, { get(_t, p){ return (getDb() as any)[p as any] } }) as any;

export async function GET(request: NextRequest) {
  const testResults = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    overall_status: 'success',
    phase_1_status: 'TESTING'
  };

  try {
    // Test 1: Basic Supabase connection
    console.log('🔍 Testing basic Supabase connection...');
    const { data: healthTest, error: healthError } = await supabase
      .from('system_health_logs')
      .select('id')
      .limit(1);

    testResults.tests.push({
      test: 'supabase_connection',
      status: healthError ? 'failed' : 'passed',
      message: healthError ? healthError.message : 'Supabase connected successfully',
      data_found: healthTest?.length || 0
    });

    // Test 2: System Health Logs table
    console.log('🔍 Testing system_health_logs table...');
    const { data: logs, error: logsError } = await supabase
      .from('system_health_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(5);

    testResults.tests.push({
      test: 'system_health_logs',
      status: logsError ? 'failed' : 'passed',
      message: logsError ? logsError.message : `Found ${logs?.length || 0} recent health logs`,
      sample_data: logs?.[0] || null
    });

    // Test 3: Prediction Validation table
    console.log('🔍 Testing prediction_validation table...');
    const { data: validations, error: validationError } = await supabase
      .from('prediction_validation')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    testResults.tests.push({
      test: 'prediction_validation',
      status: validationError ? 'failed' : 'passed',
      message: validationError ? validationError.message : `Found ${validations?.length || 0} validation records`,
      sample_data: validations?.[0] || null
    });

    // Test 4: Viral Recipe Book table
    console.log('🔍 Testing viral_recipe_book table...');
    const { data: recipes, error: recipeError } = await supabase
      .from('viral_recipe_book')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3);

    testResults.tests.push({
      test: 'viral_recipe_book',
      status: recipeError ? 'failed' : 'passed',
      message: recipeError ? recipeError.message : `Found ${recipes?.length || 0} viral recipes`,
      sample_data: recipes?.[0] || null
    });

    // Test 5: AlertService integration
    console.log('🔍 Testing AlertService...');
    try {
      await AlertService.logAlert('info', 'test_system', 'Phase 1 database connection test completed successfully');
      const alerts = await AlertService.getUnreadAlerts();
      
      testResults.tests.push({
        test: 'alert_service',
        status: 'passed',
        message: `AlertService working. Found ${alerts.length} unread alerts`,
        sample_data: alerts[0] || null
      });
    } catch (alertError) {
      testResults.tests.push({
        test: 'alert_service',
        status: 'failed',
        message: alertError instanceof Error ? alertError.message : 'AlertService test failed'
      });
    }

    // Test 6: Insert test health log
    console.log('🔍 Testing database write operations...');
    const { data: insertTest, error: insertError } = await supabase
      .from('system_health_logs')
      .insert({
        module_name: 'Phase_1_Test',
        status: 'active',
        metrics: {
          test_type: 'database_connection_test',
          phase: 'phase_1_core_service_connection',
          timestamp: new Date().toISOString(),
          validation_system_connected: true,
          alert_service_connected: true
        }
      })
      .select();

    testResults.tests.push({
      test: 'database_write',
      status: insertError ? 'failed' : 'passed',
      message: insertError ? insertError.message : 'Successfully wrote test data to database',
      inserted_record: insertTest?.[0] || null
    });

    // Determine overall status
    const failedTests = testResults.tests.filter(t => t.status === 'failed');
    if (failedTests.length > 0) {
      testResults.overall_status = 'partial_failure';
      testResults.phase_1_status = 'NEEDS_ATTENTION';
    } else {
      testResults.overall_status = 'success';
      testResults.phase_1_status = 'READY_FOR_PHASE_2';
    }

    console.log(`✅ Database connection tests completed: ${testResults.tests.length - failedTests.length}/${testResults.tests.length} passed`);

    return NextResponse.json(testResults);

  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    
    testResults.overall_status = 'critical_failure';
    testResults.phase_1_status = 'BLOCKED';
    testResults.error = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(testResults, { status: 500 });
  }
} 