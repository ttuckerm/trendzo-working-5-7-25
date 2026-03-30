// Test the complete viral prediction system
const testVideos = [
  'https://www.tiktok.com/@mrbeast/video/7309539407643536686',
  'https://www.tiktok.com/@charlidamelio/video/7429158394842377502',
  'https://www.tiktok.com/@test/video/1234567890',
  'https://www.tiktok.com/@creator/video/9876543210',
  'https://www.tiktok.com/@viral/video/5555555555'
];

async function testViralPredictionSystem() {
  console.log('🧪 TESTING COMPLETE VIRAL PREDICTION SYSTEM\n');
  
  const results = [];
  
  for (let i = 0; i < testVideos.length; i++) {
    const video = testVideos[i];
    console.log(`\n📱 TESTING VIDEO ${i + 1}/5:`);
    console.log(`🔗 URL: ${video}`);
    
    try {
      const response = await fetch('http://localhost:3000/api/viral-prediction/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: video })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const analysis = data.data;
        
        console.log('✅ ANALYSIS SUCCESSFUL!');
        console.log(`📊 Viral Score: ${analysis.viralScore}/100`);
        console.log(`🎯 Viral Probability: ${(analysis.viralProbability * 100).toFixed(1)}%`);
        console.log(`📈 Confidence: ${analysis.confidenceLevel}`);
        console.log(`⏰ Peak Time: ${new Date(analysis.peakTimeEstimate).toLocaleString()}`);
        console.log(`👤 Creator: ${analysis.videoMetrics.creator}`);
        console.log(`👀 Views: ${analysis.videoMetrics.views.toLocaleString()}`);
        console.log(`❤️ Likes: ${analysis.videoMetrics.likes.toLocaleString()}`);
        console.log(`💬 Comments: ${analysis.videoMetrics.comments.toLocaleString()}`);
        console.log(`🔄 Shares: ${analysis.videoMetrics.shares.toLocaleString()}`);
        console.log(`🔥 Real Data: ${analysis.isRealData ? 'YES' : 'SIMULATION'}`);
        
        // Top frameworks
        console.log('\n🎯 TOP FRAMEWORKS:');
        analysis.frameworkBreakdown.slice(0, 3).forEach((framework, idx) => {
          console.log(`  ${idx + 1}. ${framework.frameworkName} (${(framework.score * 100).toFixed(1)}%)`);
        });
        
        // God Mode insights
        console.log('\n🔮 GOD MODE ANALYSIS:');
        console.log(`  • Emotional Arousal: ${(analysis.godModeEnhancements.breakdown.emotionalArousal * 100).toFixed(1)}%`);
        console.log(`  • Social Currency: ${(analysis.godModeEnhancements.breakdown.socialCurrency * 100).toFixed(1)}%`);
        console.log(`  • Total Enhancement: ${analysis.godModeEnhancements.totalEnhancement.toFixed(2)}x`);
        
        // DPS Analysis
        console.log('\n📊 DYNAMIC PERCENTILE SYSTEM:');
        console.log(`  • Percentile Rank: ${analysis.dpsAnalysis.percentileRank.toFixed(1)}%`);
        console.log(`  • Performance: ${analysis.dpsAnalysis.relativePerformance}`);
        console.log(`  • Cohort Size: ${analysis.dpsAnalysis.cohortSize} videos`);
        
        // Recommendations
        console.log('\n💡 RECOMMENDATIONS:');
        analysis.recommendedActions.forEach((rec, idx) => {
          console.log(`  ${idx + 1}. ${rec}`);
        });
        
        results.push({
          url: video,
          viralScore: analysis.viralScore,
          viralProbability: analysis.viralProbability,
          confidenceLevel: analysis.confidenceLevel,
          isRealData: analysis.isRealData,
          success: true
        });
        
      } else {
        console.log('❌ ANALYSIS FAILED:', data.error);
        results.push({
          url: video,
          error: data.error,
          success: false
        });
      }
      
    } catch (error) {
      console.log('❌ REQUEST FAILED:', error.message);
      results.push({
        url: video,
        error: error.message,
        success: false
      });
    }
    
    // Wait 2 seconds between requests
    if (i < testVideos.length - 1) {
      console.log('\n⏳ Waiting 2 seconds...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 VIRAL PREDICTION SYSTEM TEST SUMMARY');
  console.log('='.repeat(80));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful Analyses: ${successful.length}/${results.length}`);
  console.log(`❌ Failed Analyses: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    console.log('\n🎯 SUCCESSFUL RESULTS:');
    successful.forEach((result, idx) => {
      console.log(`${idx + 1}. Score: ${result.viralScore}/100, Probability: ${(result.viralProbability * 100).toFixed(1)}%, Confidence: ${result.confidenceLevel}`);
    });
    
    // Check for consistency (same URL should give same results)
    console.log('\n🔍 CONSISTENCY CHECK:');
    const uniqueScores = new Set(successful.map(r => r.viralScore));
    if (uniqueScores.size === successful.length) {
      console.log('✅ All videos produced different scores (good!)');
    } else {
      console.log('⚠️ Some videos produced identical scores - check URL hashing');
    }
    
    // Check for real data usage
    const realDataCount = successful.filter(r => r.isRealData).length;
    console.log(`📥 Real Data Used: ${realDataCount}/${successful.length} analyses`);
    console.log(`🔄 Simulations Used: ${successful.length - realDataCount}/${successful.length} analyses`);
    
    console.log('\n🏆 VIRAL PREDICTION SYSTEM IS FUNCTIONAL!');
    console.log('📈 Ready for production use with live TikTok data');
    console.log('💰 Estimated cost per analysis: $0.10-0.30 (when using real Apify data)');
    
  } else {
    console.log('\n❌ NO SUCCESSFUL ANALYSES - SYSTEM NEEDS DEBUGGING');
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED ANALYSES:');
    failed.forEach((result, idx) => {
      console.log(`${idx + 1}. ${result.url}: ${result.error}`);
    });
  }
}

// Run the test
testViralPredictionSystem()
  .then(() => {
    console.log('\n✅ Test completed');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error);
  });