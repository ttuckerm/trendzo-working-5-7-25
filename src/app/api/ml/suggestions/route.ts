import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { mlPredictionService } from '@/lib/services/mlPredictionService';
import { TrendPrediction, ManualAdjustmentLog } from '@/lib/types/trendingTemplate';

/**
 * API endpoint to get ML-based suggestions for trend predictions
 * 
 * Query Parameters:
 * - templateId: ID of the template to get suggestions for
 * - category: Filter suggestions by category
 * 
 * This endpoint is enterprise-tier restricted
 */
export async function GET(request: NextRequest) {
  try {
    // For development, bypass authentication and use mock data
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 [DEV MODE] Using mock ML suggestions");
      
      // Parse query parameters
      const { searchParams } = new URL(request.url);
      const templateId = searchParams.get('templateId');
      const category = searchParams.get('category');
      
      if (!templateId) {
        return NextResponse.json(
          { error: 'Template ID is required' },
          { status: 400 }
        );
      }
      
      // Get mock trend prediction
      const mockPrediction = getMockTrendPrediction(templateId);
      
      // Create a mock pattern data
      let mockPatternData: Record<string, any> = {
        'growth': {
          count: 15,
          avgAdjustments: {
            'confidenceScore': 0.07,
            'daysUntilPeak': -2
          },
          commonReasons: ['organic', 'trends', 'season', 'audience', 'competitive'],
          expertConfidence: 0.85
        },
        'engagement': {
          count: 8,
          avgAdjustments: {
            'confidenceScore': -0.04
          },
          commonReasons: ['retention', 'duration', 'comments', 'competing'],
          expertConfidence: 0.78
        },
        'content': {
          count: 12,
          avgAdjustments: {
            'growthTrajectory': 'adjusted'
          },
          commonReasons: ['quality', 'format', 'visual', 'timing'],
          expertConfidence: 0.82
        }
      };
      
      // Filter pattern data by category if provided
      if (category) {
        const filteredPatternData: Record<string, any> = {};
        if (mockPatternData[category]) {
          filteredPatternData[category] = mockPatternData[category];
        }
        mockPatternData = filteredPatternData;
      }
      
      // Generate suggestions using the ML service
      const { suggestions, patternsApplied } = await mlPredictionService.generateSuggestions(
        mockPrediction,
        mockPatternData
      );
      
      // Return the suggestions
      return NextResponse.json({
        templateId,
        suggestions,
        patternsApplied,
        patternCount: Object.keys(mockPatternData).length,
        generated: new Date().toISOString(),
        modelVersion: '1.0.5'
      });
    }
    
    // Get current user session
    const session = await getServerSession(authOptions);
    
    // Check if user is logged in
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const category = searchParams.get('category');
    
    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }
    
    // Check if user has enterprise tier access
    const userEmail = session.user.email;
    
    // Check if Firebase db is initialized
    if (!db) {
      console.error("Firebase Firestore not initialized");
      return NextResponse.json(
        { error: 'Database connection error' },
        { status: 500 }
      );
    }
    
    const userSnapshot = await getDocs(
      query(collection(db, 'users'), where('email', '==', userEmail))
    );
    
    if (userSnapshot.empty) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    const userData = userSnapshot.docs[0].data();
    const userTier = userData.subscriptionTier || 'free';
    
    // Only enterprise tier has access to ML suggestions
    if (userTier !== 'enterprise') {
      return NextResponse.json(
        { 
          error: 'Enterprise tier required',
          currentTier: userTier,
          requiredTier: 'enterprise',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }
    
    // Get the prediction for the template
    const predictionSnapshot = await getDocs(
      query(collection(db, 'trendPredictions'), where('templateId', '==', templateId))
    );
    
    if (predictionSnapshot.empty) {
      return NextResponse.json(
        { error: 'Prediction not found for this template' },
        { status: 404 }
      );
    }
    
    const predictionData = predictionSnapshot.docs[0].data() as TrendPrediction;
    
    // Get historical adjustments to analyze patterns
    let adjustmentsQuery = query(
      collection(db, 'manualAdjustments'),
      orderBy('adjustedAt', 'desc'),
      limit(100)
    );
    
    // Add category filter if provided
    if (category) {
      adjustmentsQuery = query(
        collection(db, 'manualAdjustments'),
        where('adjustmentCategory', '==', category),
        orderBy('adjustedAt', 'desc'),
        limit(100)
      );
    }
    
    const adjustmentsSnapshot = await getDocs(adjustmentsQuery);
    const adjustments: ManualAdjustmentLog[] = adjustmentsSnapshot.docs.map(
      doc => doc.data() as ManualAdjustmentLog
    );
    
    // Analyze patterns in adjustments
    const { patterns } = await mlPredictionService.analyzePatterns(adjustments);
    
    // Generate suggestions using the ML service
    const { suggestions, patternsApplied } = await mlPredictionService.generateSuggestions(
      predictionData,
      patterns
    );
    
    // Return the suggestions
    return NextResponse.json({
      templateId,
      suggestions,
      patternsApplied,
      patternCount: Object.keys(patterns).length,
      generated: new Date().toISOString(),
      modelVersion: '1.0.0'
    });
    
  } catch (error) {
    console.error('Error generating ML suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}

/**
 * Mock helper function to generate a trend prediction for development
 */
function getMockTrendPrediction(templateId: string): TrendPrediction {
  return {
    templateId,
    template: {
      id: templateId,
      title: 'Product Showcase Template',
      description: 'Highlight product features with smooth transitions',
      thumbnailUrl: 'https://placehold.co/600x800/7950f2/ffffff?text=Product+Template'
    },
    contentCategory: 'Product',
    confidenceScore: 0.75,
    growthTrajectory: 'linear',
    daysUntilPeak: 12,
    targetAudience: ['Gen Z', 'Millennials', 'E-commerce'],
    velocityPatterns: {
      pattern: 'steady',
      timeWindow: '2 weeks'
    },
    predictedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expertAdjusted: false
  };
} 