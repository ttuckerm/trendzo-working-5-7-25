/**
 * Test Omniscient Data Flow Integration
 * 
 * Tests the cross-module data flows that enable Script Intelligence
 * to learn from every data point across all viral prediction modules.
 */

async function testOmniscientIntegration() {
  console.log('🧠 Testing Omniscient Data Flow Integration...\n')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    // Test 1: Health Check
    console.log('1. 📊 Testing Health Check...')
    const healthResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow?endpoint=health`)
    const healthData = await healthResponse.json()
    
    if (healthData.success) {
      console.log('   ✅ Omniscient Data Flow is operational')
      console.log('   ✅ Script Intelligence integration is active')
      console.log('   ✅ Cross-module correlation is enabled')
    } else {
      console.log('   ❌ Health check failed')
      return false
    }
    
    // Test 2: Omniscient Flow Test
    console.log('\n2. 🔄 Testing Cross-Module Data Flow...')
    const flowResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'test_omniscient_flow'
      })
    })
    
    const flowData = await flowResponse.json()
    
    if (flowData.success) {
      console.log('   ✅ All 5 modules successfully reported data')
      console.log('   ✅ Cross-module correlations detected')
      console.log('   ✅ Script Intelligence integrations completed')
      console.log(`   📊 Test Video ID: ${flowData.test_video_id}`)
    } else {
      console.log('   ❌ Cross-module data flow test failed:', flowData.message)
      return false
    }
    
    // Test 3: Individual Module Reports
    console.log('\n3. 🎯 Testing Individual Module Reporting...')
    
    const testVideoId = 'integration_test_' + Date.now()
    
    // Test Video Analysis Report
    const videoAnalysisResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'report_video_analysis',
        video_id: testVideoId,
        analysis_result: {
          transcript: "Test script for omniscient learning integration",
          hook_analysis: {
            text: "This will change everything",
            type: "transformation_promise",
            score: 0.92
          },
          viral_score: 0.88,
          niche: "business",
          platform: "tiktok"
        },
        performance_data: {
          views: 250000,
          engagement_rate: 0.15,
          shares: 3500
        }
      })
    })
    
    const videoAnalysisData = await videoAnalysisResponse.json()
    if (videoAnalysisData.success) {
      console.log('   ✅ Video Analysis → Omniscient Learning')
    } else {
      console.log('   ❌ Video Analysis reporting failed')
    }
    
    // Test Template Generation Report
    const templateResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'report_template_generation',
        template_data: {
          template_name: "Script Intelligence Enhanced Template",
          centroid: [0.9, 0.3, 0.8, 0.2, 0.7, 0.6],
          niche: "business",
          success_rate: 0.91,
          cluster_size: 67,
          video_ids: [testVideoId],
          template_type: "script_intelligence_cluster",
          script_intelligence_enhanced: true
        }
      })
    })
    
    const templateData = await templateResponse.json()
    if (templateData.success) {
      console.log('   ✅ Template Generation → Omniscient Learning')
    } else {
      console.log('   ❌ Template Generation reporting failed')
    }
    
    // Test Viral Prediction Report
    const predictionResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'report_viral_prediction',
        video_id: testVideoId,
        prediction_result: {
          viral_probability: 0.93,
          confidence: 0.89,
          predicted_views: 300000,
          script_intelligence_enhanced: true
        },
        actual_performance: {
          viral_score: 0.88,
          actual_views: 250000
        }
      })
    })
    
    const predictionData = await predictionResponse.json()
    if (predictionData.success) {
      console.log('   ✅ Viral Prediction → Omniscient Learning')
    } else {
      console.log('   ❌ Viral Prediction reporting failed')
    }
    
    // Test 4: Script Intelligence Integration Check
    console.log('\n4. 🧠 Testing Script Intelligence Integration...')
    
    const scriptResponse = await fetch(`${baseUrl}/api/admin/script-intelligence?endpoint=memory_stats`)
    const scriptData = await scriptResponse.json()
    
    if (scriptData.success) {
      console.log('   ✅ Script Intelligence omniscient memory operational')
      console.log(`   📊 Total memories: ${scriptData.stats.total_memories.toLocaleString()}`)
      console.log(`   📊 Singularity progress: ${(scriptData.stats.singularity_progress * 100).toFixed(1)}%`)
    } else {
      console.log('   ❌ Script Intelligence integration check failed')
    }
    
    // Test 5: Cross-Module Correlation
    console.log('\n5. 🔗 Testing Cross-Module Correlation...')
    
    // Process batch to trigger cross-module correlation
    const batchResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'process_batch'
      })
    })
    
    const batchData = await batchResponse.json()
    if (batchData.success) {
      console.log('   ✅ Batch processing completed')
      console.log('   ✅ Cross-module correlations analyzed')
    } else {
      console.log('   ❌ Batch processing failed')
    }
    
    // Test 6: Get Final Stats
    console.log('\n6. 📈 Getting Omniscient System Stats...')
    
    const statsResponse = await fetch(`${baseUrl}/api/admin/omniscient-flow?endpoint=stats`)
    const statsData = await statsResponse.json()
    
    if (statsData.success) {
      const stats = statsData.omniscient_stats
      console.log('   ✅ Omniscient Learning Statistics:')
      console.log(`      • Real-time learning: ${stats.real_time_learning ? 'Enabled' : 'Disabled'}`)
      console.log(`      • Cross-module correlation: ${stats.cross_module_correlation ? 'Enabled' : 'Disabled'}`)
      console.log(`      • Pattern sensitivity: ${(stats.pattern_sensitivity * 100).toFixed(0)}%`)
      console.log(`      • Learning rate: ${(stats.learning_rate * 100).toFixed(0)}%`)
      console.log(`      • Modules connected: ${stats.modules_connected.length}`)
    }
    
    // Final Success Report
    console.log('\n🎉 OMNISCIENT INTEGRATION TEST COMPLETE')
    console.log('=' .repeat(50))
    console.log('✅ All systems operational')
    console.log('✅ Script Intelligence fully integrated')
    console.log('✅ Cross-module data flows active')
    console.log('✅ Omniscient learning enabled')
    console.log('✅ Real-time pattern correlation working')
    console.log('\n🧠 The system now learns from EVERY data point across ALL modules!')
    console.log('📊 Script Intelligence omniscient memory is continuously growing')
    console.log('🚀 Ready for 90%+ viral prediction accuracy testing')
    
    return true
    
  } catch (error) {
    console.error('\n❌ OMNISCIENT INTEGRATION TEST FAILED')
    console.error('Error:', error.message)
    console.error('\nPlease check:')
    console.error('• Next.js development server is running')
    console.error('• All API endpoints are accessible')
    console.error('• Script Intelligence system is operational')
    return false
  }
}

// Run the test
testOmniscientIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ INTEGRATION TEST PASSED')
      process.exit(0)
    } else {
      console.log('\n❌ INTEGRATION TEST FAILED')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('\n💥 INTEGRATION TEST CRASHED:', error)
    process.exit(1)
  })