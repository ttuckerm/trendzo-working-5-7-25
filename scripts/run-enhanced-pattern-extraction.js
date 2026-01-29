#!/usr/bin/env node

/**
 * Run Enhanced Pattern Extraction (v2)
 * Extracts detailed 9-field patterns for high-DPS videos
 */

const http = require('http');

console.log('\n' + '='.repeat(80));
console.log('🧬 ENHANCED PATTERN EXTRACTION (v2)');
console.log('   Extracts 9 detailed fields for EACH video');
console.log('='.repeat(80) + '\n');

const requestPayload = {
  niche: 'personal-finance',
  minDPSScore: 70,
  dateRange: '365d',
  limit: 20
};

console.log('📤 Request Payload:');
console.log(JSON.stringify(requestPayload, null, 2));
console.log('');

const data = JSON.stringify(requestPayload);

const options = {
  hostname: 'localhost',
  port: 3000,  // Dev server runs on port 3000 (see package.json "dev" script)
  path: '/api/patterns/extract-enhanced',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('🌐 Request URL: http://' + options.hostname + ':' + options.port + options.path);
console.log('');

const req = http.request(options, (res) => {
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(body);

      if (res.statusCode === 200 && response.success) {
        console.log('✅ EXTRACTION COMPLETE!\n');
        console.log('📊 Results:');
        console.log(`  - Videos Analyzed: ${response.totalVideosAnalyzed}`);
        console.log(`  - Patterns Extracted: ${response.patternsExtracted}`);
        console.log(`  - Batch ID: ${response.batchId}`);
        console.log(`  - LLM Calls: ${response.llmCallsCount}`);
        console.log(`  - Tokens Used: ${response.llmTokensUsed.toLocaleString()}`);
        console.log(`  - Cost: $${response.llmCostUsd.toFixed(4)}`);
        console.log(`  - Processing Time: ${(response.processingTimeMs / 1000).toFixed(1)}s`);

        if (response.patterns && response.patterns.length > 0) {
          console.log('\n🎯 Sample Patterns:\n');
          response.patterns.slice(0, 3).forEach((p, i) => {
            console.log(`${i + 1}. VIDEO: ${p.videoId} (DPS: ${p.dpsScore})`);
            console.log(`   Topic: ${p.topic}`);
            console.log(`   Angle: ${p.angle}`);
            console.log(`   Hook (Spoken): ${p.hookSpoken}`);
            console.log(`   Hook (Text): ${p.hookText}`);
            console.log(`   Hook (Visual): ${p.hookVisual}`);
            console.log(`   Story: ${p.storyStructure}`);
            console.log(`   Visuals: ${p.visualFormat}`);
            console.log(`   Key Elements: ${p.keyVisualElements.join(', ')}`);
            console.log(`   Audio: ${p.audioDescription}`);
            console.log('');
          });
        }

        console.log('✨ Enhanced patterns stored in viral_patterns.pattern_details (JSONB)!\n');
      } else {
        console.error('❌ Extraction failed:', response.error || response.message);
        if (response.details) {
          console.error('Details:', response.details);
        }
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
  console.log('  2. Database migration has been applied');
  console.log('  3. OPENAI_API_KEY is set in .env.local');
  process.exit(1);
});

console.log('⏳ Sending extraction request...\n');
req.write(data);
req.end();

