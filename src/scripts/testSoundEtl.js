// Run with: npx tsx src/scripts/testSoundEtl.js
import { soundEtl } from '../lib/etl/soundEtl.ts';
import { db } from '../lib/firebase/firebase.ts';

async function testSoundEtl() {
  try {
    console.log('Testing Sound ETL functions...');
    
    // Get the test data we created earlier
    const testSounds = [
      { id: 'viral_dance_beat' },
      { id: 'funny_voice_effect' },
      { id: 'trending_pop_song' },
      { id: 'original_sound_mix' },
      { id: 'remix_viral_track' }
    ];
    
    console.log('Calculating growth metrics...');
    // Test calculateGrowthMetrics
    const metricsResult = await soundEtl.calculateGrowthMetrics(testSounds);
    console.log('Growth metrics result:', metricsResult);
    
    console.log('Updating template correlations...');
    // Test updateTemplateCorrelations
    const correlationsResult = await soundEtl.updateTemplateCorrelations(testSounds);
    console.log('Template correlations result:', correlationsResult);
    
    console.log('Generating sound trend report...');
    // Test generateSoundTrendReport
    const reportResult = await soundEtl.generateSoundTrendReport();
    console.log('Generated sound trend report');
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Error in Sound ETL test:', error);
  }
}

testSoundEtl(); 