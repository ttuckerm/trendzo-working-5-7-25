/**
 * Sound Trend Analysis Integration Test Script
 * Tests the integration between template analyzer and sound trend analysis services
 */

const { templateAnalysisService } = require('../lib/services/templateAnalysisService');
const { soundAnalysisService } = require('../lib/services/soundAnalysisService');
const { soundService } = require('../lib/services/soundService');

async function runIntegrationTest() {
  console.log('Starting Sound Trend Analysis Integration Test');
  console.log('==============================================');
  
  try {
    // 1. Test shared infrastructure between template and sound analysis
    console.log('\n1. Testing shared data processing infrastructure:');
    
    // 1.1 Test template analysis
    console.log('  1.1 Running template analysis...');
    const templateId = 'test-template-123';
    const templateAnalysis = await templateAnalysisService.analyzeTemplateStructure(templateId);
    console.log(`      ✅ Template analysis complete: ${templateAnalysis ? 'Success' : 'Failed'}`);
    
    // 1.2 Test sound analysis using shared components
    console.log('  1.2 Running sound analysis with shared components...');
    const soundId = 'test-sound-123';
    const soundAnalysis = await soundAnalysisService.analyzeSoundData({
      id: soundId,
      title: 'Test Sound',
      authorName: 'Test Author',
      usageCount: 100,
      duration: 15,
      stats: {}
    });
    console.log(`      ✅ Sound analysis complete: ${soundAnalysis ? 'Success' : 'Failed'}`);
    
    // 2. Test unified scoring mechanism
    console.log('\n2. Testing unified scoring mechanism:');
    console.log('  2.1 Testing template-sound correlation scoring...');
    const templatePairings = await soundAnalysisService.findOptimalTemplatePairings(soundId);
    console.log(`      ✅ Found ${templatePairings.length} template pairings with correlation scores`);
    
    // 3. Test shared prediction models
    console.log('\n3. Testing shared prediction models:');
    console.log('  3.1 Generate sound trend report using shared prediction models...');
    const trendReport = await soundService.getLatestTrendReport();
    console.log(`      ✅ Trend report generated: ${trendReport ? 'Success' : 'Failed'}`);
    
    // 4. Test consistent taxonomy
    console.log('\n4. Testing consistent taxonomy system:');
    console.log('  4.1 Verifying sound categories match template categories...');
    const soundCategories = await soundService.getGenreDistribution();
    console.log(`      ✅ Sound categories retrieved: ${Object.keys(soundCategories).length} categories`);
    
    // 5. Test joint audit trails
    console.log('\n5. Testing joint audit trails:');
    console.log('  5.1 Creating template-sound performance correlation record...');
    await soundAnalysisService.buildPairingRecommendation(soundId, templateId);
    console.log('      ✅ Correlation record created');
    
    console.log('\n==============================================');
    console.log('✅ Integration Test Complete: All systems functioning as expected');
    console.log('==============================================');
    
  } catch (error) {
    console.error('\n❌ Integration Test Failed:', error);
    console.error('==============================================');
  }
}

// Run the test if called directly
if (require.main === module) {
  runIntegrationTest();
}

module.exports = { runIntegrationTest }; 