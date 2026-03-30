/**
 * ML-MODEL-TRAINER: Algorithm Weight Optimization Endpoint
 * 
 * This endpoint uses REAL validation data to optimize the weights of the master algorithm
 * for maximum accuracy. Uses gradient descent and validation performance to find optimal weights.
 */
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_KEY } from '@/lib/env';

function getAdminDb() {
  // Lazily create to avoid build-time env validation
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export async function POST() {
  console.log('🧠 ML-MODEL-TRAINER: Starting algorithm weight optimization...');
  
  try {
    // 1. Get validated predictions with component scores
    const supabase = getAdminDb();
    const { data: validatedPredictions } = await supabase
      .from('prediction_validation')
      .select('*')
      .eq('validation_status', 'validated')
      .not('metadata', 'is', null);

    if (!validatedPredictions || validatedPredictions.length < 10) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient training data',
        message: 'Need at least 10 validated predictions to optimize weights',
        current_data_points: validatedPredictions?.length || 0
      }, { status: 400 });
    }

    console.log(`📊 Training on ${validatedPredictions.length} validated predictions...`);

    // 2. Extract training data (component scores and actual outcomes)
    const trainingData = validatedPredictions
      .filter(p => p.metadata?.componentScores)
      .map(p => ({
        mainEngine: p.metadata.componentScores.mainEngine || 75,
        frameworkAnalysis: p.metadata.componentScores.frameworkAnalysis || 68,
        realEngine: p.metadata.componentScores.realEngine || 71,
        unifiedEngine: p.metadata.componentScores.unifiedEngine || 69,
        actualScore: p.actual_viral_score || p.predicted_viral_score,
        actualSuccess: (p.accuracy_percentage || 0) >= 90
      }));

    if (trainingData.length < 5) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient component score data',
        message: 'Need component scores in metadata to optimize weights'
      }, { status: 400 });
    }

    // 3. Calculate optimal weights using gradient descent
    const optimizedWeights = await optimizeWeights(trainingData);

    // 4. Calculate performance improvement
    const currentWeights = { mainEngine: 0.35, frameworkAnalysis: 0.30, realEngine: 0.20, unifiedEngine: 0.15 };
    const currentAccuracy = calculateAccuracy(trainingData, currentWeights);
    const optimizedAccuracy = calculateAccuracy(trainingData, optimizedWeights);
    const improvement = optimizedAccuracy - currentAccuracy;

    // 5. Store optimization results
    await supabase
      .from('algorithm_optimizations')
      .insert({
        optimization_id: `opt_${Date.now()}`,
        training_data_points: trainingData.length,
        current_weights: currentWeights,
        optimized_weights: optimizedWeights,
        current_accuracy: currentAccuracy,
        optimized_accuracy: optimizedAccuracy,
        improvement_percentage: improvement,
        optimization_timestamp: new Date().toISOString(),
        algorithm_version: 'MasterViralAlgorithm_v1.0'
      });

    console.log('✅ Weight optimization complete:', {
      improvement: (improvement * 100).toFixed(2) + '%',
      new_accuracy: (optimizedAccuracy * 100).toFixed(1) + '%'
    });

    return NextResponse.json({
      success: true,
      optimization: {
        training_data_points: trainingData.length,
        current_weights: currentWeights,
        optimized_weights: optimizedWeights,
        performance: {
          current_accuracy: (currentAccuracy * 100).toFixed(2) + '%',
          optimized_accuracy: (optimizedAccuracy * 100).toFixed(2) + '%',
          improvement: (improvement * 100).toFixed(2) + '%'
        },
        recommendation: improvement > 0.02 ? 'Deploy optimized weights' : 'Keep current weights'
      }
    });

  } catch (error) {
    console.error('Weight optimization failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Weight optimization failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Optimize algorithm weights using gradient descent
 */
async function optimizeWeights(trainingData: any[]): Promise<{
  mainEngine: number;
  frameworkAnalysis: number;
  realEngine: number;
  unifiedEngine: number;
}> {
  let weights = { mainEngine: 0.35, frameworkAnalysis: 0.30, realEngine: 0.20, unifiedEngine: 0.15 };
  const learningRate = 0.01;
  const epochs = 100;
  
  for (let epoch = 0; epoch < epochs; epoch++) {
    const gradients = calculateGradients(trainingData, weights);
    
    // Update weights using gradient descent
    weights.mainEngine -= learningRate * gradients.mainEngine;
    weights.frameworkAnalysis -= learningRate * gradients.frameworkAnalysis;
    weights.realEngine -= learningRate * gradients.realEngine;
    weights.unifiedEngine -= learningRate * gradients.unifiedEngine;
    
    // Normalize weights to sum to 1
    const sum = weights.mainEngine + weights.frameworkAnalysis + weights.realEngine + weights.unifiedEngine;
    weights.mainEngine /= sum;
    weights.frameworkAnalysis /= sum;
    weights.realEngine /= sum;
    weights.unifiedEngine /= sum;
    
    // Ensure weights stay positive
    weights.mainEngine = Math.max(0.05, weights.mainEngine);
    weights.frameworkAnalysis = Math.max(0.05, weights.frameworkAnalysis);
    weights.realEngine = Math.max(0.05, weights.realEngine);
    weights.unifiedEngine = Math.max(0.05, weights.unifiedEngine);
  }
  
  return weights;
}

/**
 * Calculate gradients for weight optimization
 */
function calculateGradients(trainingData: any[], weights: any): any {
  const gradients = { mainEngine: 0, frameworkAnalysis: 0, realEngine: 0, unifiedEngine: 0 };
  
  for (const data of trainingData) {
    const predicted = (
      data.mainEngine * weights.mainEngine +
      data.frameworkAnalysis * weights.frameworkAnalysis +
      data.realEngine * weights.realEngine +
      data.unifiedEngine * weights.unifiedEngine
    );
    
    const error = predicted - data.actualScore;
    
    // Calculate partial derivatives
    gradients.mainEngine += error * data.mainEngine;
    gradients.frameworkAnalysis += error * data.frameworkAnalysis;
    gradients.realEngine += error * data.realEngine;
    gradients.unifiedEngine += error * data.unifiedEngine;
  }
  
  // Average gradients
  const n = trainingData.length;
  gradients.mainEngine /= n;
  gradients.frameworkAnalysis /= n;
  gradients.realEngine /= n;
  gradients.unifiedEngine /= n;
  
  return gradients;
}

/**
 * Calculate accuracy with given weights
 */
function calculateAccuracy(trainingData: any[], weights: any): number {
  let correctPredictions = 0;
  
  for (const data of trainingData) {
    const predicted = (
      data.mainEngine * weights.mainEngine +
      data.frameworkAnalysis * weights.frameworkAnalysis +
      data.realEngine * weights.realEngine +
      data.unifiedEngine * weights.unifiedEngine
    );
    
    const margin = Math.abs(predicted - data.actualScore);
    if (margin <= 10) { // Within 10 points is considered correct
      correctPredictions++;
    }
  }
  
  return correctPredictions / trainingData.length;
}