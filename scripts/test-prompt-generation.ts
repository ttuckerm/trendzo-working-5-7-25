/**
 * Comprehensive Test for AI Video Prompt Generator
 * Tests: Basic generation, Smart detection, Genre override, DPS integration
 */

const BASE_URL = 'http://localhost:3001';

interface PromptGenerationResult {
  success: boolean;
  data: {
    cinematic_prompt: string;
    structured_data: any;
    reasoning: {
      detected_genre: string;
      detected_mood: string;
      detected_elements: string[];
      smart_analysis?: string;
    };
    dps_alignment: {
      predicted_elements: string[];
      expected_impact: number;
    };
  };
  error?: string;
}

console.log('\n🎬 TESTING AI VIDEO PROMPT GENERATOR\n');
console.log('═'.repeat(80));

async function testBasicGeneration() {
  console.log('\n📝 TEST 1: Basic Pattern Matching Generation');
  console.log('─'.repeat(80));

  const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'A haunted house on Halloween night',
      use_smart_detection: false,
    }),
  });

  const result: PromptGenerationResult = await response.json();

  if (!result.success) {
    console.error('❌ Test failed:', result.error);
    return false;
  }

  console.log('✅ Prompt generated successfully!');
  console.log(`\n📊 Detection Results:`);
  console.log(`   Genre: ${result.data.reasoning.detected_genre}`);
  console.log(`   Mood: ${result.data.reasoning.detected_mood}`);
  console.log(`\n✨ Cinematic Prompt (first 200 chars):`);
  console.log(`   ${result.data.cinematic_prompt.substring(0, 200)}...`);
  console.log(`\n📈 Expected DPS Impact: ${result.data.dps_alignment.expected_impact}`);

  if (result.data.reasoning.detected_genre !== 'horror') {
    console.error('❌ Expected genre "horror", got:', result.data.reasoning.detected_genre);
    return false;
  }

  return true;
}

async function testSmartDetection() {
  console.log('\n🧠 TEST 2: GPT-4o-mini Smart Detection');
  console.log('─'.repeat(80));

  const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'An emotional story about a person overcoming their fear of public speaking',
      use_smart_detection: true,
    }),
  });

  const result: PromptGenerationResult = await response.json();

  if (!result.success) {
    console.error('❌ Test failed:', result.error);
    return false;
  }

  console.log('✅ Smart detection successful!');
  console.log(`\n📊 AI Analysis Results:`);
  console.log(`   Genre: ${result.data.reasoning.detected_genre}`);
  console.log(`   Mood: ${result.data.reasoning.detected_mood}`);
  console.log(`   Elements: ${result.data.reasoning.detected_elements?.join(', ') || 'none'}`);
  if (result.data.reasoning.smart_analysis) {
    console.log(`   Analysis: ${result.data.reasoning.smart_analysis}`);
  }
  console.log(`\n✨ Cinematic Prompt (first 200 chars):`);
  console.log(`   ${result.data.cinematic_prompt.substring(0, 200)}...`);

  return true;
}

async function testGenreOverride() {
  console.log('\n🎯 TEST 3: Manual Genre Override');
  console.log('─'.repeat(80));

  const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'A funny video about cats',
      constraints: {
        genre_override: 'comedy',
      },
      use_smart_detection: false,
    }),
  });

  const result: PromptGenerationResult = await response.json();

  if (!result.success) {
    console.error('❌ Test failed:', result.error);
    return false;
  }

  console.log('✅ Genre override successful!');
  console.log(`\n📊 Detection Results:`);
  console.log(`   Genre: ${result.data.reasoning.detected_genre}`);
  console.log(`   Mood: ${result.data.reasoning.detected_mood}`);

  if (result.data.reasoning.detected_genre !== 'comedy') {
    console.error('❌ Expected genre "comedy", got:', result.data.reasoning.detected_genre);
    return false;
  }

  console.log(`\n✨ Cinematic Prompt (first 200 chars):`);
  console.log(`   ${result.data.cinematic_prompt.substring(0, 200)}...`);

  return true;
}

