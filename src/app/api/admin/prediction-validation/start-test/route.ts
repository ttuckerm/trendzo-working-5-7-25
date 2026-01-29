import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_ANON_KEY } from '@/lib/env'

// Sample viral videos for initial testing
const SAMPLE_VIDEOS = [
  {
    video_id: 'test_001',
    platform: 'tiktok',
    niche: 'fitness',
    title: 'POV: You discover the perfect workout routine',
    description: 'This workout changed my life in 30 days',
    views: 2400000,
    likes: 180000,
    comments: 12000,
    shares: 45000,
    viral_score: 0.89
  },
  {
    video_id: 'test_002',
    platform: 'tiktok',
    niche: 'business',
    title: '3 business tips that made me $100K',
    description: 'Simple strategies anyone can use',
    views: 1800000,
    likes: 145000,
    comments: 8900,
    shares: 32000,
    viral_score: 0.82
  },
  {
    video_id: 'test_003',
    platform: 'tiktok',
    niche: 'food',
    title: 'This recipe will change your life',
    description: 'Secret ingredient revealed',
    views: 3200000,
    likes: 240000,
    comments: 15000,
    shares: 58000,
    viral_score: 0.93
  },
  {
    video_id: 'test_004',
    platform: 'tiktok',
    niche: 'beauty',
    title: 'Skincare routine for perfect skin',
    description: '5 steps to glowing skin',
    views: 1500000,
    likes: 98000,
    comments: 6700,
    shares: 28000,
    viral_score: 0.76
  },
  {
    video_id: 'test_005',
    platform: 'tiktok',
    niche: 'entertainment',
    title: 'Mind-blowing magic trick revealed',
    description: 'You won\'t believe how simple this is',
    views: 4100000,
    likes: 320000,
    comments: 22000,
    shares: 85000,
    viral_score: 0.96
  }
];

async function runPredictionEngine(video: any, engineName: string) {
  // Simulate different engine performance characteristics
  const engineFactors = {
    'DNA_Detective': { accuracy: 0.72, bias: -0.05 },
    'QuantumSwarmNexus': { accuracy: 0.89, bias: 0.02 },
    'MetaFusionMesh': { accuracy: 0.91, bias: 0.01 },
    'TemporalGraphProphet': { accuracy: 0.84, bias: -0.02 }
  };

  const engine = engineFactors[engineName as keyof typeof engineFactors];
  if (!engine) return null;

  // Add some realistic variance to predictions
  const baseAccuracy = engine.accuracy;
  const variance = (Math.random() - 0.5) * 0.1; // ±5% variance
  const engineAccuracy = Math.max(0.1, Math.min(0.99, baseAccuracy + variance));

  // Calculate prediction based on actual viral score with engine bias
  const actualScore = video.viral_score;
  const predictedScore = Math.max(0.1, Math.min(0.99, 
    actualScore + engine.bias + (Math.random() - 0.5) * 0.15
  ));

  // Calculate confidence score
  const confidenceScore = Math.max(0.6, Math.min(0.95, 
    baseAccuracy + (Math.random() - 0.5) * 0.1
  ));

  return {
    predicted_probability: predictedScore,
    confidence_score: confidenceScore,
    engine_accuracy: engineAccuracy
  };
}

function getDb(){
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY)
}

export async function POST(request: Request) {
  try {
    const { test_count = 50, test_type = 'baseline' } = await request.json();
    const supabase = getDb();

    const engines = ['DNA_Detective', 'QuantumSwarmNexus', 'MetaFusionMesh', 'TemporalGraphProphet'];
    const results = [];

    // Generate test predictions
    for (let i = 0; i < Math.min(test_count, 50); i++) {
      const video = SAMPLE_VIDEOS[i % SAMPLE_VIDEOS.length];
      const engine = engines[i % engines.length];
      
      const prediction = await runPredictionEngine(video, engine);
      if (!prediction) continue;

      const predictionRecord = {
        id: `test_pred_${Date.now()}_${i}`,
        video_id: `${video.video_id}_${i}`,
        predicted_probability: prediction.predicted_probability,
        prediction_engine: engine,
        prediction_timestamp: new Date().toISOString(),
        actual_viral_score: video.viral_score,
        validation_timestamp: new Date().toISOString(),
        accuracy_score: 1 - Math.abs(prediction.predicted_probability - video.viral_score),
        niche: video.niche,
        platform: video.platform,
        confidence_score: prediction.confidence_score
      };

      results.push(predictionRecord);

      // Insert prediction into database
      const { error: insertError } = await supabase
        .from('prediction_validations')
        .insert(predictionRecord);

      if (insertError) {
        console.error('Error inserting prediction:', insertError);
      }
    }

    // Calculate and store accuracy metrics
    for (const engine of engines) {
      const engineResults = results.filter(r => r.prediction_engine === engine);
      if (engineResults.length === 0) continue;

      const totalPredictions = engineResults.length;
      const accurateCount = engineResults.filter(r => r.accuracy_score && r.accuracy_score >= 0.7).length;
      const accuracyPercentage = accurateCount / totalPredictions;
      const avgConfidence = engineResults.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / totalPredictions;

      const accuracyMetric = {
        engine_name: engine,
        time_period: 'daily',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        total_predictions: totalPredictions,
        accurate_predictions: accurateCount,
        accuracy_percentage: accuracyPercentage,
        avg_confidence_score: avgConfidence,
        niche_breakdown: engineResults.reduce((acc, r) => {
          acc[r.niche] = (acc[r.niche] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      };

      const { error: metricError } = await supabase
        .from('accuracy_metrics')
        .insert(accuracyMetric);

      if (metricError) {
        console.error('Error inserting accuracy metric:', metricError);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Started test with ${results.length} predictions`,
      predictions_created: results.length,
      engines_tested: engines,
      test_type
    });

  } catch (error) {
    console.error('Error starting test predictions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to start test predictions' },
      { status: 500 }
    );
  }
}


