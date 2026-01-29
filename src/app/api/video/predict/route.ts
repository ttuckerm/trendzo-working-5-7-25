/**
 * Viral Prediction API Endpoint
 * 
 * Generates viral predictions for uploaded videos using ML models and feature analysis
 */

import { NextRequest, NextResponse } from 'next/server'
import ViralPredictionDB from '@/lib/database/supabase-viral-prediction'
import { FeatureExtractor } from '@/lib/services/feature-extractor'
import { ViralPredictionModel } from '@/lib/services/viral-prediction-model'

export async function POST(request: NextRequest) {
  try {
    const { videoId, videoUrl, platform } = await request.json()

    if (!videoId && !videoUrl) {
      return NextResponse.json(
        { error: 'Either videoId or videoUrl must be provided' },
        { status: 400 }
      )
    }

    console.log(`🧠 Generating viral prediction for video: ${videoId || 'URL'}`)

    let video = null
    if (videoId) {
      video = await ViralPredictionDB.getVideo(videoId)
      if (!video) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        )
      }
    }

    // Extract features from video
    console.log('🔬 Extracting features...')
    const features = platform 
      ? await FeatureExtractor.extractPlatformFeatures(videoUrl || video!.file_url!, platform)
      : await FeatureExtractor.extractAllFeatures(videoUrl || video!.file_url!)

    // Generate prediction using ML model
    console.log('🎯 Generating prediction...')
    const prediction = await ViralPredictionModel.predict(features)

    // Store prediction in database if we have a video record
    let predictionRecord = null
    if (videoId) {
      predictionRecord = await ViralPredictionDB.createPrediction({
        video_id: videoId,
        viral_probability: prediction.viralProbability,
        confidence_score: prediction.confidence,
        predicted_views: prediction.predictedViews,
        predicted_engagement_rate: prediction.predictedEngagement,
        hook_score: prediction.breakdown.hookScore,
        content_score: prediction.breakdown.contentScore,
        timing_score: prediction.breakdown.timingScore,
        platform_fit_score: prediction.breakdown.platformFitScore,
        model_version: prediction.modelVersion,
        model_confidence: prediction.confidence,
        prediction_factors: prediction.factors,
        prediction_date: new Date().toISOString()
      })
    }

    console.log(`✅ Prediction generated: ${(prediction.viralProbability * 100).toFixed(1)}% viral probability`)

    return NextResponse.json({
      success: true,
      prediction: {
        id: predictionRecord?.id,
        videoId: videoId,
        viralProbability: prediction.viralProbability,
        confidence: prediction.confidence,
        predictedViews: prediction.predictedViews,
        predictedEngagement: prediction.predictedEngagement,
        breakdown: prediction.breakdown,
        factors: prediction.factors,
        platformScore: 'platformScore' in features ? features.platformScore : undefined,
        recommendations: prediction.recommendations,
        riskAssessment: prediction.riskAssessment,
        modelVersion: prediction.modelVersion,
        processingTime: features.processingTime,
        createdAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Prediction API error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to generate prediction',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const limit = parseInt(searchParams.get('limit') || '10')
    const platform = searchParams.get('platform')

    if (videoId) {
      // Get specific prediction
      const prediction = await ViralPredictionDB.getPredictionByVideoId(videoId)
      
      if (!prediction) {
        return NextResponse.json(
          { error: 'Prediction not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        prediction
      })
    } else {
      // Get recent predictions
      const predictions = await ViralPredictionDB.getRecentPredictions(limit)
      
      // Filter by platform if specified
      const filteredPredictions = platform 
        ? predictions.filter((p: any) => p.videos?.platform === platform)
        : predictions

      return NextResponse.json({
        success: true,
        predictions: filteredPredictions,
        total: filteredPredictions.length
      })
    }

  } catch (error) {
    console.error('Get predictions error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to retrieve predictions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}