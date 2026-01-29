#!/usr/bin/env node

/**
 * FEAT-003: Pattern Extraction Test
 * Populates viral_patterns table for FEAT-007 predictions
 */

const http = require('http');

console.log('\n🧬 Testing Pattern Extraction (FEAT-003)\n');

const data = JSON.stringify({
  niche: 'personal-finance',
  minDPSScore: 70,
  dateRange: '90d'
});

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/patterns/extract',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(body);

      if (res.statusCode === 200) {
        console.log('✅ Pattern extraction completed!\n');
        console.log('📊 Results:');
        console.log(`  - Patterns Extracted: ${response.patternsExtracted}`);
        console.log(`  - Videos Analyzed: ${response.videosAnalyzed}`);
        console.log(`  - Niche: ${response.niche}`);

        if (response.patterns && response.patterns.length > 0) {
          console.log('\n🎯 Sample Patterns:');
          response.patterns.slice(0, 5).forEach(p => {
            console.log(`  - [${p.pattern_type}] ${p.pattern_description}`);
            console.log(`    Success Rate: ${(p.success_rate * 100).toFixed(1)}% | Avg DPS: ${p.avg_dps_score}`);
          });
        }

        console.log('\n✨ Patterns are now available for FEAT-007 predictions!\n');
      } else {
        console.error('❌ Pattern extraction failed:', response.error || response.message);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Failed to parse response:', body);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  console.log('\n💡 Make sure:');
  console.log('  1. Dev server is running (npm run dev)');
  console.log('  2. FEAT-003 API route exists');
  console.log('  3. You have scraped videos in database');
  process.exit(1);
});

console.log('Requesting pattern extraction for personal-finance niche...');
req.write(data);
req.end();
