import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🔍 Testing UI Integration with Real APIs...');
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
    
    // Test all the APIs that dashboards should be consuming
    const apiTests = [
      {
        name: 'dashboard-data',
        url: `${baseUrl}/api/admin/super-admin/dashboard-data`,
        description: 'Main dashboard data endpoint'
      },
      {
        name: 'system-metrics', 
        url: `${baseUrl}/api/admin/super-admin/system-metrics`,
        description: 'System metrics for command center'
      },
      {
        name: 'module-status',
        url: `${baseUrl}/api/admin/super-admin/module-status`, 
        description: 'Module health status'
      },
      {
        name: 'prediction-validations',
        url: `${baseUrl}/api/admin/super-admin/prediction-validations`,
        description: 'Prediction validation data'
      }
    ];

    const results = [];
    
    for (const test of apiTests) {
      try {
        console.log(`🔍 Testing ${test.name}...`);
        
        // Force fresh call with cache-busting to avoid stale data
        const cacheBuster = `?v=${Date.now()}`;
        const response = await fetch(test.url + cacheBuster, {
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        const data = await response.json();
        
        const hasRealData = data && (
          data.dataSource === 'REAL_DATABASE' || 
          data.dataSource === 'REAL_INTEGRATED_APIS' ||
          (data.systemOverview && data.moduleHealth) ||
          (data.viralPredictions !== undefined) ||
          (data.validations !== undefined)
        );
        
        results.push({
          api: test.name,
          description: test.description,
          status: response.ok ? 'working' : 'failed',
          hasRealData,
          dataPreview: {
            responseOk: response.ok,
            hasData: !!data,
            dataSource: data?.dataSource || 'unknown',
            sampleKeys: data ? Object.keys(data).slice(0, 5) : []
          }
        });
        
        console.log(`✅ ${test.name}: ${response.ok ? 'Working' : 'Failed'}, Real Data: ${hasRealData}`);
        
      } catch (error) {
        results.push({
          api: test.name,
          description: test.description,
          status: 'error',
          hasRealData: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        console.log(`❌ ${test.name}: Error - ${error}`);
      }
    }

    // Check which dashboard pages exist and should be consuming this data
    const dashboardPages = [
      {
        page: 'super-admin-live',
        url: '/admin/super-admin-live', 
        apis: ['dashboard-data'],
        description: 'Main super admin dashboard with live metrics'
      },
      {
        page: 'command-center',
        url: '/admin/command-center',
        apis: ['system-metrics', 'prediction-validations'],
        description: 'Command center with system overview'
      },
      {
        page: 'studio',
        url: '/admin/studio',
        apis: ['dashboard-data'],
        description: 'Studio interface'
      }
    ];

    const summary = {
      timestamp: new Date().toISOString(),
      totalApisTested: apiTests.length,
      workingApis: results.filter(r => r.status === 'working').length,
      apisWithRealData: results.filter(r => r.hasRealData).length,
      dashboardPages: dashboardPages.length,
      
      // Integration assessment
      integrationStatus: results.every(r => r.status === 'working' && r.hasRealData) 
        ? 'FULLY_INTEGRATED' 
        : results.some(r => r.status === 'working' && r.hasRealData)
        ? 'PARTIAL_INTEGRATION'
        : 'NO_INTEGRATION',
        
      readyForPhase32: results.every(r => r.status === 'working' && r.hasRealData)
    };

    console.log('✅ UI Integration test completed');
    console.log(`📊 Status: ${summary.integrationStatus}`);
    console.log(`🎯 Ready for Phase 3.2: ${summary.readyForPhase32}`);

    return NextResponse.json({
      success: true,
      summary,
      apiResults: results,
      dashboardPages,
      recommendations: summary.integrationStatus === 'FULLY_INTEGRATED' 
        ? ['✅ All APIs working with real data', '✅ Ready to proceed to Phase 3.2']
        : ['❌ Some APIs not returning real data', '🔧 Fix API data sources before Phase 3.2'],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ UI Integration test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'UI integration test failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 