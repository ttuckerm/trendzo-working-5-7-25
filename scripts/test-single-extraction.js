#!/usr/bin/env node
/**
 * Test knowledge extraction on a single mega-viral video
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const VIDEO_ID = '7555561758342073614'; // Mega-viral video with 681-char transcript

async function testExtraction() {
  console.log('🚀 Testing knowledge extraction...\n');
  console.log(`Video ID: ${VIDEO_ID}`);

  const startTime = Date.now();

  try {
    const response = await fetch('http://localhost:3000/api/knowledge/extract', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_id: VIDEO_ID
      })
    });

    const elapsed = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ HTTP ${response.status}: ${errorText}`);
      process.exit(1);
    }

    const result = await response.json();

    console.log('\n✅ Extraction successful!\n');
    console.log('RESPONSE STRUCTURE:');
    console.log('-------------------');
    console.log(`Success: ${result.success}`);
    console.log(`Extraction ID: ${result.extraction_id || 'N/A'}`);
    console.log(`Processing Time: ${result.processing_time_ms || elapsed}ms`);
    console.log(`LLM Agreement: ${result.llm_agreement || 'N/A'}`);
    console.log(`Confidence: ${result.confidence || 'N/A'}`);

    if (result.consensus_insights) {
      console.log('\nCONSENSUS INSIGHTS:');
      console.log('-------------------');
      const insights = result.consensus_insights;

      if (insights.viral_hooks) {
        console.log(`\n📌 Viral Hooks (${insights.viral_hooks.length}):`);
        insights.viral_hooks.forEach((hook, i) => {
          console.log(`   ${i + 1}. ${hook}`);
        });
      }

      if (insights.emotional_triggers) {
        console.log(`\n💥 Emotional Triggers (${insights.emotional_triggers.length}):`);
        insights.emotional_triggers.forEach((trigger, i) => {
          console.log(`   ${i + 1}. ${trigger}`);
        });
      }

      if (insights.content_structure) {
        console.log(`\n🏗️  Content Structure:`);
        console.log(`   ${insights.content_structure}`);
      }

      if (insights.pattern_type) {
        console.log(`\n🎯 Pattern Type: ${insights.pattern_type}`);
      }
    }

    if (result.individual_analyses) {
      console.log('\n\nINDIVIDUAL LLM ANALYSES:');
      console.log('------------------------');
      const analyses = result.individual_analyses;

      if (analyses.gpt4_analysis) console.log('✅ GPT-4 analysis present');
      if (analyses.claude_analysis) console.log('✅ Claude analysis present');
      if (analyses.gemini_analysis) console.log('✅ Gemini analysis present');
    }

    // Validation checks
    console.log('\n\nVALIDATION CHECKS:');
    console.log('------------------');

    const checks = [
      { name: 'All 3 LLMs returned data', pass: result.individual_analyses?.gpt4_analysis && result.individual_analyses?.claude_analysis && result.individual_analyses?.gemini_analysis },
      { name: 'Consensus insights exist', pass: !!result.consensus_insights },
      { name: 'LLM agreement > 0.7', pass: (result.llm_agreement || 0) > 0.7 },
      { name: 'Processing time < 10s', pass: (result.processing_time_ms || elapsed) < 10000 },
      { name: 'Viral hooks extracted', pass: result.consensus_insights?.viral_hooks?.length > 0 },
      { name: 'Emotional triggers found', pass: result.consensus_insights?.emotional_triggers?.length > 0 },
    ];

    checks.forEach(check => {
      console.log(`${check.pass ? '✅' : '❌'} ${check.name}`);
    });

    const allPassed = checks.every(c => c.pass);

    if (allPassed) {
      console.log('\n🎉 ALL VALIDATION CHECKS PASSED!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some validation checks failed. Review above.\n');
      process.exit(1);
    }

  } catch (err) {
    console.error('❌ Request failed:', err.message);
    process.exit(1);
  }
}

testExtraction();
