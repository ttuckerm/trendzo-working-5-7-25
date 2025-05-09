import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { db } from '@/lib/firebase/firebase';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { trendPredictionService } from '@/lib/services/trendPredictionService';
import { TrendPrediction, TrendPredictionResponse } from '@/lib/types/trendingTemplate';
import { checkSubscriptionAccess } from '@/middleware/checkSubscription';
import { isDemoRequest, getSampleTrendPredictions } from '@/lib/utils/demoData';

/**
 * API endpoint to fetch trend predictions
 * 
 * Query Parameters:
 * - timeWindow: 7d, 30d, all (default: 7d)
 * - categories: comma-separated list of categories
 * - minConfidence: minimum confidence score (default: 0.6)
 * - limit: number of predictions to return (default: 10)
 * 
 * This endpoint requires premium subscription. Non-premium users can access 
 * demo data by adding the ?demo=true query parameter.
 */
export async function GET(request: NextRequest) {
  try {
    // Check subscription access with our middleware
    const subscriptionCheck = await checkSubscriptionAccess(request, {
      requiredTier: 'premium',
      allowDemoData: true
    });
    
    // If the subscription check returned a response, return it directly
    if (subscriptionCheck) {
      // If it's a demo request, return sample data
      if (isDemoRequest(request)) {
        const samplePredictions = getSampleTrendPredictions();
        const demoResponse: TrendPredictionResponse = {
          predictions: samplePredictions.map(sample => ({
            templateId: sample.id,
            template: {
              id: sample.id,
              title: sample.name,
              description: `Demo prediction for ${sample.name}`,
              thumbnailUrl: `/images/templates/demo-${sample.id}.jpg`,
              category: sample.category,
              authorName: 'Demo Creator',
            },
            confidenceScore: sample.confidence,
            daysUntilPeak: Math.floor(Math.random() * 14) + 3,
            growthTrajectory: 'linear',
            velocityPatterns: {
              pattern: 'steady',
              confidence: sample.confidence
            },
            contentCategory: sample.category,
            targetAudience: ['Demo Users'],
            predictedAt: sample.createdAt,
            expertAdjusted: false,
          })),
          timeWindow: '7d',
          totalCount: samplePredictions.length,
          hasMoreResults: false,
          isDemo: true
        };
        
        return NextResponse.json(demoResponse);
      }
      
      return subscriptionCheck;
    }
    
    // If we reach here, the user has the required subscription level
    // Continue with normal flow
    
    // For development, return mock data to simplify testing
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 [DEV MODE] Using mock trend predictions");
      
      // Mock data for development
      const mockPredictions: TrendPrediction[] = [
        {
          templateId: 'template-1',
          template: {
            id: 'template-1',
            title: 'Clean Product Showcase',
            description: 'A minimal product showcase template with clean transitions',
            thumbnailUrl: '/images/templates/product-1.jpg',
            category: 'Product',
            authorName: 'TrendzoCreator',
          },
          confidenceScore: 0.85,
          daysUntilPeak: 5,
          growthTrajectory: 'exponential',
          velocityPatterns: {
            pattern: 'accelerating',
            confidence: 0.9
          },
          contentCategory: 'Product',
          targetAudience: ['Shoppers', 'Brand Enthusiasts'],
          predictedAt: new Date().toISOString(),
          expertAdjusted: true,
        },
        {
          templateId: 'template-2',
          template: {
            id: 'template-2',
            title: 'Fashion Transition Effect',
            description: 'Smooth transitions for showcasing fashion items',
            thumbnailUrl: '/images/templates/fashion-1.jpg',
            category: 'Fashion',
            authorName: 'StyleCreator',
          },
          confidenceScore: 0.76,
          daysUntilPeak: 8,
          growthTrajectory: 'linear',
          velocityPatterns: {
            pattern: 'steady',
            confidence: 0.8
          },
          contentCategory: 'Fashion',
          targetAudience: ['Fashion Enthusiasts', 'Trend Followers'],
          predictedAt: new Date().toISOString(),
          expertAdjusted: false,
        },
        {
          templateId: 'template-3',
          template: {
            id: 'template-3',
            title: 'Food Review Template',
            description: 'Perfect template for food reviews and tastings',
            thumbnailUrl: '/images/templates/food-1.jpg',
            category: 'Food',
            authorName: 'FoodieCreator',
          },
          confidenceScore: 0.68,
          daysUntilPeak: 12,
          growthTrajectory: 'plateauing',
          velocityPatterns: {
            pattern: 'decelerating',
            confidence: 0.7
          },
          contentCategory: 'Food',
          targetAudience: ['Foodies', 'Restaurant Goers', 'Cooking Enthusiasts'],
          predictedAt: new Date().toISOString(),
          expertAdjusted: false,
        }
      ];
      
      // Create response
      const mockResponse: TrendPredictionResponse = {
        predictions: mockPredictions,
        timeWindow: '7d',
        totalCount: mockPredictions.length,
        hasMoreResults: false
      };
      
      return NextResponse.json(mockResponse);
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
    const timeWindow = searchParams.get('timeWindow') || '7d';
    const categoriesParam = searchParams.get('categories');
    const categories = categoriesParam ? categoriesParam.split(',') : [];
    const minConfidence = parseFloat(searchParams.get('minConfidence') || '0.6');
    const limitParam = parseInt(searchParams.get('limit') || '10');
    
    // Get predictions
    const result = await trendPredictionService.predictEmergingTrends({
      timeWindow,
      minConfidence,
      categories,
      limit: limitParam
    });
    
    // Format response
    const response: TrendPredictionResponse = {
      predictions: result.predictions,
      timeWindow: result.timeWindow,
      totalCount: result.predictions.length,
      hasMoreResults: false
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching trend predictions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trend predictions' },
      { status: 500 }
    );
  }
}

