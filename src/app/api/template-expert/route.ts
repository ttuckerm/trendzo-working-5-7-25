import { NextRequest, NextResponse } from 'next/server';
// import { db } from '@/lib/firebase/firebase'; // Firebase db is null
// import { doc, getDoc, Firestore } from 'firebase/firestore';
import { advancedTemplateAnalysisService } from '@/lib/services/advancedTemplateAnalysisService';
import { expertInsightService } from '@/lib/services/expertInsightService'; // Already neutralized

const ROUTE_DISABLED_MSG_PREFIX = "TemplateExpertRoute: Firebase backend is removed.";

/**
 * GET endpoint for template data with expert insights
 * Uses query parameter ?id=templateId instead of route parameter
 */
export async function GET(request: NextRequest) {
  try {
    const templateId = request.nextUrl.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required as a query parameter' },
        { status: 400 }
      );
    }

    console.warn(`${ROUTE_DISABLED_MSG_PREFIX} Firebase operations skipped. Using mock data and neutralized services.`);

    // // First try to fetch template data from Firebase
    // if (db) { // db is null, so this block would not execute anyway
    //   try {
    //     const templateRef = doc(db as Firestore, 'templates', templateId);
    //     const templateDoc = await getDoc(templateRef);
        
    //     if (templateDoc.exists()) {
    //       const templateData = templateDoc.data();
          
    //       // Try to fetch expert insights
    //       const expertInsights = await expertInsightService.getExpertInsights(templateId);
    //       const manualAdjustments = await expertInsightService.getManualAdjustments(templateId);
          
    //       // If we have analysis data and expert insights, enhance the analysis
    //       if (templateData.analysisData && expertInsights) {
    //         templateData.analysisData = await advancedTemplateAnalysisService.enhanceWithExpertInsights(
    //           templateId,
    //           templateData.analysisData,
    //           expertInsights
    //         );
    //       }
          
    //       // Add the expert insights and adjustments to the response
    //       const responseData = {
    //         ...templateData,
    //         expertInsights,
    //         manualAdjustments
    //       };
          
    //       return NextResponse.json({
    //         success: true,
    //         template: {
    //           id: templateDoc.id,
    //           ...responseData
    //         }
    //       });
    //     }
    //   } catch (firebaseError) {
    //     console.error('Firebase error during template-expert GET:', firebaseError);
    //     // Continue to mock data if Firebase fails
    //     console.warn(`${ROUTE_DISABLED_MSG_PREFIX} Firebase fetch failed, falling back to mock data.`);
    //   }
    // }
    
    // Return mock data for development purposes
    const mockTemplate = getMockTemplateData(templateId);
    const mockExpertInsights = getMockExpertInsights();
    
    // Enhance mock template with expert insights
    const enhancedAnalysis = await advancedTemplateAnalysisService.enhanceWithExpertInsights(
      templateId,
      mockTemplate.analysisData,
      mockExpertInsights
    );
    
    mockTemplate.analysisData = enhancedAnalysis;
    
    // Create a new object with both template data and expert insights
    const templateWithInsights = {
      ...mockTemplate,
      expertInsights: mockExpertInsights,
      manualAdjustments: []
    };
    
    return NextResponse.json({
      success: true,
      template: templateWithInsights
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

function getMockTemplateData(templateId: string) {
  return {
    id: templateId,
    title: `Template ${templateId.slice(0, 8)}`,
    category: ['Tutorial', 'Product Review', 'Dance', 'Lifestyle'][Math.floor(Math.random() * 4)],
    description: "This template effectively demonstrates the product with clear visual storytelling and a strong call to action.",
    thumbnailUrl: `https://picsum.photos/seed/${templateId}/400/225`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sourceVideoId: `video-${templateId}`,
    authorInfo: {
      id: "creator123",
      username: "creativecreator",
      isVerified: true
    },
    stats: {
      views: Math.floor(Math.random() * 5000000) + 100000,
      likes: Math.floor(Math.random() * 500000) + 10000,
      comments: Math.floor(Math.random() * 50000) + 1000,
      shares: Math.floor(Math.random() * 100000) + 5000,
      engagementRate: (Math.random() * 0.08) + 0.02,
    },
    metadata: {
      duration: Math.floor(Math.random() * 45) + 15,
      hashtags: ["fyp", "viral", "trending", "product"],
      aiDetectedCategory: ['Educational', 'Marketing', 'Entertainment', 'Informative'][Math.floor(Math.random() * 4)],
    },
    templateStructure: [
      {
        type: "Hook",
        startTime: 0,
        duration: 3,
        purpose: "Attention-grabbing opening to draw viewers in"
      },
      {
        type: "Intro",
        startTime: 3,
        duration: 5,
        purpose: "Introduces the topic and sets expectations"
      },
      {
        type: "Main",
        startTime: 8,
        duration: 12,
        purpose: "Core content presentation with key points"
      },
      {
        type: "Demo",
        startTime: 20,
        duration: 8,
        purpose: "Visual demonstration of the product or concept"
      },
      {
        type: "Conclusion",
        startTime: 28,
        duration: 4,
        purpose: "Summary of key benefits"
      },
      {
        type: "CTA",
        startTime: 32,
        duration: 3,
        purpose: "Clear call to action for viewer engagement"
      }
    ],
    analysisData: {
      templateId: templateId,
      videoId: `video-${templateId}`,
      detectedElements: {
        hasCaption: true,
        hasCTA: true,
        hasProductDisplay: Math.random() > 0.5,
        hasTextOverlay: true,
        hasVoiceover: Math.random() > 0.3,
        hasBgMusic: true
      },
      effectiveness: {
        engagementRate: (Math.random() * 0.08) + 0.02,
        conversionRate: (Math.random() * 0.15) + 0.05,
        averageViewDuration: Math.floor(Math.random() * 25) + 10,
      },
      engagementInsights: "This template performs exceptionally well with 18-24 year olds. The transition at 0:15 creates a strong retention peak. Comments indicate high audience resonance with the hook section.",
      similarityPatterns: "The template follows the proven hook-context-reveal-call pattern frequently seen in viral content.",
      viralityFactors: {
        score: Math.floor(Math.random() * 5) + 5,
        strengths: [
          "Strong visual hook",
          "Clear call to action",
          "Emotional appeal"
        ],
        weaknesses: [
          "Could improve audio quality",
          "Text overlay duration could be longer"
        ]
      }
    },
    trendData: {
      dailyViews: {
        [`${new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 20000) + 5000,
        [`${new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 25000) + 6000,
        [`${new Date(Date.now() - 4 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 30000) + 7000,
        [`${new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 35000) + 8000,
        [`${new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 40000) + 9000,
        [`${new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0]}`]: Math.floor(Math.random() * 45000) + 10000,
        [`${new Date().toISOString().split('T')[0]}`]: Math.floor(Math.random() * 50000) + 11000,
      },
      growthRate: (Math.random() * 0.4) + 0.1,
      peakDate: new Date().toISOString().split('T')[0],
      industry: ['Beauty', 'Tech', 'Fashion', 'Food'][Math.floor(Math.random() * 4)],
      velocityScore: (Math.random() * 9) + 1,
      dailyGrowth: (Math.random() * 0.2) + 0.05,
      weeklyGrowth: (Math.random() * 0.5) + 0.2,
    },
    isActive: true
  };
}

function getMockExpertInsights() {
  return {
    tags: [
      {
        id: "1",
        tag: "High retention",
        category: "engagement",
        confidence: 0.9,
        addedBy: "expert-user-1",
        addedAt: new Date().toISOString()
      },
      {
        id: "2",
        tag: "Product showcase",
        category: "content",
        confidence: 0.85,
        addedBy: "expert-user-1",
        addedAt: new Date().toISOString()
      },
      {
        id: "3",
        tag: "Gen Z appeal",
        category: "demographic",
        confidence: 0.75,
        addedBy: "expert-user-1",
        addedAt: new Date().toISOString()
      }
    ],
    notes: "This template has shown exceptional engagement metrics in the beauty and fashion niches. The hook section is particularly effective at grabbing attention within the first 3 seconds.",
    recommendedUses: [
      "Product launches",
      "Before-and-after transformations",
      "Quick tutorials"
    ],
    performanceRating: 4,
    audienceRecommendation: [
      "Beauty influencers",
      "E-commerce brands",
      "Fashion retailers"
    ]
  };
} 