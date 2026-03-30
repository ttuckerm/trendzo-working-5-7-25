/**
 * Prediction Accuracy Validation Script
 *
 * Queries prediction_runs with status='completed' and calculates:
 * - Mean Absolute Error (MAE)
 * - Component-level accuracy analysis
 * - Over-prediction vs under-prediction breakdown
 *
 * Usage:
 *   npx ts-node scripts/validate-prediction-accuracy.ts
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false },
});

interface PredictionRun {
  id: string;
  video_id: string;
  predicted_dps: number;
  confidence: number;
  status: string;
  workflow: string;
  created_at: string;
  completed_at: string | null;
}

interface PredictionOutcome {
  video_id: string;
  actual_dps: number;
  views_7d: number;
  likes_7d: number;
  comments_7d: number;
  measured_at: string;
}

interface ComponentResult {
  run_id: string;
  component_id: string;
  prediction: number | null;
  confidence: number | null;
  success: boolean;
  latency_ms: number;
}

interface AccuracyStats {
  totalPredictions: number;
  predictionsWithOutcomes: number;
  mae: number; // Mean Absolute Error
  rmse: number; // Root Mean Square Error
  meanError: number; // Positive = over-prediction
  overPredictionCount: number;
  underPredictionCount: number;
  within5Points: number;
  within10Points: number;
  within15Points: number;
}

interface ComponentAccuracy {
  componentId: string;
  predictionCount: number;
  avgPrediction: number;
  avgError: number;
  mae: number;
  isOverPredictor: boolean;
}

async function main() {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('           PREDICTION ACCURACY VALIDATION REPORT');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Step 1: Query completed prediction_runs
  console.log('📊 Fetching completed prediction runs...');
  const { data: runs, error: runsError } = await supabase
    .from('prediction_runs')
    .select('*')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(500);

  if (runsError) {
    console.error('Error fetching prediction_runs:', runsError.message);
    return;
  }

  console.log(`   Found ${runs?.length || 0} completed predictions\n`);

  if (!runs || runs.length === 0) {
    console.log('No completed predictions found. Exiting.');
    return;
  }

  // Step 2: Check if prediction_outcomes table exists and fetch data
  console.log('📊 Checking for prediction outcomes...');
  const { data: outcomes, error: outcomesError } = await supabase
    .from('prediction_outcomes')
    .select('*');

  let outcomesMap = new Map<string, PredictionOutcome>();
  if (outcomesError) {
    console.log(`   ⚠️ prediction_outcomes table not available: ${outcomesError.message}`);
    console.log('   (Will analyze predictions without ground truth)\n');
  } else {
    console.log(`   Found ${outcomes?.length || 0} outcome records\n`);
    for (const outcome of outcomes || []) {
      outcomesMap.set(outcome.video_id, outcome);
    }
  }

  // Step 3: Fetch component results
  console.log('📊 Fetching component results...');
  const runIds = runs.map(r => r.id);
  const { data: componentResults, error: componentsError } = await supabase
    .from('run_component_results')
    .select('*')
    .in('run_id', runIds);

  if (componentsError) {
    console.log(`   ⚠️ Could not fetch component results: ${componentsError.message}\n`);
  } else {
    console.log(`   Found ${componentResults?.length || 0} component result records\n`);
  }

  // Step 4: Calculate overall accuracy stats
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    PREDICTION DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  const predictions = runs.map(r => r.predicted_dps);
  const avgPrediction = predictions.reduce((a, b) => a + b, 0) / predictions.length;
  const minPrediction = Math.min(...predictions);
  const maxPrediction = Math.max(...predictions);

  // Distribution buckets
  const buckets = {
    '0-30': 0,
    '31-50': 0,
    '51-60': 0,
    '61-70': 0,
    '71-80': 0,
    '81-100': 0,
  };

  for (const p of predictions) {
    if (p <= 30) buckets['0-30']++;
    else if (p <= 50) buckets['31-50']++;
    else if (p <= 60) buckets['51-60']++;
    else if (p <= 70) buckets['61-70']++;
    else if (p <= 80) buckets['71-80']++;
    else buckets['81-100']++;
  }

  console.log(`Total Predictions:  ${predictions.length}`);
  console.log(`Average DPS:        ${avgPrediction.toFixed(1)}`);
  console.log(`Min DPS:            ${minPrediction.toFixed(1)}`);
  console.log(`Max DPS:            ${maxPrediction.toFixed(1)}`);
  console.log('');
  console.log('Distribution:');
  console.log('─────────────────────────────────────────');
  for (const [range, count] of Object.entries(buckets)) {
    const pct = ((count / predictions.length) * 100).toFixed(1);
    const bar = '█'.repeat(Math.round(count / predictions.length * 40));
    console.log(`  ${range.padEnd(8)} │ ${String(count).padStart(4)} (${pct.padStart(5)}%) ${bar}`);
  }

  // Step 5: If we have outcomes, calculate accuracy metrics
  if (outcomesMap.size > 0) {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('                    ACCURACY METRICS');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    const matchedPredictions: Array<{ predicted: number; actual: number; videoId: string }> = [];

    for (const run of runs) {
      const outcome = outcomesMap.get(run.video_id);
      if (outcome) {
        matchedPredictions.push({
          predicted: run.predicted_dps,
          actual: outcome.actual_dps,
          videoId: run.video_id,
        });
      }
    }

    if (matchedPredictions.length > 0) {
      const errors = matchedPredictions.map(m => m.predicted - m.actual);
      const absErrors = errors.map(e => Math.abs(e));

      const mae = absErrors.reduce((a, b) => a + b, 0) / absErrors.length;
      const rmse = Math.sqrt(errors.map(e => e * e).reduce((a, b) => a + b, 0) / errors.length);
      const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
      const overCount = errors.filter(e => e > 0).length;
      const underCount = errors.filter(e => e < 0).length;
      const within5 = absErrors.filter(e => e <= 5).length;
      const within10 = absErrors.filter(e => e <= 10).length;
      const within15 = absErrors.filter(e => e <= 15).length;

      console.log(`Predictions with outcomes:  ${matchedPredictions.length}`);
      console.log('');
      console.log('Error Metrics:');
      console.log('─────────────────────────────────────────');
      console.log(`  Mean Absolute Error (MAE):  ${mae.toFixed(2)} DPS`);
      console.log(`  Root Mean Square Error:     ${rmse.toFixed(2)} DPS`);
      console.log(`  Mean Error (bias):          ${meanError >= 0 ? '+' : ''}${meanError.toFixed(2)} DPS ${meanError > 0 ? '⚠️ OVER-PREDICTING' : meanError < 0 ? '📉 Under-predicting' : '✅ Balanced'}`);
      console.log('');
      console.log('Direction Analysis:');
      console.log('─────────────────────────────────────────');
      console.log(`  Over-predictions:    ${overCount} (${((overCount / matchedPredictions.length) * 100).toFixed(1)}%)`);
      console.log(`  Under-predictions:   ${underCount} (${((underCount / matchedPredictions.length) * 100).toFixed(1)}%)`);
      console.log('');
      console.log('Accuracy Thresholds:');
      console.log('─────────────────────────────────────────');
      console.log(`  Within ±5 DPS:   ${within5} (${((within5 / matchedPredictions.length) * 100).toFixed(1)}%)`);
      console.log(`  Within ±10 DPS:  ${within10} (${((within10 / matchedPredictions.length) * 100).toFixed(1)}%)`);
      console.log(`  Within ±15 DPS:  ${within15} (${((within15 / matchedPredictions.length) * 100).toFixed(1)}%)`);

      // Show worst predictions
      console.log('\n═══════════════════════════════════════════════════════════════════');
      console.log('                    WORST PREDICTIONS');
      console.log('═══════════════════════════════════════════════════════════════════\n');

      const sorted = [...matchedPredictions].sort((a, b) => Math.abs(b.predicted - b.actual) - Math.abs(a.predicted - a.actual));
      const worst10 = sorted.slice(0, 10);

      console.log('Video ID'.padEnd(40) + 'Predicted'.padStart(12) + 'Actual'.padStart(10) + 'Error'.padStart(10));
      console.log('─'.repeat(72));
      for (const m of worst10) {
        const error = m.predicted - m.actual;
        console.log(`${m.videoId.substring(0, 38).padEnd(40)}${m.predicted.toFixed(1).padStart(12)}${m.actual.toFixed(1).padStart(10)}${(error >= 0 ? '+' : '') + error.toFixed(1).padStart(9)}`);
      }
    } else {
      console.log('No matching predictions and outcomes found.');
    }
  }

  // Step 6: Component-level analysis
  if (componentResults && componentResults.length > 0) {
    console.log('\n═══════════════════════════════════════════════════════════════════');
    console.log('                    COMPONENT ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════════\n');

    // Group by component
    const componentStats = new Map<string, { predictions: number[]; successes: number; failures: number }>();

    for (const cr of componentResults) {
      if (!componentStats.has(cr.component_id)) {
        componentStats.set(cr.component_id, { predictions: [], successes: 0, failures: 0 });
      }
      const stats = componentStats.get(cr.component_id)!;
      if (cr.success && cr.prediction !== null) {
        stats.predictions.push(cr.prediction);
        stats.successes++;
      } else {
        stats.failures++;
      }
    }

    // Sort by average prediction (to find over-predictors)
    const componentList = Array.from(componentStats.entries())
      .filter(([_, stats]) => stats.predictions.length > 0)
      .map(([id, stats]) => ({
        id,
        count: stats.predictions.length,
        avg: stats.predictions.reduce((a, b) => a + b, 0) / stats.predictions.length,
        min: Math.min(...stats.predictions),
        max: Math.max(...stats.predictions),
        successRate: stats.successes / (stats.successes + stats.failures),
      }))
      .sort((a, b) => b.avg - a.avg);

    console.log('Component'.padEnd(25) + 'Count'.padStart(8) + 'Avg DPS'.padStart(10) + 'Min'.padStart(8) + 'Max'.padStart(8) + 'Success%'.padStart(10));
    console.log('─'.repeat(69));

    for (const c of componentList) {
      const flag = c.avg > 70 ? ' ⚠️ HIGH' : c.avg < 40 ? ' 📉 LOW' : '';
      console.log(
        `${c.id.substring(0, 23).padEnd(25)}${String(c.count).padStart(8)}${c.avg.toFixed(1).padStart(10)}${c.min.toFixed(1).padStart(8)}${c.max.toFixed(1).padStart(8)}${(c.successRate * 100).toFixed(0).padStart(9)}%${flag}`
      );
    }

    // Identify potential over-predictors
    const overPredictors = componentList.filter(c => c.avg > avgPrediction + 10);
    if (overPredictors.length > 0) {
      console.log('\n⚠️  POTENTIAL OVER-PREDICTORS (avg > system avg + 10):');
      for (const op of overPredictors) {
        console.log(`   - ${op.id}: avg ${op.avg.toFixed(1)} DPS (system avg: ${avgPrediction.toFixed(1)})`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                    RECOMMENDATIONS');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  // Generate recommendations based on analysis
  if (avgPrediction > 65) {
    console.log('1. ⚠️  Average prediction is high (>65). Consider:');
    console.log('   - Increasing conservative scaling factor in prediction-calibrator.ts');
    console.log('   - Reducing weight of high-predicting components (gemini, gpt4)');
    console.log('   - Adding Rule 4 scaling if not already present');
  }

  if (buckets['71-80'] + buckets['81-100'] > predictions.length * 0.3) {
    console.log('2. ⚠️  Over 30% of predictions are >70 DPS. This suggests:');
    console.log('   - LLM components may be too optimistic');
    console.log('   - Consider adding component-specific calibration');
  }

  console.log('\n✅ Validation complete.\n');
}

main().catch(console.error);