/**
 * API endpoint to apply expert adjustments to a trend prediction
 */
export async function POST(request: NextRequest) {
  try {
    // For development mode, return a success response with mock data
    if (process.env.NODE_ENV === 'development') {
      console.log("🧪 [DEV MODE] Simulating expert adjustment");
      
      // Parse request body to log what would be adjusted
      const body = await request.json();
      console.log("Adjustment data:", body);
      
      return NextResponse.json({
        success: true,
        message: 'Expert adjustment applied successfully (Development Mode)',
        template: {
          id: body.templateId,
          title: 'Mock Template',
          description: 'This is a mock template for development',
          // Other template data...
        }
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
    
    // Check if user has platinum tier access and is an expert
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
    const isExpert = userData.isExpert || false;
    
    // Only platinum tier experts can adjust predictions
    if (userTier !== 'platinum' || !isExpert) {
      return NextResponse.json(
        { 
          error: 'Platinum tier and expert status required',
          currentTier: userTier,
          isExpert,
          requiredTier: 'platinum',
          upgradeUrl: '/pricing'
        },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.templateId || !body.field || body.newValue === undefined || !body.reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Get expert confidence if provided (default to high confidence)
    const expertConfidence = body.expertConfidence || 0.8;
    
    // Get data source if provided
    const dataSource = body.dataSource || 'manual';
    
    // Apply adjustment with enhanced tracking
    const updatedTemplate = await trendPredictionService.saveExpertAdjustment({
      templateId: body.templateId,
      field: body.field,
      previousValue: body.previousValue,
      newValue: body.newValue,
      reason: body.reason,
      adjustedBy: userEmail || session.user.name || 'unknown',
      expertConfidence,
      dataSource
    });
    
    // Create notification for this expert adjustment
    await createExpertAdjustmentNotification(body.templateId, updatedTemplate.title, userEmail || 'expert');
    
    // Return updated prediction
    return NextResponse.json({
      success: true,
      message: 'Expert adjustment applied successfully',
      template: updatedTemplate
    });
    
  } catch (error) {
    console.error('Error applying expert adjustment:', error);
    return NextResponse.json(
      { error: 'Failed to apply expert adjustment' },
      { status: 500 }
    );
  }
}

/**
 * Create a notification when an expert adjusts a prediction
 */
async function createExpertAdjustmentNotification(
  templateId: string, 
  templateTitle: string,
  expertEmail: string
) {
  try {
    if (!db) return;
    
    const notificationId = `notif-${Date.now()}`;
    
    // Create notification record for admin dashboard
    await setDoc(doc(db, 'expertActivityLogs', notificationId), {
      id: notificationId,
      type: 'expert_adjustment',
      templateId,
      templateTitle,
      expertEmail,
      timestamp: serverTimestamp(),
      viewed: false
    });
    
  } catch (error) {
    console.error('Error creating expert adjustment notification:', error);
    // Non-fatal error, continue execution
  }
} 