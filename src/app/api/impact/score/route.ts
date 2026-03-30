import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { ViralPredictionModel } from '@/lib/services/viral-prediction-model'
import type { ExtractedFeatures } from '@/lib/services/feature-extractor'

// Lightweight synthetic feature generator for server-side scoring
function generateSyntheticFeatures(platform: 'tiktok' | 'instagram' | 'youtube' | 'linkedin' = 'tiktok'): ExtractedFeatures {
  const isVertical = platform === 'tiktok' || platform === 'instagram'

  return {
    visual: {
      aspectRatio: isVertical ? 1080 / 1920 : 16 / 9,
      colorfulness: 0.65,
      brightness: 0.6,
      contrast: 0.7,
      dominantColors: ['rgb(224,32,160)', 'rgb(64,80,240)'],
      faceDetections: 2,
      objectDetections: 5,
      visualComplexity: 0.6,
      sceneVariety: 0.5
    },
    audio: {
      hasMusic: true,
      hasSpeech: true,
      volume: 0.7,
      tempo: 128,
      speechClarity: 0.82,
      silencePercentage: 0.08,
      audioQuality: 0.8,
      musicGenre: 'pop'
    },
    text: {
      hasTextOverlay: true,
      textDuration: 8,
      textDensity: 0.25,
      detectedText: ['How I grew to 10k in 30 days'],
      readabilityScore: 0.74,
      languageConfidence: 0.9
    },
    structural: {
      duration: 42,
      hookDuration: 2.8,
      sceneChanges: 6,
      pacing: 'fast',
      segments: [
        { type: 'hook', duration: 3, confidence: 0.85 },
        { type: 'build', duration: 30, confidence: 0.75 },
        { type: 'payoff', duration: 6, confidence: 0.7 },
        { type: 'cta', duration: 3, confidence: 0.65 }
      ],
      faceScreenTime: 48,
      textOverlayDuration: 10
    },
    content: {
      emotionalTone: {
        positive: 0.42,
        negative: 0.08,
        neutral: 0.22,
        surprise: 0.14,
        excitement: 0.14
      },
      complexityScore: 0.55,
      noveltyScore: 0.58,
      engagementTriggers: ['question_hook', 'surprising_fact', 'numbered_list'],
      contentCategory: 'education',
      viralElements: ['strong_hook', 'pattern_interrupt', 'text_overlay', 'quick_cuts']
    },
    mlVector: Array(90).fill(0),
    processingTime: 1200,
    extractionVersion: 'synthetic-1.0.0'
  }
}

function deriveLevel(score: number): { level: number; progress: number } {
  // Simple 5-level system; progress is percent to next level threshold
  const thresholds = [0, 40, 60, 75, 88, 100]
  let level = 0
  for (let i = 0; i < thresholds.length - 1; i++) {
    if (score >= thresholds[i] && score < thresholds[i + 1]) {
      level = i + 1
      const span = thresholds[i + 1] - thresholds[i]
      const progressed = score - thresholds[i]
      return { level, progress: Math.max(0, Math.min(100, Math.round((progressed / span) * 100))) }
    }
  }
  return { level: 5, progress: 100 }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const platform = (searchParams.get('platform') || 'tiktok') as 'tiktok' | 'instagram' | 'youtube' | 'linkedin'

    // In the future, accept a posted feature payload; for now, synthesize
    const features = generateSyntheticFeatures(platform)
    const prediction = await ViralPredictionModel.predict(features)

    const score = Math.round(prediction.breakdown.overallScore)
    const { level, progress } = deriveLevel(score)
    const auditId = randomUUID()

    return NextResponse.json(
      {
        success: true,
        auditId,
        platform,
        score,
        level,
        levelProgress: progress,
        prediction
      },
      {
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    )
  } catch (error) {
    console.error('Error computing impact score:', error)
    return NextResponse.json({ success: false, error: 'Failed to compute impact score' }, { status: 500 })
  }
}