async function testDPSIntegration() {
  console.log('\n🎯 TEST 4: DPS Context Integration');
  console.log('─'.repeat(80));

  const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'How to make money with AI in 2025',
      dps_context: {
        target_score: 85,
        viral_patterns: ['Curiosity Gap', 'Pattern Interrupt', 'Social Currency'],
        niche: 'AI & Technology',
      },
      use_smart_detection: true,
    }),
  });

  const result: PromptGenerationResult = await response.json();

  if (!result.success) {
    console.error('❌ Test failed:', result.error);
    return false;
  }

  console.log('✅ DPS integration successful!');
  console.log(`\n📊 Detection Results:`);
  console.log(`   Genre: ${result.data.reasoning.detected_genre}`);
  console.log(`   Mood: ${result.data.reasoning.detected_mood}`);
  console.log(`\n📈 DPS Alignment:`);
  console.log(`   Expected Impact: ${result.data.dps_alignment.expected_impact}`);
  console.log(`   Viral Elements: ${result.data.dps_alignment.predicted_elements.join(', ')}`);
  console.log(`\n✨ Cinematic Prompt (first 300 chars):`);
  console.log(`   ${result.data.cinematic_prompt.substring(0, 300)}...`);

  // Check if viral patterns influenced the prompt
  const promptLower = result.data.cinematic_prompt.toLowerCase();
  const hasReveal = promptLower.includes('reveal');
  const hasDynamic = promptLower.includes('dynamic') || promptLower.includes('movement');

  console.log(`\n🔍 Viral Pattern Check:`);
  console.log(`   Contains "reveal" (Curiosity Gap): ${hasReveal ? '✅' : '❌'}`);
  console.log(`   Contains dynamic elements: ${hasDynamic ? '✅' : '❌'}`);

  return true;
}

async function testAllGenres() {
  console.log('\n🎨 TEST 5: All Genre Defaults');
  console.log('─'.repeat(80));

  const genres = ['horror', 'action', 'sci-fi', 'romance', 'documentary', 'comedy', 'drama', 'thriller'];
  const results: any[] = [];

  for (const genre of genres) {
    const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_input: `A ${genre} video concept`,
        constraints: { genre_override: genre },
        use_smart_detection: false,
      }),
    });

    const result: PromptGenerationResult = await response.json();

    if (result.success) {
      results.push({
        genre,
        detected: result.data.reasoning.detected_genre,
        dps: result.data.dps_alignment.expected_impact,
        hasLighting: result.data.cinematic_prompt.toLowerCase().includes('lighting'),
        hasCamera: result.data.cinematic_prompt.toLowerCase().includes('camera'),
        hasBGM: result.data.cinematic_prompt.toLowerCase().includes('bgm'),
      });
    }
  }

  console.log('\n📊 Genre Testing Results:\n');
  console.log('┌─────────────┬──────────────┬─────┬──────────┬────────┬─────┐');
  console.log('│ Genre       │ Detected     │ DPS │ Lighting │ Camera │ BGM │');
  console.log('├─────────────┼──────────────┼─────┼──────────┼────────┼─────┤');

  results.forEach((r) => {
    const genre = r.genre.padEnd(11);
    const detected = r.detected.padEnd(12);
    const dps = String(r.dps).padStart(3);
    const lighting = r.hasLighting ? '   ✅   ' : '   ❌   ';
    const camera = r.hasCamera ? '  ✅   ' : '  ❌   ';
    const bgm = r.hasBGM ? ' ✅ ' : ' ❌ ';
    console.log(`│ ${genre} │ ${detected} │ ${dps} │${lighting}│${camera}│${bgm}│`);
  });

  console.log('└─────────────┴──────────────┴─────┴──────────┴────────┴─────┘');

  const allPassed = results.every(r => r.hasLighting && r.hasCamera && r.hasBGM);
  console.log(allPassed ? '\n✅ All genres have complete prompts!' : '\n❌ Some genres missing components');

  return allPassed;
}

async function testSingleParagraph() {
  console.log('\n📝 TEST 6: Single Paragraph Format');
  console.log('─'.repeat(80));

  const response = await fetch(`${BASE_URL}/api/prompt-generation/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'Epic space battle',
      use_smart_detection: false,
    }),
  });

  const result: PromptGenerationResult = await response.json();

  if (!result.success) {
    console.error('❌ Test failed:', result.error);
    return false;
  }

  const hasNewlines = result.data.cinematic_prompt.includes('\n');

  console.log(hasNewlines ? '❌ Prompt contains line breaks!' : '✅ Prompt is single paragraph');
  console.log(`\n📏 Prompt length: ${result.data.cinematic_prompt.length} characters`);
  console.log(`\n✨ Full Prompt:\n`);
  console.log(result.data.cinematic_prompt);

  return !hasNewlines;
}

// Run all tests
(async () => {
  const results = {
    basic: await testBasicGeneration(),
    smart: await testSmartDetection(),
    override: await testGenreOverride(),
    dps: await testDPSIntegration(),
    genres: await testAllGenres(),
    paragraph: await testSingleParagraph(),
  };

  console.log('\n\n═'.repeat(80));
  console.log('🎯 FINAL RESULTS');
  console.log('═'.repeat(80));
  console.log();
  console.log(`   1. Basic Generation:      ${results.basic ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   2. Smart Detection:       ${results.smart ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   3. Genre Override:        ${results.override ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   4. DPS Integration:       ${results.dps ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   5. All Genres:            ${results.genres ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   6. Single Paragraph:      ${results.paragraph ? '✅ PASS' : '❌ FAIL'}`);
  console.log();

  const allPassed = Object.values(results).every(r => r);

  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! Prompt generator is production-ready.\n');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED. Review errors above.\n');
    process.exit(1);
  }
})();
