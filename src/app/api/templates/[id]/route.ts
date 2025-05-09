import { NextRequest, NextResponse } from 'next/server'
import { templateService } from '@/lib/services/templateService'
import { getCurrentUserId, handleApiError, createErrorResponse } from '@/lib/utils/apiHelpers'
import { db } from '@/lib/firebase/firebase'
import { doc, getDoc, Firestore } from 'firebase/firestore'
import { TrendingTemplate } from '@/lib/types/trendingTemplate'
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';
import { expertInsightService } from '@/lib/services/expertInsightService';

/**
 * GET method to retrieve a specific template by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const templateId = params.id
    const isNewsletter = request.nextUrl.searchParams.get('source') === 'newsletter'
    const isExpertView = request.nextUrl.searchParams.get('view') === 'expert'

    // For requests with expert data, we'll use a more comprehensive approach
    if (isExpertView) {
      try {
        // Attempt to fetch from Firestore directly
        const templateRef = doc(db as Firestore, 'templates', templateId);
        const templateDoc = await getDoc(templateRef);
        
        if (templateDoc.exists()) {
          const templateData = templateDoc.data();
          
          // Try to fetch expert insights
          const expertInsights = await expertInsightService.getExpertInsights(templateId);
          const manualAdjustments = await expertInsightService.getManualAdjustments(templateId);
          
          // If we have analysis data and expert insights, enhance the analysis
          if (templateData.analysisData && expertInsights) {
            templateData.analysisData = await advancedTemplateAnalysisService.enhanceWithExpertInsights(
              templateId,
              templateData.analysisData,
              expertInsights
            );
          }
          
          // Add the expert insights and adjustments to the response
          const responseData = {
            ...templateData,
            expertInsights,
            manualAdjustments
          };
          
          return NextResponse.json({
            success: true,
            template: {
              id: templateDoc.id,
              ...responseData
            }
          });
        }
      } catch (firebaseError) {
        console.error('Firebase error:', firebaseError);
        // Continue with regular template fetch if Firebase fails
      }
    }

    // For newsletter template requests, we'll use a simplified approach
    if (isNewsletter) {
      try {
        // Attempt to fetch from Firestore directly
        const templateRef = doc(db, 'templates', templateId);
        const templateDoc = await getDoc(templateRef);

        if (templateDoc.exists()) {
          // If template exists in Firestore, return it
          const templateData = templateDoc.data();
          
          // Add default values for missing fields
          const template = {
            id: templateId,
            title: templateData.title || 'Untitled Template',
            description: templateData.description || 'No description available',
            thumbnailUrl: templateData.thumbnailUrl || '',
            category: templateData.category || 'General',
            duration: templateData.duration || 60,
            views: templateData.views || 0,
            stats: templateData.stats || {
              likes: 0,
              comments: 0,
              engagementRate: 0
            },
            createdAt: templateData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            updatedAt: templateData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };

          return NextResponse.json(template);
        }
      } catch (firestoreError) {
        console.error('Firestore fetch error:', firestoreError);
        // Continue with regular template fetch if Firestore fails
      }
    }

    // Standard template retrieval continues below
    // Fetch the template
    const template = await templateService.getTemplate(templateId)
    
    // Check if template exists
    if (!template) {
      // Fallback for newsletter preview if no template found
      if (isNewsletter) {
        const fallbackTemplate = {
          id: templateId,
          title: 'Sample Template',
          description: 'This is a sample template for demonstration purposes.',
          thumbnailUrl: '/images/sample-template.jpg',
          category: 'General',
          duration: 60,
          views: 1500,
          stats: {
            likes: 120,
            comments: 45,
            engagementRate: 0.12
          }
        };
        
        return NextResponse.json(fallbackTemplate);
      }
      
      return createErrorResponse('Template not found', 404)
    }
    
    // For demo purposes, we'll bypass the ownership check if userId is demo-user-id
    // In a real app, you would properly verify ownership
    if (template.userId !== userId && userId !== 'demo-user-id' && !isNewsletter) {
      return createErrorResponse('You do not have permission to access this template', 403)
    }
    
    // Track template view
    await templateService.incrementTemplateViews(templateId)
    
    // Get similar templates if available
    let similarTemplates = []
    if (template.trendData?.similarTemplates && template.trendData.similarTemplates.length > 0) {
      // In a real implementation, you would fetch the similar templates here
      // For now, we'll just return the IDs
      similarTemplates = template.trendData.similarTemplates
    }
    
    // Return the template data with additional information
    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        title: template.title,
        category: template.category,
        description: template.description,
        thumbnailUrl: template.thumbnailUrl || '/images/template-placeholder.jpg',
        sourceVideoId: template.sourceVideoId,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
        authorInfo: template.authorInfo,
        stats: template.stats,
        metadata: template.metadata,
        templateStructure: template.templateStructure,
        analysisData: template.analysisData,
        trendData: template.trendData,
        similarTemplates
      }
    })
  } catch (error) {
    return handleApiError(error, 'Failed to fetch template')
  }
}

/**
 * PUT method to update an existing template
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const templateId = params.id
    
    // Get the current template to check ownership
    const existingTemplate = await templateService.getTemplate(templateId)
    
    // Check if template exists
    if (!existingTemplate) {
      return createErrorResponse('Template not found', 404)
    }
    
    // For demo purposes, we'll bypass the ownership check if userId is demo-user-id
    // In a real app, you would properly verify ownership
    if (existingTemplate.userId !== userId && userId !== 'demo-user-id') {
      return createErrorResponse('You do not have permission to modify this template', 403)
    }
    
    // Parse the updated template data from request body
    const updatedTemplateData = await request.json()
    
    // Make sure the ID in the path matches the ID in the body, if provided
    if (updatedTemplateData.id && updatedTemplateData.id !== templateId) {
      return createErrorResponse('Template ID in body does not match ID in URL', 400)
    }
    
    // Ensure userId cannot be changed
    updatedTemplateData.userId = existingTemplate.userId
    
    // Update the template
    const updatedTemplate = await templateService.updateTemplate(templateId, updatedTemplateData)
    
    return NextResponse.json(updatedTemplate)
  } catch (error) {
    return handleApiError(error, 'Failed to update template')
  }
}

/**
 * DELETE method to remove a template
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getCurrentUserId(request)
    const templateId = params.id
    
    // Get the current template to check ownership
    const existingTemplate = await templateService.getTemplate(templateId)
    
    // Check if template exists
    if (!existingTemplate) {
      return createErrorResponse('Template not found', 404)
    }
    
    // For demo purposes, we'll bypass the ownership check if userId is demo-user-id
    // In a real app, you would properly verify ownership
    if (existingTemplate.userId !== userId && userId !== 'demo-user-id') {
      return createErrorResponse('You do not have permission to delete this template', 403)
    }
    
    // Delete the template
    await templateService.deleteTemplate(templateId)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'Failed to delete template')
  }
}

// Mock data for development
function getMockTemplateDetails(id: string) {
  const mockTemplates: Record<string, any> = {
    'template-001': {
      id: 'template-001',
      title: 'Product Showcase with Benefits',
      category: 'Marketing',
      description: 'A highly effective template for showcasing products with clear benefit statements and driving conversions. This template uses a problem-solution structure with clear benefit statements.',
      thumbnailUrl: '/images/product-template.jpg',
      sourceVideoId: 'vid12345',
      createdAt: '2023-12-01T12:00:00Z',
      updatedAt: '2024-03-15T08:30:00Z',
      authorInfo: {
        id: 'user123',
        username: 'marketingpro',
        isVerified: true
      },
      stats: {
        views: 1250000,
        likes: 95000,
        comments: 8500,
        shares: 12000,
        engagementRate: 9.2
      },
      metadata: {
        duration: 25,
        hashtags: ['#product', '#marketing', '#showcase', '#tiktokforbusiness'],
        aiDetectedCategory: 'Product',
        soundId: 'sound12345',
        soundName: 'Original Sound - marketingpro'
      },
      templateStructure: [
        { 
          id: 'section1',
          type: 'Hook',
          startTime: 0,
          duration: 3,
          purpose: 'Attention grabbing opening with problem statement',
          textOverlays: ['Ever struggled with this?', 'This is a common problem'],
          hashtags: ['#problem']
        },
        { 
          id: 'section2',
          type: 'Introduction',
          startTime: 3,
          duration: 5,
          purpose: 'Product reveal with main benefit',
          textOverlays: ['Introducing our solution', 'Here\'s how it works'],
          hashtags: ['#solution'] 
        },
        { 
          id: 'section3',
          type: 'Feature 1',
          startTime: 8,
          duration: 5,
          purpose: 'Highlight first key feature',
          textOverlays: ['Key Feature #1', 'This is what makes it special'],
          hashtags: [] 
        },
        { 
          id: 'section4',
          type: 'Feature 2',
          startTime: 13,
          duration: 5,
          purpose: 'Highlight second key feature',
          textOverlays: ['Key Feature #2', 'Another reason to love it'],
          hashtags: [] 
        },
        { 
          id: 'section5',
          type: 'Call to Action',
          startTime: 18,
          duration: 7,
          purpose: 'Clear CTA with urgency element',
          textOverlays: ['Get yours now!', 'Limited time offer', 'Link in bio'],
          hashtags: ['#limitedtime'] 
        }
      ],
      analysisData: {
        templateId: 'template-001',
        videoId: 'vid12345',
        estimatedSections: [
          { id: 'section1', type: 'Hook', startTime: 0, duration: 3, textOverlays: [], hashtags: [] },
          { id: 'section2', type: 'Introduction', startTime: 3, duration: 5, textOverlays: [], hashtags: [] },
          { id: 'section3', type: 'Content', startTime: 8, duration: 10, textOverlays: [], hashtags: [] },
          { id: 'section5', type: 'CTA', startTime: 18, duration: 7, textOverlays: [], hashtags: [] }
        ],
        detectedElements: {
          hasCaption: true,
          hasCTA: true,
          hasProductDisplay: true,
          hasTextOverlay: true,
          hasVoiceover: true,
          hasBgMusic: true
        },
        effectiveness: {
          engagementRate: 9.2,
          conversionRate: 4.5,
          averageViewDuration: 18.5
        },
        engagementInsights: "This template performs exceptionally well for direct product marketing. The clear problem-solution structure and strong call-to-action drive high conversion rates. The textual overlays highlighting key benefits significantly increase information retention.",
        similarityPatterns: "Strong similarity to other successful product showcase templates that use the problem-solution-benefit-CTA structure. The visual transitions between sections create a cohesive narrative flow."
      },
      trendData: {
        dailyViews: {
          '2024-03-01': 95000,
          '2024-03-08': 120000,
          '2024-03-15': 135000
        },
        growthRate: 142,
        peakDate: '2024-03-15',
        industry: 'E-commerce',
        similarTemplates: ['template-008', 'template-012', 'template-023'],
        velocityScore: 8.7,
        dailyGrowth: 12.5,
        weeklyGrowth: 85.3
      },
      isActive: true
    },
    'template-002': {
      id: 'template-002',
      title: 'Tutorial Step-by-Step Guide',
      category: 'Education',
      description: 'Clear step-by-step tutorial format that drives high completion rates and knowledge retention. Perfect for educational content and how-to guides.',
      thumbnailUrl: '/images/tutorial-template.jpg',
      sourceVideoId: 'vid67890',
      createdAt: '2023-11-15T14:30:00Z',
      updatedAt: '2024-03-10T09:45:00Z',
      authorInfo: {
        id: 'user456',
        username: 'learnwithjane',
        isVerified: true
      },
      stats: {
        views: 980000,
        likes: 85000,
        comments: 12000,
        shares: 18000,
        engagementRate: 11.8
      },
      metadata: {
        duration: 45,
        hashtags: ['#tutorial', '#howto', '#learnontiktok', '#education'],
        aiDetectedCategory: 'Tutorial',
        soundId: 'sound67890',
        soundName: 'Instructional Background - TikTok Creator Music'
      },
      templateStructure: [
        { 
          id: 'section1',
          type: 'Hook',
          startTime: 0,
          duration: 5,
          purpose: 'Promise of value with before/after glimpse',
          textOverlays: ['Learn how to master this skill', 'You\'ll be able to do this!'],
          hashtags: ['#learningchallenge'] 
        },
        { 
          id: 'section2',
          type: 'Introduction',
          startTime: 5,
          duration: 8,
          purpose: 'Explain what viewers will learn',
          textOverlays: ['In this tutorial, I\'ll show you:', '3 easy steps to master this'],
          hashtags: ['#stepbystep'] 
        },
        { 
          id: 'section3',
          type: 'Step 1',
          startTime: 13,
          duration: 8,
          purpose: 'First key action demonstrated',
          textOverlays: ['Step 1: Start with this', 'Important: Don\'t skip this part'],
          hashtags: [] 
        },
        { 
          id: 'section4',
          type: 'Step 2',
          startTime: 21,
          duration: 8,
          purpose: 'Second key action demonstrated',
          textOverlays: ['Step 2: Now do this', 'Pro tip: Make sure to...'],
          hashtags: [] 
        },
        { 
          id: 'section5',
          type: 'Step 3',
          startTime: 29,
          duration: 8,
          purpose: 'Third key action demonstrated',
          textOverlays: ['Step 3: Finally, complete this way', 'Watch closely!'],
          hashtags: [] 
        },
        { 
          id: 'section6',
          type: 'Results',
          startTime: 37,
          duration: 5,
          purpose: 'Show completed result',
          textOverlays: ['Here\'s the final result!', 'You\'ve learned how to do it!'],
          hashtags: ['#success'] 
        },
        { 
          id: 'section7',
          type: 'Call to Action',
          startTime: 42,
          duration: 3,
          purpose: 'Ask for engagement and suggest follow',
          textOverlays: ['Follow for more tutorials', 'Comment what you want to learn next'],
          hashtags: ['#learnwithjane'] 
        }
      ],
      analysisData: {
        templateId: 'template-002',
        videoId: 'vid67890',
        estimatedSections: [
          { id: 'section1', type: 'Hook', startTime: 0, duration: 5, textOverlays: [], hashtags: [] },
          { id: 'section2', type: 'Intro', startTime: 5, duration: 8, textOverlays: [], hashtags: [] },
          { id: 'section3', type: 'Content', startTime: 13, duration: 24, textOverlays: [], hashtags: [] },
          { id: 'section4', type: 'Showcase', startTime: 37, duration: 5, textOverlays: [], hashtags: [] },
          { id: 'section5', type: 'CTA', startTime: 42, duration: 3, textOverlays: [], hashtags: [] }
        ],
        detectedElements: {
          hasCaption: true,
          hasCTA: true,
          hasProductDisplay: false,
          hasTextOverlay: true,
          hasVoiceover: true,
          hasBgMusic: true
        },
        effectiveness: {
          engagementRate: 11.8,
          conversionRate: null,
          averageViewDuration: 38.2
        },
        engagementInsights: "This tutorial template excels at knowledge transfer with exceptional completion rates. The step-by-step structure with clear visual markers and text overlays helps viewers follow along easily. The before/after hook creates strong motivation to watch the complete tutorial.",
        similarityPatterns: "Follows the proven educational content pattern with clear segmentation of steps. The use of numbered steps and progress indicators creates a cohesive learning experience."
      },
      trendData: {
        dailyViews: {
          '2024-03-01': 78000,
          '2024-03-08': 95000,
          '2024-03-15': 112000
        },
        growthRate: 165,
        peakDate: '2024-03-15',
        industry: 'Education',
        similarTemplates: ['template-015', 'template-027', 'template-033'],
        velocityScore: 9.2,
        dailyGrowth: 15.8,
        weeklyGrowth: 92.1
      },
      isActive: true
    }
  }
  
  // Return the requested template or the first one if not found
  return mockTemplates[id] || mockTemplates['template-001']
} 