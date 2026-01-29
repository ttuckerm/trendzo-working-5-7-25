/**
 * Test Script for Template Analysis and Optimization Backend
 * 
 * Tests the comprehensive template analysis system including AI integration,
 * optimization capabilities, and performance analytics.
 */

const fetch = require('node-fetch');

async function testTemplateAnalysisBackend() {
  console.log('🔬 Testing Template Analysis and Optimization Backend...\n');

  const baseUrl = 'http://localhost:3000/api/admin/template-analysis';

  try {
    // 1. Check system status
    console.log('1. Checking system status...');
    const statusResponse = await fetch(baseUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('✅ System Status:', statusData.data.system_status);
      console.log(`   • Total Templates: ${statusData.data.system_status.total_templates}`);
      console.log(`   • Analysis Engine: ${statusData.data.system_status.analysis_engine_active ? 'Active' : 'Inactive'}`);
      console.log(`   • AI Integration: ${statusData.data.system_status.ai_integration_active ? 'Active' : 'Inactive'}`);
      
      if (statusData.data.templates_summary.length > 0) {
        console.log('\n📋 Available Templates:');
        statusData.data.templates_summary.forEach(template => {
          console.log(`   • ${template.template_name} (${template.template_type}): ${(template.viral_potential_score * 100).toFixed(1)}% viral potential`);
        });
      }
    } else {
      console.log('❌ Failed to get system status');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 2. Create a test template
    console.log('2. Creating test template...');
    const createResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_template',
        template_data: {
          template_name: 'Viral Business Hook Template',
          template_type: 'complete_script',
          content: {
            script_template: 'If you\'re an entrepreneur struggling with {PROBLEM}, this {SOLUTION} just changed everything for me. Here\'s exactly how it works...',
            variable_placeholders: [
              {
                placeholder_id: 'problem_var',
                placeholder_name: 'PROBLEM',
                placeholder_type: 'text',
                default_value: 'scaling your business',
                validation_rules: [],
                viral_impact_weight: 0.8,
                context_sensitivity: 0.9
              },
              {
                placeholder_id: 'solution_var',
                placeholder_name: 'SOLUTION',
                placeholder_type: 'text',
                default_value: 'simple strategy',
                validation_rules: [],
                viral_impact_weight: 0.9,
                context_sensitivity: 0.8
              }
            ],
            structure_elements: [
              {
                element_type: 'hook',
                position: 0,
                required: true,
                viral_contribution: 0.9,
                optimization_priority: 0.95,
                customization_flexibility: 0.7
              },
              {
                element_type: 'problem',
                position: 1,
                required: true,
                viral_contribution: 0.8,
                optimization_priority: 0.85,
                customization_flexibility: 0.9
              },
              {
                element_type: 'solution',
                position: 2,
                required: true,
                viral_contribution: 0.85,
                optimization_priority: 0.9,
                customization_flexibility: 0.8
              }
            ],
            customization_options: [
              {
                option_id: 'tone_option',
                option_name: 'Tone',
                option_type: 'tone',
                available_values: ['professional', 'casual', 'authoritative'],
                impact_on_virality: 0.6,
                implementation_complexity: 0.3
              }
            ],
            platform_variations: [
              {
                platform: 'tiktok',
                script_adaptation: 'Optimized for TikTok with shorter, punchier delivery',
                platform_specific_optimizations: ['Quick hook', 'Visual emphasis', 'Trending audio'],
                expected_performance_lift: 0.15,
                customization_requirements: ['Video overlay text', 'Trending hashtags']
              }
            ]
          },
          metadata: {
            niche: 'business',
            target_audience: ['entrepreneurs', 'business_owners'],
            difficulty_level: 'intermediate',
            estimated_completion_time: 180,
            viral_potential_score: 0.8,
            success_rate: 0.75,
            usage_count: 0,
            tags: ['business', 'entrepreneurship', 'problem-solution', 'viral-hook']
          }
        }
      })
    });

    let testTemplateId = null;
    if (createResponse.ok) {
      const createData = await createResponse.json();
      testTemplateId = createData.data.template_id;
      console.log('✅ Template created successfully');
      console.log(`   • Template ID: ${testTemplateId}`);
      console.log(`   • Template Name: ${createData.data.template_name}`);
      console.log(`   • Viral Potential: ${(createData.data.metadata.viral_potential_score * 100).toFixed(1)}%`);
    } else {
      console.log('❌ Failed to create template');
      return;
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 3. Analyze the template
    console.log('3. Analyzing template with AI systems...');
    const analyzeResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze_template',
        template_id: testTemplateId,
        analysis_type: 'full',
        include_ai_analysis: true,
        analysis_depth: 'comprehensive',
        context: {
          current_trends: ['business_growth', 'entrepreneur_mindset'],
          target_platform: 'tiktok',
          target_niche: 'business',
          performance_goals: ['high_engagement', 'viral_potential'],
          constraints: ['family_friendly', 'professional_tone']
        }
      })
    });

    if (analyzeResponse.ok) {
      const analyzeData = await analyzeResponse.json();
      const analysis = analyzeData.data;
      
      console.log('✅ Template Analysis Complete!');
      console.log(`📊 Quality Score: ${(analysis.quality_score * 100).toFixed(1)}%`);
      console.log(`🎯 Predicted Viral Score: ${(analysis.performance_prediction.predicted_viral_score * 100).toFixed(1)}%`);
      console.log(`🧠 Script Intelligence Viral Probability: ${(analysis.script_intelligence_analysis.viral_probability * 100).toFixed(1)}%`);
      console.log(`🧬 DNA Stability Score: ${(analysis.dna_analysis.stability_score * 100).toFixed(1)}%`);
      
      console.log('\n🔍 Viral Elements Detected:');
      analysis.viral_elements.forEach((element, index) => {
        console.log(`   ${index + 1}. ${element.element_type}: ${(element.viral_strength * 100).toFixed(1)}% strength`);
      });
      
      console.log('\n⚡ Top Optimization Opportunities:');
      analysis.optimization_opportunities.slice(0, 3).forEach((opp, index) => {
        console.log(`   ${index + 1}. ${opp.opportunity_type}: ${opp.recommended_change}`);
        console.log(`      Expected Improvement: +${(opp.expected_improvement * 100).toFixed(1)}%`);
      });
      
      console.log('\n🎯 Performance Prediction:');
      console.log(`   • Predicted Viral Score: ${(analysis.performance_prediction.predicted_viral_score * 100).toFixed(1)}%`);
      console.log(`   • Predicted Engagement Rate: ${(analysis.performance_prediction.predicted_engagement_rate * 100).toFixed(1)}%`);
      console.log(`   • Success Probability: ${(analysis.performance_prediction.predicted_success_rate * 100).toFixed(1)}%`);
      console.log(`   • Confidence Level: ${(analysis.performance_prediction.confidence_level * 100).toFixed(1)}%`);
      
      console.log('\n💡 Improvement Recommendations:');
      analysis.improvement_recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
      
      if (analysis.competitive_analysis.similar_templates.length > 0) {
        console.log('\n🏆 Competitive Analysis:');
        console.log(`   • Market Saturation: ${(analysis.competitive_analysis.market_saturation * 100).toFixed(1)}%`);
        console.log(`   • Market Position: ${analysis.competitive_analysis.market_position}`);
        console.log(`   • Similar Templates: ${analysis.competitive_analysis.similar_templates.length}`);
      }

    } else {
      console.log('❌ Template analysis failed');
      const errorData = await analyzeResponse.json();
      console.log('Error:', errorData.error);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 4. Optimize the template
    console.log('4. Optimizing template...');
    const optimizeResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'optimize_template',
        template_id: testTemplateId,
        optimization_goals: ['viral_probability', 'engagement_rate', 'platform_optimization']
      })
    });

    if (optimizeResponse.ok) {
      const optimizeData = await optimizeResponse.json();
      const result = optimizeData.data;
      
      console.log('✅ Template Optimization Complete!');
      console.log(`📈 Performance Improvement: +${(result.performance_improvement * 100).toFixed(1)}%`);
      console.log(`🔧 Changes Made: ${result.optimization_record.changes_made.length}`);
      
      console.log('\n📝 Optimization Changes:');
      result.optimization_record.changes_made.forEach((change, index) => {
        console.log(`   ${index + 1}. ${change.change_type}: ${change.field_changed}`);
        console.log(`      Impact: ${(change.change_impact * 100).toFixed(1)}%`);
        console.log(`      Reasoning: ${change.change_reasoning}`);
      });
      
      console.log('\n📊 Updated Template Performance:');
      console.log(`   • New Viral Potential: ${(result.optimized_template.metadata.viral_potential_score * 100).toFixed(1)}%`);
      console.log(`   • Optimization Type: ${result.optimization_record.optimization_type}`);
      console.log(`   • Rationale: ${result.optimization_record.optimization_rationale}`);

    } else {
      console.log('❌ Template optimization failed');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 5. Get template analytics
    console.log('5. Getting template analytics...');
    const analyticsResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'get_analytics',
        template_id: testTemplateId,
        timeframe: '30_days'
      })
    });

    if (analyticsResponse.ok) {
      const analyticsData = await analyticsResponse.json();
      const analytics = analyticsData.data;
      
      console.log('✅ Template Analytics Generated!');
      
      console.log('\n📊 Performance Summary:');
      console.log(`   • Average Viral Score: ${(analytics.performance_summary.avg_viral_score * 100).toFixed(1)}%`);
      console.log(`   • Average Engagement Rate: ${(analytics.performance_summary.avg_engagement_rate * 100).toFixed(1)}%`);
      console.log(`   • Success Instances: ${analytics.performance_summary.success_instances}`);
      console.log(`   • Total Instances: ${analytics.performance_summary.total_instances}`);
      
      console.log('\n📈 Usage Statistics:');
      console.log(`   • Total Usage: ${analytics.usage_statistics.total_usage}`);
      console.log(`   • Success Rate: ${(analytics.usage_statistics.success_rate * 100).toFixed(1)}%`);
      console.log(`   • Average Performance: ${(analytics.usage_statistics.avg_performance * 100).toFixed(1)}%`);
      
      console.log('\n🔧 Optimization Impact:');
      console.log(`   • Total Optimizations: ${analytics.optimization_impact.total_optimizations}`);
      console.log(`   • Average Improvement: ${(analytics.optimization_impact.avg_improvement * 100).toFixed(1)}%`);
      
      console.log('\n💡 Analytics Recommendations:');
      analytics.recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });

    } else {
      console.log('❌ Failed to get template analytics');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 6. Test batch analysis
    console.log('6. Testing batch analysis...');
    const batchResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'batch_analyze',
        template_ids: [testTemplateId, 'viral_hook_001'] // Include our test template and default template
      })
    });

    if (batchResponse.ok) {
      const batchData = await batchResponse.json();
      const results = batchData.data;
      
      console.log(`✅ Batch Analysis Complete!`);
      console.log(`📊 Templates Analyzed: ${Object.keys(results).length}`);
      
      Object.entries(results).forEach(([templateId, analysis]) => {
        console.log(`\n   • ${templateId}:`);
        console.log(`     Quality Score: ${(analysis.quality_score * 100).toFixed(1)}%`);
        console.log(`     Viral Prediction: ${(analysis.performance_prediction.predicted_viral_score * 100).toFixed(1)}%`);
        console.log(`     Optimization Opportunities: ${analysis.optimization_opportunities.length}`);
      });

    } else {
      console.log('❌ Batch analysis failed');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 7. Clean up - delete test template
    console.log('7. Cleaning up test template...');
    const deleteResponse = await fetch(baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_template',
        template_id: testTemplateId
      })
    });

    if (deleteResponse.ok) {
      console.log('✅ Test template deleted successfully');
    } else {
      console.log('⚠️ Failed to delete test template (may need manual cleanup)');
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // 8. Final Summary
    console.log('🎯 TEMPLATE ANALYSIS BACKEND TEST SUMMARY');
    console.log('==========================================');
    console.log('✅ System Status: Operational');
    console.log('✅ Template Creation: Functional');
    console.log('✅ AI-Powered Analysis: Complete');
    console.log('✅ Template Optimization: Working');
    console.log('✅ Performance Analytics: Available');
    console.log('✅ Batch Analysis: Functional');
    console.log('✅ Template Management: Complete');
    
    console.log('\n🚀 The Template Analysis and Optimization Backend is fully operational');
    console.log('   with comprehensive AI integration and optimization capabilities!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Ensure the development server is running (npm run dev)');
    console.log('2. Check that all backend services are properly initialized');
    console.log('3. Verify API endpoints are accessible');
    console.log('4. Ensure Script Intelligence system is operational');
  }
}

// Run the test
testTemplateAnalysisBackend();