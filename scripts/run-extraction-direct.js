#!/usr/bin/env node

/**
 * Direct Enhanced Pattern Extraction (No API needed)
 * Runs extraction directly without requiring dev server
 */

require('dotenv').config({ path: '.env.local' });

// Check environment
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Missing OPENAI_API_KEY');
  process.exit(1);
}

console.log('\n' + '='.repeat(80));
console.log('🧬 DIRECT ENHANCED PATTERN EXTRACTION');
console.log('='.repeat(80) + '\n');

// Import extraction service
async function runExtraction() {
  try {
    // Dynamic import to handle ES modules
    const { extractEnhancedPatterns } = require('../src/lib/services/pattern-extraction/enhanced-extraction-service.ts');
    
    const result = await extractEnhancedPatterns({
      niche: 'personal-finance',
      minDPSScore: 70,
      dateRange: '365d',
      limit: 20
    });
    
    console.log('\n✅ EXTRACTION COMPLETE!\n');
    console.log('📊 Results:');
    console.log(`  - Videos Analyzed: ${result.totalVideosAnalyzed}`);
    console.log(`  - Patterns Extracted: ${result.patternsExtracted}`);
    console.log(`  - Batch ID: ${result.batchId}`);
    console.log(`  - LLM Calls: ${result.llmCallsCount}`);
    console.log(`  - Tokens Used: ${result.llmTokensUsed.toLocaleString()}`);
    console.log(`  - Cost: $${result.llmCostUsd.toFixed(4)}`);
    console.log(`  - Processing Time: ${(result.processingTimeMs / 1000).toFixed(1)}s`);

    if (result.patterns && result.patterns.length > 0) {
      console.log('\n🎯 Sample Patterns:\n');
      result.patterns.slice(0, 2).forEach((p, i) => {
        console.log(`${i + 1}. VIDEO: ${p.videoId} (DPS: ${p.dpsScore})`);
        console.log(`   Topic: ${p.topic}`);
        console.log(`   Angle: ${p.angle}`);
        console.log(`   Hook (Spoken): ${p.hookSpoken.substring(0, 80)}...`);
        console.log(`   Hook (Text): ${p.hookText}`);
        console.log(`   Hook (Visual): ${p.hookVisual}`);
        console.log('');
      });
    }
    
    console.log('✨ Patterns stored in video_patterns_detailed table!\n');
    
  } catch (error) {
    console.error('\n❌ Extraction failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

runExtraction();

