import { NextRequest, NextResponse } from 'next/server';
import { expertPerformanceService } from '@/lib/services/expertPerformanceService';
import { Expert, AdjustmentVerification } from '@/lib/types/expert';
import { auth } from '@/lib/firebase/firebase';
import { isExpertUser } from '@/lib/types/user';

/**
 * Get expert performance metrics
 * GET /api/experts/performance?expertId=<id>
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const expertId = searchParams.get('expertId');
    const path = searchParams.get('path');
    
    // If expertId is provided, get single expert profile
    if (expertId) {
      const expertProfile = await expertPerformanceService.getExpertProfile(expertId);
      
      if (!expertProfile) {
        return NextResponse.json(
          { error: 'Expert not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(expertProfile);
    }
    
    // Get top performing experts
    if (path === 'top') {
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const experts = await expertPerformanceService.getTopExperts(limit);
      
      return NextResponse.json({
        success: true,
        experts
      });
    }
    
    // Get experts by specialization
    if (path === 'specialization') {
      const category = searchParams.get('category');
      const minReliability = parseInt(searchParams.get('minReliability') || '0', 10);
      
      if (!category) {
        return NextResponse.json(
          { error: 'Category is required' },
          { status: 400 }
        );
      }
      
      const experts = await expertPerformanceService.getExpertsBySpecialization(
        category,
        minReliability
      );
      
      return NextResponse.json({
        success: true,
        experts
      });
    }
    
    // If no valid params are provided
    return NextResponse.json(
      { error: 'Either expertId or path parameter is required' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error fetching expert performance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expert performance metrics' },
      { status: 500 }
    );
  }
}

/**
 * Create or update expert profile
 * POST /api/experts/performance
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated (in a real app)
    // const authResult = await auth.currentUser;
    // if (!authResult || !isExpertUser(authResult)) {
    //   return NextResponse.json(
    //     { error: 'Authentication required' },
    //     { status: 401 }
    //   );
    // }
    
    const body = await request.json();
    
    // Case 1: Create a new expert profile
    if (body.action === 'create') {
      if (!body.userId || !body.name || !body.email) {
        return NextResponse.json(
          { error: 'User ID, name, and email are required' },
          { status: 400 }
        );
      }
      
      const expert = await expertPerformanceService.createExpertProfile({
        userId: body.userId,
        name: body.name,
        email: body.email,
        bio: body.bio,
        avatar: body.avatar,
        specializations: body.specializations || []
      });
      
      return NextResponse.json({
        success: true,
        expert
      });
    }
    
    // Case 2: Record expert activity
    if (body.action === 'record_activity') {
      if (!body.expertId || !body.type || !body.description) {
        return NextResponse.json(
          { error: 'Expert ID, activity type, and description are required' },
          { status: 400 }
        );
      }
      
      const activity = await expertPerformanceService.recordActivity({
        expertId: body.expertId,
        type: body.type,
        description: body.description,
        timestamp: body.timestamp || new Date().toISOString(),
        category: body.category,
        impactScore: body.impactScore,
        templateId: body.templateId,
        templateTitle: body.templateTitle,
        metadata: body.metadata
      });
      
      return NextResponse.json({
        success: true,
        activity
      });
    }
    
    // Case 3: Record adjustment verification
    if (body.action === 'verify_adjustment') {
      if (!body.expertId || !body.adjustmentId || !body.templateId || body.isAccurate === undefined) {
        return NextResponse.json(
          { error: 'Expert ID, adjustment ID, template ID, and isAccurate flag are required' },
          { status: 400 }
        );
      }
      
      const verification: AdjustmentVerification = {
        id: `verification-${Date.now()}`,
        expertId: body.expertId,
        adjustmentId: body.adjustmentId,
        templateId: body.templateId,
        verifiedAt: body.verifiedAt || new Date().toISOString(),
        verifiedBy: body.verifiedBy || 'system',
        originalValue: body.originalValue,
        adjustedValue: body.adjustedValue,
        actualValue: body.actualValue,
        improvementPercent: body.improvementPercent || 0,
        isAccurate: body.isAccurate,
        notes: body.notes,
        category: body.category
      };
      
      const updatedMetrics = await expertPerformanceService.recordAdjustmentVerification(verification);
      
      return NextResponse.json({
        success: true,
        metrics: updatedMetrics
      });
    }
    
    // Case 4: Add specialization area
    if (body.action === 'add_specialization') {
      if (!body.expertId || !body.name) {
        return NextResponse.json(
          { error: 'Expert ID and specialization name are required' },
          { status: 400 }
        );
      }
      
      const specializationAreas = await expertPerformanceService.addSpecializationArea(
        body.expertId,
        {
          name: body.name,
          description: body.description,
          tags: body.tags || [body.name],
          confidenceLevel: body.confidenceLevel || 0.5
        }
      );
      
      return NextResponse.json({
        success: true,
        specializationAreas
      });
    }
    
    // Case 5: Calculate reliability score
    if (body.action === 'calculate_reliability') {
      if (!body.expertId) {
        return NextResponse.json(
          { error: 'Expert ID is required' },
          { status: 400 }
        );
      }
      
      const reliabilityScore = await expertPerformanceService.calculateReliabilityScore(body.expertId);
      
      return NextResponse.json({
        success: true,
        reliabilityScore
      });
    }
    
    // Case 6: Update specialization areas based on adjustments
    if (body.action === 'update_specializations') {
      if (!body.expertId) {
        return NextResponse.json(
          { error: 'Expert ID is required' },
          { status: 400 }
        );
      }
      
      const specializationAreas = await expertPerformanceService.updateSpecializationAreas(body.expertId);
      
      return NextResponse.json({
        success: true,
        specializationAreas
      });
    }
    
    return NextResponse.json(
      { error: 'Invalid action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing expert performance request:', error);
    return NextResponse.json(
      { error: 'Failed to process expert performance request' },
      { status: 500 }
    );
  }
} 