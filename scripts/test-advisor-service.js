#!/usr/bin/env node

/**
 * AdvisorService Test Script
 * Quick test to verify AdvisorService functionality
 */

const { execSync } = require('child_process');

async function testAdvisorService() {
  try {
    console.log('🎯 Testing AdvisorService API...\n');

    // Test data - draft missing some genes that a HOT template has
    const testData = {
      video_id: 'test-video-advisor-001',
      genes: Array(48).fill(false).map((_, i) => i % 10 === 0), // Every 10th gene true
      prediction: {
        probability: 0.65,
        closest_template: {
          id: 'template-authority-123',
          name: 'Authority Transformation Hook',
          status: 'HOT',
          distance: 0.30
        },
        enginesUsed: ['DNA_Detective', 'QuantumSwarmNexus']
      }
    };

    console.log('📋 Test Input:');
    console.log(`Video ID: ${testData.video_id}`);
    console.log(`Genes pattern: ${testData.genes.slice(0, 10).join('')}... (every 10th true)`);
    console.log(`Original probability: ${testData.prediction.probability}`);
    console.log(`Template: ${testData.prediction.closest_template.name} (${testData.prediction.closest_template.status})`);
    console.log('');

    console.log('✅ AdvisorService test data prepared');
    console.log('🚀 Ready for manual API testing');

    console.log('\nTo test the AdvisorService API manually:');
    console.log('1. Start the dev server: npm run dev');
    console.log('2. Check status: curl http://localhost:3000/api/advisor/advise?action=status');
    console.log('3. Make POST request with test data to: http://localhost:3000/api/advisor/advise');
    console.log('');
    console.log('Expected output:');
    console.log('- Template match analysis');
    console.log('- Missing gene detection');
    console.log('- Fix list with specific recommendations');
    console.log('- Updated probability estimate');

    return true;
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return false;
  }
}

testAdvisorService();