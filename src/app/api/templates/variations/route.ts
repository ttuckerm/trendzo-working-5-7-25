import { NextRequest, NextResponse } from 'next/server';
import { 
  createTemplateVariation,
  getTemplateVariations,
  getTemplateVariation,
  updateTemplateVariation,
  deleteTemplateVariation,
  promoteVariationToTemplate,
  getUserVariations
} from '@/lib/services/templateVariationService';
import { auth } from '@/lib/firebase/firebase';
import { mockVerifyToken } from '@/lib/firebase/firebaseAdmin';

const isDev = process.env.NODE_ENV === 'development';

// Get current user from Firebase token
async function getCurrentUser(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // For development, allow a default user
      if (isDev) {
        console.log('Using mock user for development');
        return 'user_dev_123';
      }
      return null;
    }

    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    if (!token) {
      return null;
    }

    // In development, use mock verification
    if (isDev) {
      try {
        const mockUser = await mockVerifyToken(token);
        return mockUser.uid;
      } catch (error) {
        console.warn('Mock verification failed, using default dev user');
        return 'user_dev_123';
      }
    }

    // In production, would use Firebase Admin SDK to verify token
    // This is simplified for this implementation
    return token.split('_')[1] || null;
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

// Get all variations for a template or a specific variation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('templateId');
    const variationId = searchParams.get('variationId');
    const userId = searchParams.get('userId');
    
    // Get current user
    const currentUserId = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!currentUserId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Get a specific variation by ID
    if (variationId) {
      const variation = await getTemplateVariation(variationId);
      
      if (!variation) {
        return NextResponse.json({
          success: false,
          error: 'Variation not found'
        }, { status: 404 });
      }
      
      // Check if user has access to this variation
      if (variation.userId !== currentUserId) {
        return NextResponse.json({
          success: false,
          error: 'Access denied'
        }, { status: 403 });
      }
      
      return NextResponse.json({
        success: true,
        variation
      });
    }

    // Get all variations for a specific user
    if (userId && !templateId) {
      // Ensure the requested user matches the authenticated user
      if (userId !== currentUserId) {
        return NextResponse.json({
          success: false,
          error: 'Access denied - you can only view your own variations'
        }, { status: 403 });
      }

      const variations = await getUserVariations(userId);
      
      return NextResponse.json({
        success: true,
        variations
      });
    }
    
    // Get all variations for a template
    if (templateId) {
      const variations = await getTemplateVariations(templateId, currentUserId);
      
      return NextResponse.json({
        success: true,
        variations
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'templateId, userId, or variationId is required'
    }, { status: 400 });
  } catch (error: any) {
    console.error('Error in template variations API:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Create a new template variation
export async function POST(request: NextRequest) {
  try {
    const userId = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { originalTemplateId, template, variationType, name, description } = body;
    
    if (!originalTemplateId || !template || !variationType) {
      return NextResponse.json({
        success: false,
        error: 'originalTemplateId, template, and variationType are required'
      }, { status: 400 });
    }
    
    // Create the new variation
    const variationId = await createTemplateVariation(
      originalTemplateId,
      template,
      variationType,
      userId,
      name,
      description
    );
    
    return NextResponse.json({
      success: true,
      variationId
    });
  } catch (error: any) {
    console.error('Error creating template variation:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Update an existing template variation
export async function PUT(request: NextRequest) {
  try {
    const userId = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { variationId, updates } = body;
    
    if (!variationId || !updates) {
      return NextResponse.json({
        success: false,
        error: 'variationId and updates are required'
      }, { status: 400 });
    }
    
    // Get the variation to check ownership
    const variation = await getTemplateVariation(variationId);
    
    if (!variation) {
      return NextResponse.json({
        success: false,
        error: 'Variation not found'
      }, { status: 404 });
    }
    
    // Check if user owns this variation
    if (variation.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }
    
    // Update the variation
    await updateTemplateVariation(variationId, updates);
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error updating template variation:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Delete a template variation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const variationId = searchParams.get('variationId');
    
    if (!variationId) {
      return NextResponse.json({
        success: false,
        error: 'variationId is required'
      }, { status: 400 });
    }
    
    const userId = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Get the variation to check ownership
    const variation = await getTemplateVariation(variationId);
    
    if (!variation) {
      return NextResponse.json({
        success: false,
        error: 'Variation not found'
      }, { status: 404 });
    }
    
    // Check if user owns this variation
    if (variation.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }
    
    // Delete the variation
    await deleteTemplateVariation(variationId);
    
    return NextResponse.json({
      success: true
    });
  } catch (error: any) {
    console.error('Error deleting template variation:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
}

// Promote a variation to a full template
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getCurrentUser(request);
    
    // Check if user is authenticated
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { variationId } = body;
    
    if (!variationId) {
      return NextResponse.json({
        success: false,
        error: 'variationId is required'
      }, { status: 400 });
    }
    
    // Get the variation to check ownership
    const variation = await getTemplateVariation(variationId);
    
    if (!variation) {
      return NextResponse.json({
        success: false,
        error: 'Variation not found'
      }, { status: 404 });
    }
    
    // Check if user owns this variation
    if (variation.userId !== userId) {
      return NextResponse.json({
        success: false,
        error: 'Access denied'
      }, { status: 403 });
    }
    
    // Promote the variation to a standalone template
    const templateId = await promoteVariationToTemplate(variationId, userId);
    
    return NextResponse.json({
      success: true,
      templateId
    });
  } catch (error: any) {
    console.error('Error promoting variation to template:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal server error'
    }, { status: 500 });
  }
} 