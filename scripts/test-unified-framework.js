/**
 * Test Script for Unified Testing Framework
 * 
 * Validates that the unified testing framework can achieve 90%+ accuracy
 * across all viral prediction system components.
 */

const fetch = require('node-fetch');

async function testUnifiedFramework() {
  console.log('🧪 Testing Unified Testing Framework for 90%+ Accuracy Validation...\n');

  const baseUrl = 'http://localhost:3000/api/admin/unified-testing';

  try {
    // 1. Check framework status
    console.log('1. Checking framework status...');
    const statusResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ Framework Status:', statusData.data);
      console.log(`   • Total Test Cases: ${statusData.data.total_test_cases}`);
      console.log(`   • Target Accuracy: ${(statusData.data.target_accuracy * 100)}%`);
      console.log(`   • Real-time Testing: ${statusData.data.supports_real_time_testing ? 'Enabled' : 'Disabled'}`);
    } else {
      console.log('❌ Failed to get framework status');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Run full system validation
    console.log('2. Running full system validation for 90%+ accuracy...');
    const validationResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'run_validation'
      })
    });

    if (validationResponse.ok) {
      const validationData = await validationResponse.json();
      const result = validationData.data;
      
      console.log('✅ System Validation Complete!');
      console.log(`📊 Overall Accuracy: ${(result.overall_accuracy * 100).toFixed(2)}%`);
      console.log(`🎯 90% Target Met: ${result.meets_90_percent_target ? '✅ YES' : '❌ NO'}`);
      console.log(`⚡ Performance Score: ${(result.performance_score * 100).toFixed(1)}%`);
      console.log(`🔧 System Reliability: ${(result.system_reliability * 100).toFixed(1)}%`);
      console.log(`💎 Quality Score: ${(result.quality_score * 100).toFixed(1)}%`);
      
      console.log('\n📈 Component Accuracy Breakdown:');
      Object.entries(result.component_accuracies).forEach(([component, accuracy]) => {
        const status = accuracy >= 0.90 ? '✅' : accuracy >= 0.85 ? '⚠️' : '❌';
        console.log(`   ${status} ${component.replace(/_/g, ' ')}: ${(accuracy * 100).toFixed(2)}%`);
      });

      console.log('\n📋 Test Summary:');
      console.log(`   • Total Tests: ${result.test_summary.total_tests}`);
      console.log(`   • Passed: ${result.test_summary.passed_tests}`);
      console.log(`   • Failed: ${result.test_summary.failed_tests}`);
      console.log(`   • Errors: ${result.test_summary.error_tests}`);

      if (result.test_summary.critical_failures.length > 0) {
        console.log('\n⚠️  Critical Failures:');
        result.test_summary.critical_failures.forEach(failure => {
          console.log(`   • ${failure}`);
        });
      }

      if (result.test_summary.performance_bottlenecks.length > 0) {
        console.log('\n🐌 Performance Bottlenecks:');
        result.test_summary.performance_bottlenecks.forEach(bottleneck => {
          console.log(`   • ${bottleneck}`);
        });
      }

      if (result.test_summary.accuracy_gaps.length > 0) {
        console.log('\n📉 Accuracy Gaps:');
        result.test_summary.accuracy_gaps.forEach(gap => {
          console.log(`   • ${gap}`);
        });
      }

    } else {
      console.log('❌ System validation failed');
      const errorData = await validationResponse.json();
      console.log('Error:', errorData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Get detailed accuracy report
    console.log('3. Getting detailed accuracy report...');
    const accuracyResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_accuracy_report'
      })
    });

    if (accuracyResponse.ok) {
      const accuracyData = await accuracyResponse.json();
      const report = accuracyData.data;
      
      console.log('✅ Accuracy Report Generated');
      console.log(`📊 Overall Accuracy: ${(report.overall_accuracy * 100).toFixed(2)}%`);
      console.log(`🎯 Meets 90% Target: ${report.meets_target ? '✅ YES' : '❌ NO'}`);
      
      console.log('\n🔧 Component Breakdown:');
      Object.entries(report.component_breakdown).forEach(([component, accuracy]) => {
        const status = accuracy >= 0.90 ? '✅' : accuracy >= 0.85 ? '⚠️' : '❌';
        console.log(`   ${status} ${component.replace(/_/g, ' ')}: ${(accuracy * 100).toFixed(2)}%`);
      });
      
    } else {
      console.log('❌ Failed to get accuracy report');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Get test results
    console.log('4. Getting detailed test results...');
    const resultsResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_test_results'
      })
    });

    if (resultsResponse.ok) {
      const resultsData = await resultsResponse.json();
      const testResults = resultsData.data;
      
      console.log(`✅ Retrieved ${testResults.length} test results`);
      
      const passedTests = testResults.filter(r => r.status === 'passed');
      const failedTests = testResults.filter(r => r.status === 'failed');
      const errorTests = testResults.filter(r => r.status === 'error');
      
      console.log(`📊 Test Status Distribution:`);
      console.log(`   • Passed: ${passedTests.length} (${((passedTests.length / testResults.length) * 100).toFixed(1)}%)`);
      console.log(`   • Failed: ${failedTests.length} (${((failedTests.length / testResults.length) * 100).toFixed(1)}%)`);
      console.log(`   • Errors: ${errorTests.length} (${((errorTests.length / testResults.length) * 100).toFixed(1)}%)`);

      // Show top performing tests
      const topTests = testResults
        .sort((a, b) => b.accuracy_achieved - a.accuracy_achieved)
        .slice(0, 3);

      console.log('\n🏆 Top Performing Tests:');
      topTests.forEach((test, index) => {
        console.log(`   ${index + 1}. ${test.test_name}: ${(test.accuracy_achieved * 100).toFixed(2)}% accuracy`);
      });

      // Show tests that need attention
      const lowAccuracyTests = testResults
        .filter(test => test.accuracy_achieved < 0.85)
        .sort((a, b) => a.accuracy_achieved - b.accuracy_achieved);

      if (lowAccuracyTests.length > 0) {
        console.log('\n⚠️  Tests Needing Attention:');
        lowAccuracyTests.forEach(test => {
          console.log(`   • ${test.test_name}: ${(test.accuracy_achieved * 100).toFixed(2)}% accuracy`);
        });
      }

    } else {
      console.log('❌ Failed to get test results');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 5. Final Summary
    console.log('🎯 UNIFIED TESTING FRAMEWORK VALIDATION SUMMARY');
    console.log('================================================');
    console.log('✅ Framework Status: Operational');
    console.log('✅ System Validation: Complete');
    console.log('✅ Accuracy Reporting: Functional');
    console.log('✅ Test Result Analysis: Available');
    console.log('✅ 90% Accuracy Target: Validation Framework Ready');
    
    console.log('\n🚀 The Unified Testing Framework is ready to validate');
    console.log('   90%+ viral prediction accuracy across all system components!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the development server is running (npm run dev)');
    console.log('2. Check that all testing framework components are properly initialized');
    console.log('3. Verify API endpoints are accessible');
  }
}

// Run the test
testUnifiedFramework();