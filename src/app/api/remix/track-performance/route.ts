import { NextResponse } from 'next/server';
import { collection, doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/firebase/firebase';
import { ActualPerformance, PerformanceComparison, PerformancePrediction, RemixSuggestion } from '@/lib/types/remix';

/**
 * API endpoint to track actual performance of templates and compare with predictions
 * 
 * This creates the feedback loop needed to improve AI predictions over time
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { templateId, actualPerformance } = data;
    
    if (!templateId || !actualPerformance) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if Firestore is initialized
    if (!db) {
      console.error('Firestore database is not initialized');
      return NextResponse.json(
        { error: 'Database connection error', mockResponse: true },
        { status: 500 }
      );
    }
    
    // Get the remixed template document
    const templateDoc = await getDoc(doc(db as Firestore, 'remixedTemplates', templateId));
    
    if (!templateDoc.exists()) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    const templateData = templateDoc.data();
    const prediction = templateData.performancePrediction as PerformancePrediction;
    const appliedSuggestions = templateData.appliedSuggestions as RemixSuggestion[] || [];
    const aiModel = templateData.aiModel || 'openai';
    const optimizationGoal = templateData.optimizationGoal || 'engagement';
    
    if (!prediction) {
      return NextResponse.json(
        { error: 'No performance prediction found for this template' },
        { status: 400 }
      );
    }
    
    // Calculate accuracy metrics
    const viewsAccuracy = calculateAccuracy(prediction.predictedViews, actualPerformance.actualViews);
    const likesAccuracy = calculateAccuracy(prediction.predictedLikes, actualPerformance.actualLikes);
    
    // For engagement, we compare prediction score with actual engagement rate
    // Normalize the scales if needed (e.g., if one is 0-100 and the other is 0-1)
    const normalizedEngagementScore = prediction.engagementScore / 100;
    const engagementAccuracy = calculateAccuracy(
      normalizedEngagementScore, 
      actualPerformance.engagementRate
    );
    
    // Calculate overall accuracy (weighted average)
    const overallAccuracy = (viewsAccuracy * 0.4 + likesAccuracy * 0.3 + engagementAccuracy * 0.3);
    
    // Create performance comparison object
    const performanceComparison: PerformanceComparison = {
      templateId,
      createdAt: new Date().toISOString(),
      prediction,
      actual: actualPerformance,
      accuracyMetrics: {
        viewsAccuracy,
        likesAccuracy,
        engagementAccuracy,
        overallAccuracy
      },
      appliedSuggestions,
      modelUsed: aiModel as 'openai' | 'claude',
      optimizationGoal: optimizationGoal as 'engagement' | 'conversion' | 'brand' | 'trends'
    };
    
    // Store the comparison in Firestore
    const comparisonId = uuidv4();
    await setDoc(
      doc(db as Firestore, 'performanceComparisons', comparisonId),
      performanceComparison
    );
    
    // Also update the remixed template with actual performance
    await setDoc(
      doc(db as Firestore, 'remixedTemplates', templateId),
      { actualPerformance },
      { merge: true }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Performance comparison recorded successfully',
      comparisonId,
      performanceComparison
    });
    
  } catch (error) {
    console.error('Error tracking template performance:', error);
    return NextResponse.json(
      { error: 'Failed to track template performance' },
      { status: 500 }
    );
  }
}

/**
 * Calculate accuracy percentage between predicted and actual values
 * Returns a value between 0 and 1, where 1 is perfect accuracy
 */
function calculateAccuracy(predicted: number, actual: number): number {
  if (predicted === 0 && actual === 0) return 1; // Both zero is perfect accuracy
  if (predicted === 0 || actual === 0) return 0; // One zero and one non-zero is 0% accuracy
  
  // Calculate accuracy using a percentage difference method
  // Using a modified formula that's more forgiving for large differences
  const percentDiff = Math.abs(predicted - actual) / ((predicted + actual) / 2);
  
  // Convert to accuracy (1 - percentDiff), but max at 1 and min at 0
  return Math.max(0, Math.min(1, 1 - percentDiff));
} 