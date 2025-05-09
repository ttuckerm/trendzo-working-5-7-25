import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, doc, getDoc, query, limit, where, getDocs } from 'firebase/firestore';

/**
 * Get detailed template analysis data for a specific template
 * Includes:
 * - Template structure visualization data
 * - Engagement metrics and velocity scores
 * - AI analysis of template effectiveness
 */
export async function GET(request: NextRequest) {
  const templateId = request.nextUrl.searchParams.get('id');
  
  if (!templateId) {
    return NextResponse.json(
      { error: 'Missing template ID parameter' },
      { status: 400 }
    );
  }

  try {
    // Attempt to fetch from Firebase if configured
    const templateDoc = await getDoc(doc(db, 'templates', templateId));
    
    if (templateDoc.exists()) {
      const templateData = templateDoc.data();
      
      // Return actual data from Firebase
      return NextResponse.json({
        success: true,
        template: {
          id: templateDoc.id,
          ...templateData,
        }
      });
    } else {
      // Return mock data for development/demo purposes
      return NextResponse.json({
        success: true,
        template: getMockTemplateAnalysis(templateId)
      });
    }
  } catch (error) {
    console.error('Error fetching template analysis:', error);
    // Return mock data if Firebase isn't configured or encounters an error
    return NextResponse.json({
      success: true,
      template: getMockTemplateAnalysis(templateId)
    });
  }
}

/**
 * Mock data function for template analysis
 */
function getMockTemplateAnalysis(templateId: string) {
  return {
    id: templateId,
    title: `Template ${templateId.slice(0, 8)}`,
    category: ['Tutorial', 'Product Review', 'Dance', 'Lifestyle'][Math.floor(Math.random() * 4)],
    description: "This template effectively demonstrates the product with clear visual storytelling and a strong call to action.",
    thumbnailUrl: `https://picsum.photos/seed/${templateId}/400/225`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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
      similarityPatterns: "The template follows the proven hook-context-reveal-call pattern frequently seen in viral content."
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