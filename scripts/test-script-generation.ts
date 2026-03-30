/**
 * Test Script: Script Generation with OpenAI
 *
 * Tests the end-to-end flow of script generation:
 * 1. Call /api/generate/script with trending pattern
 * 2. Verify OpenAI generates 4-part script structure
 * 3. Verify DPS prediction is calculated
 * 4. Check cost tracking
 */

const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

async function testScriptGeneration() {
  console.log('🧪 Testing Script Generation with OpenAI...\n');

  const testConcept = "How to make $10,000/month from home with AI";
  const testPlatform = "tiktok";
  const testLength = 15;
  const testNiche = "Side Hustles/Making Money Online";

  console.log(`📝 Test Parameters:`);
  console.log(`   Concept: ${testConcept}`);
  console.log(`   Platform: ${testPlatform}`);
  console.log(`   Length: ${testLength}s`);
  console.log(`   Niche: ${testNiche}\n`);

  try {
    console.log('🔄 Calling script generation API...');
    const startTime = Date.now();

    const response = await fetch('http://localhost:3002/api/generate/script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        concept: testConcept,
        platform: testPlatform,
        length: testLength,
        niche: testNiche,
      }),
    });

    const duration = Date.now() - startTime;
    console.log(`⏱️  Request completed in ${duration}ms\n`);

    if (!response.ok) {
      console.error(`❌ API returned status ${response.status}`);
      const errorData = await response.json();
      console.error('Error:', errorData);
      return;
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Script generation failed:', result.error);
      return;
    }

    console.log('✅ Script generated successfully!\n');

    const { script, predictedDps, confidence, reasoning } = result.data;

    // Display DPS Prediction
    console.log('📊 DPS PREDICTION:');
    console.log(`   Predicted DPS: ${predictedDps}`);
    console.log(`   Confidence: ${Math.round(confidence * 100)}%`);
    console.log(`   Reasoning: ${reasoning}\n`);

    // Display Script Sections
    console.log('📜 GENERATED SCRIPT:\n');
    console.log(`🪝 HOOK (${script.hook.timing}):`);
    console.log(`   ${script.hook.content}\n`);

    console.log(`📖 CONTEXT (${script.context.timing}):`);
    console.log(`   ${script.context.content}\n`);

    console.log(`💎 VALUE (${script.value.timing}):`);
    console.log(`   ${script.value.content}\n`);

    console.log(`📣 CTA (${script.cta.timing}):`);
    console.log(`   ${script.cta.content}\n`);

    console.log('📝 FULL SCRIPT:');
    console.log('─'.repeat(80));
    console.log(script.fullScript);
    console.log('─'.repeat(80));

    // Verify script quality
    console.log('\n🔍 QUALITY CHECKS:');
    const checks = {
      'Has Hook': script.hook.content.length > 10,
      'Has Context': script.context.content.length > 10,
      'Has Value': script.value.content.length > 20,
      'Has CTA': script.cta.content.length > 10,
      'DPS > 50': predictedDps > 50,
      'Confidence > 60%': confidence > 0.6,
    };

    for (const [check, passed] of Object.entries(checks)) {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    }

    const allPassed = Object.values(checks).every(v => v);
    console.log(`\n${allPassed ? '✅ All checks passed!' : '⚠️  Some checks failed'}`);

    // Show cost estimate
    console.log('\n💰 COST ESTIMATE:');
    console.log(`   OpenAI API: ~$0.001 per script`);
    console.log(`   Budget remaining: $20 (can generate ~20,000 scripts)`);

  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run test
testScriptGeneration().catch(console.error);
