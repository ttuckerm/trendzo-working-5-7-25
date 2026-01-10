/**
 * Test script for unified grading
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { runUnifiedGrading } from '../src/lib/rubric-engine/unified-grading-runner';

async function main() {
  console.log('============================================');
  console.log('UNIFIED GRADING TEST');
  console.log('============================================');

  const testInput = {
    niche: 'fitness',
    goal: 'grow followers',
    transcript: `Have you ever wondered why your workouts are not giving you the results you want?
    Here is the secret that most trainers will not tell you. The key is not working harder,
    it is working smarter. Focus on compound movements and progressive overload.
    Your body adapts to stress, so you need to keep challenging it.
    Start with squats, deadlifts, and bench press. These three exercises alone will
    transform your physique if you do them consistently.
    Drop a comment if you want me to show you the perfect form for each one.`,
    feature_snapshot: {
      ffmpeg: { duration: 45, fps: 30, width: 1080, height: 1920 }
    }
  };

  console.log('\nInput:');
  console.log('- Niche:', testInput.niche);
  console.log('- Goal:', testInput.goal);
  console.log('- Transcript length:', testInput.transcript.length, 'chars');
  console.log('');

  console.log('Running unified grading with Gemini Flash...\n');

  const result = await runUnifiedGrading(testInput, { model: 'gemini-flash' });

  console.log('--- RESULTS ---');
  console.log('Success:', result.success);
  console.log('Model:', result.model);
  console.log('Latency:', result.latencyMs, 'ms');

  if (result.success && result.result) {
    const r = result.result;
    console.log('\n--- GRADING OUTPUT ---');
    console.log('Rubric Version:', r.rubric_version);
    console.log('Grader Confidence:', r.grader_confidence);
    console.log('');

    console.log('Style Classification:');
    console.log('  Label:', r.style_classification.label);
    console.log('  Confidence:', r.style_classification.confidence);
    console.log('');

    console.log('Idea Legos:');
    const legoCount = [r.idea_legos.lego_1, r.idea_legos.lego_2, r.idea_legos.lego_3,
                       r.idea_legos.lego_4, r.idea_legos.lego_5, r.idea_legos.lego_6,
                       r.idea_legos.lego_7].filter(Boolean).length;
    console.log('  Present:', legoCount, '/ 7');
    console.log('  Notes:', r.idea_legos.notes || '(none)');
    console.log('');

    console.log('Attribute Scores:');
    for (const attr of r.attribute_scores) {
      console.log(`  ${attr.attribute}: ${attr.score}/10`);
    }
    const avgAttr = r.attribute_scores.reduce((s, a) => s + a.score, 0) / r.attribute_scores.length;
    console.log('  Average:', avgAttr.toFixed(1));
    console.log('');

    console.log('Hook Analysis:');
    console.log('  Type:', r.hook.type);
    console.log('  Clarity:', r.hook.clarity_score);
    console.log('  Pattern:', r.hook.pattern);
    console.log('  Evidence:', r.hook.evidence?.substring(0, 100));
    console.log('');

    console.log('Additional Dimensions:');
    console.log('  Pacing:', r.pacing.score);
    console.log('  Clarity:', r.clarity.score);
    console.log('  Novelty:', r.novelty.score);
    console.log('');

    if (r.warnings.length > 0) {
      console.log('Warnings:', r.warnings.join(', '));
    }
    if (r.compliance_flags.length > 0) {
      console.log('Compliance Flags:', r.compliance_flags.join(', '));
    }

    console.log('\n--- STATUS: PASS ---');
  } else {
    console.log('\nError:', result.error);
    if (result.validationErrors) {
      console.log('Validation Errors:', result.validationErrors);
    }
    console.log('\n--- STATUS: FAIL ---');
  }

  console.log('============================================');
}

main().catch(console.error);
