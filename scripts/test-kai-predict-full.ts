/**
 * Full Kai Orchestrator prediction test - simulates the API route
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function main() {
  const startTime = Date.now();
  console.log('=== FULL KAI PREDICT TEST ===\n');

  // Input
  const transcript = 'This is a test video about making money online. Want to learn the secret? Follow for more!';
  const niche = 'Business';
  const goal = 'Engagement';
  const accountSize = 'Medium';

  try {
    // Step 2: Insert into video_files table
    console.log('Step 2: Inserting into video_files...');
    const { data: videoRecord, error: insertError } = await supabase
      .from('video_files')
      .insert({
        tiktok_url: null,
        storage_path: null,
        niche,
        goal,
        account_size_band: accountSize,
        platform: 'tiktok',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError || !videoRecord) {
      console.error('❌ Insert failed:', insertError?.message);
      return;
    }
    console.log('✅ Video record:', videoRecord.id);

    // Step 5: Initialize Kai Orchestrator and run prediction
    console.log('\nStep 5: Running Kai Orchestrator...');
    const { KaiOrchestrator } = await import('@/lib/orchestration/kai-orchestrator');
    const kai = new KaiOrchestrator();

    const predictionResult = await kai.predict(
      {
        videoId: videoRecord.id,
        transcript,
        title: '',
        description: '',
        hashtags: [],
        niche,
        goal,
        accountSize,
        videoPath: undefined,
        ffmpegData: null
      },
      'immediate-analysis'
    );

    if (!predictionResult.success) {
      console.error('❌ Prediction failed:', predictionResult.warnings);
      return;
    }

    console.log('✅ Prediction complete!');
    console.log('   DPS:', predictionResult.dps);
    console.log('   Confidence:', predictionResult.confidence);
    console.log('   Range:', predictionResult.range);
    console.log('   Viral Potential:', predictionResult.viralPotential);
    console.log('   Components:', predictionResult.componentsUsed.length);

    // Step 6: Generate cryptographic hash
    console.log('\nStep 6: Generating prediction hash...');
    const { PredictionHash } = await import('@/lib/services/prediction-hash');

    const hashPayload = {
      video_id: videoRecord.id,
      predicted_dps: predictionResult.dps,
      predicted_range: predictionResult.range as [number, number],
      confidence: predictionResult.confidence,
      model_version: 'kai_v1.0',
      top_features: predictionResult.componentsUsed.slice(0, 10).map((componentId, idx) => ({
        name: componentId,
        importance: 1.0 / (idx + 1),
        value: predictionResult.componentScores.get(componentId) || 0
      })),
      explanation: `Kai Orchestrator prediction using ${predictionResult.componentsUsed.length} components`,
      timestamp_utc: new Date().toISOString()
    };

    const hashResult = PredictionHash.generate(hashPayload);
    console.log('✅ Hash generated:', hashResult.hash.substring(0, 20) + '...');

    // Step 7: Insert frozen prediction into prediction_events
    console.log('\nStep 7: Inserting prediction event...');
    const { data: predictionEvent, error: predictionError } = await supabase
      .from('prediction_events')
      .insert({
        video_id: videoRecord.id,
        model_version: 'kai_v1.0',
        feature_snapshot: {
          components_used: predictionResult.componentsUsed,
          path_results: predictionResult.paths.map(p => ({
            path: p.path,
            prediction: p.aggregatedPrediction,
            confidence: p.aggregatedConfidence,
            success: p.success
          }))
        },
        predicted_dps: predictionResult.dps,
        predicted_dps_low: predictionResult.range[0],
        predicted_dps_high: predictionResult.range[1],
        confidence: predictionResult.confidence,
        explanation: `Kai Orchestrator: ${predictionResult.viralPotential} potential. Used ${predictionResult.componentsUsed.length} components.`,
        prediction_hash: hashResult.hash,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (predictionError || !predictionEvent) {
      console.error('❌ Insert prediction failed:', predictionError?.message);
      return;
    }
    console.log('✅ Prediction event:', predictionEvent.id);

    const totalTime = Date.now() - startTime;

    console.log('\n=== TEST COMPLETE ===');
    console.log('Total time:', totalTime, 'ms');
    console.log('Result:', {
      video_id: videoRecord.id,
      prediction_id: predictionEvent.id,
      predicted_dps: predictionResult.dps,
      confidence: predictionResult.confidence,
      viral_potential: predictionResult.viralPotential
    });

    // Cleanup
    console.log('\nCleaning up test data...');
    await supabase.from('prediction_events').delete().eq('id', predictionEvent.id);
    await supabase.from('video_files').delete().eq('id', videoRecord.id);
    console.log('✅ Cleanup complete');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

main().catch(console.error);
