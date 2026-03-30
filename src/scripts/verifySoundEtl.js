// Simple script to verify sound ETL functionality by calling the API endpoints
const fs = require('fs');
const http = require('http');

function get(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

async function verifySoundEtl() {
  try {
    console.log('Verifying Sound ETL functionality...');
    
    // 1. Check trending sounds API - should return sounds with growth metrics
    console.log('\n1. Checking trending sounds API...');
    const trendingResult = await get('http://localhost:3004/api/sounds/trending');
    console.log(`Found ${trendingResult.count} trending sounds`);
    
    // Verify growth metrics are present
    const firstSound = trendingResult.sounds[0];
    console.log('First sound:', {
      id: firstSound.id,
      title: firstSound.title,
      usageCount: firstSound.usageCount,
      growth: firstSound.stats.growth
    });
    
    // Write results to a file for inspection
    fs.writeFileSync('sound-etl-verification.json', JSON.stringify({
      trendingSounds: trendingResult,
    }, null, 2));
    
    console.log('\nVerification completed! Results written to sound-etl-verification.json');
    
  } catch (error) {
    console.error('Error verifying Sound ETL:', error);
  }
}

verifySoundEtl(); 