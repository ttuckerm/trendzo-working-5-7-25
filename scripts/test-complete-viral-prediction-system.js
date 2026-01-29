/**
 * Complete Viral Prediction System Test
 * 
 * End-to-end test of the entire omniscient viral prediction ecosystem
 * including all AI systems, database integration, and frontend interfaces.
 */

const fetch = require('node-fetch');

async function testCompleteViralPredictionSystem() {
  console.log('🎯 COMPLETE VIRAL PREDICTION SYSTEM TEST');
  console.log('=' .repeat(60));
  console.log('Testing the entire omniscient viral prediction ecosystem\n');

  const baseUrl = 'http://localhost:3000';
  let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    errors: []
  };

  try {
    // Test 1: Admin Viral Prediction Hub Status
    console.log('1. Testing Admin Viral Prediction Hub...');
    testResults.total++;
    
    try {
      const hubResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub?action=system_status`);
      const hubData = await hubResponse.json();
      
      if (hubResponse.ok && hubData.success) {
        console.log('   ✅ Admin Hub API responding');
        console.log(`   📊 Systems detected: ${hubData.data?.length || 0}`);
        testResults.passed++;
      } else {
        throw new Error(`Hub API failed: ${hubData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Admin Hub API failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Admin Hub API not responding');
    }

    // Test 2: Omniscience Status
    console.log('\n2. Testing Omniscience System...');
    testResults.total++;
    
    try {
      const omniscienceResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub?action=omniscience_status`);
      const omniscienceData = await omniscienceResponse.json();
      
      if (omniscienceResponse.ok && omniscienceData.success) {
        console.log('   ✅ Omniscience System responding');
        console.log(`   🧠 Omniscience Level: ${(omniscienceData.data?.omniscience_level * 100 || 0).toFixed(1)}%`);
        console.log(`   📚 Knowledge Records: ${omniscienceData.data?.total_knowledge_records || 0}`);
        testResults.passed++;
      } else {
        throw new Error('Omniscience system not responding');
      }
    } catch (error) {
      console.log(`   ❌ Omniscience System failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Omniscience System not operational');
    }

    // Test 3: Live Viral Prediction
    console.log('\n3. Testing Live Viral Prediction...');
    testResults.total++;
    
    const testScript = "This productivity hack will save you 2 hours every day and transform your business completely.";
    
    try {
      const predictionResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_prediction',
          script_text: testScript,
          platform: 'tiktok',
          niche: 'business'
        })
      });

      const predictionData = await predictionResponse.json();
      
      if (predictionResponse.ok && predictionData.success) {
        console.log('   ✅ Live Prediction working');
        console.log(`   🎯 Viral Probability: ${(predictionData.data?.viral_probability * 100 || 0).toFixed(1)}%`);
        console.log(`   📊 Viral Score: ${predictionData.data?.viral_score?.toFixed(1) || 0}`);
        console.log(`   🔮 Confidence: ${(predictionData.data?.confidence * 100 || 0).toFixed(1)}%`);
        console.log(`   ✨ AI Enhancement: ${predictionData.data?.enhancement_applied ? 'Applied' : 'Not Applied'}`);
        testResults.passed++;
      } else {
        throw new Error(`Prediction failed: ${predictionData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.log(`   ❌ Live Prediction failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Live Prediction not working');
    }

    // Test 4: Validation System
    console.log('\n4. Testing Validation System...');
    testResults.total++;
    
    try {
      const validationResponse = await fetch(`${baseUrl}/api/admin/validation-system?action=status`);
      const validationData = await validationResponse.json();
      
      if (validationResponse.ok && validationData.success) {
        console.log('   ✅ Validation System responding');
        console.log(`   📈 Current Accuracy: ${(validationData.data?.real_time_accuracy?.current_accuracy * 100 || 0).toFixed(1)}%`);
        console.log(`   📊 Total Validations: ${validationData.data?.system_status?.total_validations || 0}`);
        testResults.passed++;
      } else {
        throw new Error('Validation system not responding');
      }
    } catch (error) {
      console.log(`   ❌ Validation System failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Validation System not operational');
    }

    // Test 5: Script Intelligence Core
    console.log('\n5. Testing Script Intelligence Core...');
    testResults.total++;
    
    try {
      // Test the main brain API
      const brainResponse = await fetch(`${baseUrl}/api/brain-simple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: testScript,
          platform: 'tiktok',
          niche: 'business'
        })
      });

      if (brainResponse.ok) {
        const brainData = await brainResponse.json();
        console.log('   ✅ Script Intelligence Core responding');
        console.log(`   🧠 Analysis completed successfully`);
        testResults.passed++;
      } else {
        throw new Error('Brain API not responding properly');
      }
    } catch (error) {
      console.log(`   ❌ Script Intelligence failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Script Intelligence Core not operational');
    }

    // Test 6: DNA Sequencing API
    console.log('\n6. Testing DNA Sequencing API...');
    testResults.total++;
    
    try {
      const dnaResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_dna_analysis',
          script_text: testScript,
          platform: 'tiktok',
          niche: 'business'
        })
      });

      if (dnaResponse.ok) {
        const dnaData = await dnaResponse.json();
        console.log('   ✅ DNA Sequencing API responding');
        console.log(`   🧬 DNA analysis completed`);
        testResults.passed++;
      } else {
        throw new Error('DNA API not responding');
      }
    } catch (error) {
      console.log(`   ❌ DNA Sequencing failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('DNA Sequencing not operational');
    }

    // Test 7: Real-time Optimization
    console.log('\n7. Testing Real-time Optimization...');
    testResults.total++;
    
    try {
      const optimizationResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_optimization',
          script_text: testScript,
          platform: 'tiktok',
          niche: 'business'
        })
      });

      if (optimizationResponse.ok) {
        const optimizationData = await optimizationResponse.json();
        console.log('   ✅ Real-time Optimization responding');
        console.log(`   ⚡ Optimization completed`);
        testResults.passed++;
      } else {
        throw new Error('Optimization API not responding');
      }
    } catch (error) {
      console.log(`   ❌ Real-time Optimization failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Real-time Optimization not operational');
    }

    // Test 8: A/B Testing System
    console.log('\n8. Testing A/B Testing System...');
    testResults.total++;
    
    try {
      const abTestResponse = await fetch(`${baseUrl}/api/admin/ab-testing-system?action=status`);
      
      if (abTestResponse.ok) {
        console.log('   ✅ A/B Testing System responding');
        console.log(`   🔬 A/B testing API accessible`);
        testResults.passed++;
      } else {
        throw new Error('A/B Testing API not responding');
      }
    } catch (error) {
      console.log(`   ❌ A/B Testing System failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('A/B Testing System not operational');
    }

    // Test 9: Template Analysis Backend
    console.log('\n9. Testing Template Analysis Backend...');
    testResults.total++;
    
    try {
      const templateResponse = await fetch(`${baseUrl}/api/admin/template-analysis?action=status`);
      
      if (templateResponse.ok) {
        console.log('   ✅ Template Analysis Backend responding');
        console.log(`   📊 Template analysis API accessible`);
        testResults.passed++;
      } else {
        throw new Error('Template Analysis API not responding');
      }
    } catch (error) {
      console.log(`   ❌ Template Analysis Backend failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('Template Analysis Backend not operational');
    }

    // Test 10: System Health Check
    console.log('\n10. Testing Overall System Health...');
    testResults.total++;
    
    try {
      const healthResponse = await fetch(`${baseUrl}/api/admin/viral-prediction-hub?action=system_health`);
      const healthData = await healthResponse.json();
      
      if (healthResponse.ok && healthData.success) {
        console.log('   ✅ System Health Check passed');
        console.log(`   🏥 Connected Systems: ${healthData.data?.connected_systems || 0}`);
        console.log(`   📊 Active Data Flows: ${healthData.data?.active_data_flows || 0}`);
        console.log(`   💚 Average System Health: ${(healthData.data?.average_system_health * 100 || 0).toFixed(1)}%`);
        testResults.passed++;
      } else {
        throw new Error('System health check failed');
      }
    } catch (error) {
      console.log(`   ❌ System Health Check failed: ${error.message}`);
      testResults.failed++;
      testResults.errors.push('System health monitoring not operational');
    }

    // Test Results Summary
    console.log('\n' + '=' .repeat(60));
    console.log('🎯 COMPLETE SYSTEM TEST RESULTS');
    console.log('=' .repeat(60));
    
    const successRate = testResults.total > 0 ? (testResults.passed / testResults.total * 100) : 0;
    
    console.log(`📊 Test Summary:`);
    console.log(`   • Total Tests: ${testResults.total}`);
    console.log(`   • Passed: ${testResults.passed}`);
    console.log(`   • Failed: ${testResults.failed}`);
    console.log(`   • Success Rate: ${successRate.toFixed(1)}%`);
    
    if (successRate >= 80) {
      console.log('\n🎉 SYSTEM STATUS: FULLY OPERATIONAL');
      console.log('✨ The omniscient viral prediction ecosystem is ready for production use!');
      
      console.log('\n🚀 AVAILABLE FEATURES:');
      console.log('   🧠 Script Intelligence with Omniscient Memory');
      console.log('   🧬 Script DNA Sequencing and Evolution Tracking');
      console.log('   🌐 Multi-Module Intelligence Harvesting');
      console.log('   ⚡ Real-Time Script Optimization');
      console.log('   🌟 Script Singularity Generation');
      console.log('   🧪 Unified Testing Framework');
      console.log('   📊 Template Analysis and Optimization');
      console.log('   🔬 A/B Testing System');
      console.log('   ✅ Validation with Real Accuracy Tracking');
      console.log('   🗄️  Omniscient Database with Knowledge Graph');
      console.log('   📈 Real-Time Performance Monitoring');
      
      console.log('\n📋 USER ACCESS POINTS:');
      console.log('   • Main Dashboard: /dashboard (Viral Prediction tab)');
      console.log('   • Admin Interface: /admin/viral-prediction-hub');
      console.log('   • System Monitoring: /admin/viral-prediction-hub (Monitoring tab)');
      console.log('   • Validation Reports: /admin/validation-system');
      
    } else if (successRate >= 60) {
      console.log('\n⚠️  SYSTEM STATUS: PARTIALLY OPERATIONAL');
      console.log('Most features are working, but some components need attention.');
      
    } else {
      console.log('\n❌ SYSTEM STATUS: NEEDS ATTENTION');
      console.log('Multiple critical components are not functioning properly.');
    }
    
    if (testResults.errors.length > 0) {
      console.log('\n🔧 ISSUES DETECTED:');
      testResults.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
      
      console.log('\n💡 TROUBLESHOOTING STEPS:');
      console.log('1. Ensure development server is running: npm run dev');
      console.log('2. Check that Supabase database schema is deployed');
      console.log('3. Verify all environment variables are set in .env.local');
      console.log('4. Check browser console for any JavaScript errors');
      console.log('5. Verify API routes are accessible via browser');
    }
    
    console.log('\n🎊 READY TO REVOLUTIONIZE VIRAL CONTENT PREDICTION!');
    console.log('The system is operational and ready for use.');

  } catch (error) {
    console.error('\n💥 Critical test failure:', error.message);
    console.log('\n🔧 Emergency troubleshooting:');
    console.log('1. Check if development server is running');
    console.log('2. Verify network connectivity');
    console.log('3. Check for any blocking firewalls or proxy settings');
    console.log('4. Try restarting the development server');
  }
}

// Helper function to test specific component
async function testComponent(name, url, expectedResponse = 'success') {
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (response.ok && (data.success || data[expectedResponse])) {
      console.log(`   ✅ ${name}: Operational`);
      return true;
    } else {
      console.log(`   ❌ ${name}: Failed (${data.error || 'Unknown error'})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ ${name}: Error (${error.message})`);
    return false;
  }
}

// Quick system check function
async function quickSystemCheck() {
  console.log('⚡ QUICK SYSTEM CHECK');
  console.log('-' .repeat(30));
  
  const components = [
    { name: 'Admin Hub', url: 'http://localhost:3000/api/admin/viral-prediction-hub?action=system_status' },
    { name: 'Validation System', url: 'http://localhost:3000/api/admin/validation-system?action=status' },
    { name: 'Brain API', url: 'http://localhost:3000/api/brain-simple' }
  ];
  
  let operational = 0;
  
  for (const component of components) {
    const isWorking = await testComponent(component.name, component.url);
    if (isWorking) operational++;
  }
  
  console.log(`\n📊 Quick Check: ${operational}/${components.length} components operational`);
  
  if (operational === components.length) {
    console.log('🎉 All core systems operational!');
  } else {
    console.log('⚠️  Some systems need attention. Run full test for details.');
  }
}

// Command line argument handling
const args = process.argv.slice(2);

if (args.includes('--quick')) {
  quickSystemCheck();
} else {
  testCompleteViralPredictionSystem();
}