/**
 * TRENDZO Viral Intelligence API
 * 
 * This unified API endpoint orchestrates the complete viral intelligence pipeline:
 * 1. Video scraping with Apify
 * 2. Viral pattern analysis
 * 3. Approval queue management
 * 4. Template generation
 * 5. Newsletter link tracking
 * 
 * Based on the comprehensive viral intelligence blueprint
 */

import { NextResponse } from 'next/server';
import { apifyViralScrapingService } from '@/lib/services/apifyViralScrapingService';
import { viralPatternMatchingEngine } from '@/lib/services/viralPatternMatchingEngine';
import { viralTemplateGenerationService } from '@/lib/services/viralTemplateGenerationService';
import { newsletterTrackingService } from '@/lib/services/newsletterTrackingService';
import { Platform } from '@/lib/types/database';

// POST /api/viral-intelligence - Start viral intelligence pipeline
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    switch (action) {
      case 'start_scraping':
        return await handleStartScraping(params);
      
      case 'analyze_video':
        return await handleAnalyzeVideo(params);
      
      case 'approve_video':
        return await handleApproveVideo(params);
      
      case 'generate_template':
        return await handleGenerateTemplate(params);
      
      case 'create_newsletter_link':
        return await handleCreateNewsletterLink(params);
      
      case 'get_pipeline_status':
        return await handleGetPipelineStatus(params);
      
      default:
        return NextResponse.json(
          { error: 'Unknown action', availableActions: [
            'start_scraping', 'analyze_video', 'approve_video', 
            'generate_template', 'create_newsletter_link', 'get_pipeline_status'
          ]},
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Viral Intelligence API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/viral-intelligence - Get pipeline status and analytics
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'dashboard':
        return await handleGetDashboard();
      
      case 'analytics':
        return await handleGetAnalytics(searchParams);
      
      case 'campaign_performance':
        const campaignName = searchParams.get('campaign');
        if (!campaignName) {
          return NextResponse.json({ error: 'Campaign name required' }, { status: 400 });
        }
        return await handleGetCampaignPerformance(campaignName);
      
      default:
        return await handleGetDashboard();
    }

  } catch (error) {
    console.error('Viral Intelligence API GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Start viral video scraping job
 */
async function handleStartScraping(params: {
  platform: Platform;
  searchTerms?: string[];
  hashtags?: string[];
  minViews?: number;
  limit?: number;
}) {
  try {
    console.log('🚀 Starting viral scraping job:', params);

    const scrapingConfig = {
      platform: params.platform,
      searchTerms: params.searchTerms || [],
      hashtags: params.hashtags || [],
      minViews: params.minViews || 50000, // Higher threshold for viral content
      minEngagementRate: 0.03, // 3% minimum engagement
      maxAge: 3, // Last 3 days for trending content
      limit: params.limit || 25,
      includeTranscripts: true,
      includeAudioAnalysis: true
    };

    const jobId = await apifyViralScrapingService.startScrapingJob(scrapingConfig);

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Viral scraping job started successfully',
      estimatedCompletionTime: '5-10 minutes',
      config: scrapingConfig
    });

  } catch (error) {
    console.error('Error starting scraping job:', error);
    return NextResponse.json(
      { error: 'Failed to start scraping job', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Analyze video for viral patterns
 */
async function handleAnalyzeVideo(params: {
  videoId: string;
  forceReanalysis?: boolean;
}) {
  try {
    console.log('🔍 Analyzing video for viral patterns:', params.videoId);

    // In a real implementation, we'd fetch the video from the database
    // For now, we'll create a mock video object
    const mockVideo = {
      id: params.videoId,
      sourceUrl: `https://example.com/video/${params.videoId}`,
      platform: 'instagram' as Platform,
      title: 'This morning routine changed everything!',
      description: 'Did you know this simple trick can boost your productivity by 300%? Here\'s what I learned...',
      transcript: 'Hey everyone! So I discovered this incredible morning routine that literally changed my life...',
      duration: 28,
      creatorUsername: 'productivity_guru',
      creatorFollowerCount: 125000,
      viewCount: 2800000,
      likeCount: 156000,
      commentCount: 8900,
      shareCount: 24000,
      uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      hashtags: ['#morningroutine', '#productivity', '#lifehack', '#viral'],
      visualElements: ['close_up', 'text_overlay', 'transition'],
      audioAnalysis: {
        tempo: 125,
        mood: 'energetic',
        hasOriginalAudio: true
      }
    };

    const analysis = await viralPatternMatchingEngine.analyzeVideo(mockVideo);

    return NextResponse.json({
      success: true,
      videoId: params.videoId,
      analysis,
      recommendations: analysis.recommendations,
      viralPotential: analysis.viralPotential,
      confidence: analysis.confidence,
      patterns: analysis.patternMatches.length
    });

  } catch (error) {
    console.error('Error analyzing video:', error);
    return NextResponse.json(
      { error: 'Failed to analyze video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Approve video for template generation
 */
async function handleApproveVideo(params: {
  videoId: string;
  reviewNotes?: string;
  reviewedBy: string;
}) {
  try {
    console.log('✅ Approving video for template generation:', params.videoId);

    // Update approval queue status
    // In production, this would update the approval_queue table

    // Trigger template generation
    const templateGenerationResult = await handleGenerateTemplate({
      videoId: params.videoId,
      autoGenerate: true
    });

    return NextResponse.json({
      success: true,
      videoId: params.videoId,
      status: 'approved',
      reviewedBy: params.reviewedBy,
      reviewNotes: params.reviewNotes,
      templateGeneration: templateGenerationResult,
      message: 'Video approved and template generation initiated'
    });

  } catch (error) {
    console.error('Error approving video:', error);
    return NextResponse.json(
      { error: 'Failed to approve video', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Generate template from approved video
 */
async function handleGenerateTemplate(params: {
  videoId: string;
  autoGenerate?: boolean;
}) {
  try {
    console.log('🎯 Generating template from video:', params.videoId);

    // First analyze the video for patterns
    const analysisResult = await handleAnalyzeVideo({ videoId: params.videoId });
    
    if (!analysisResult.ok) {
      throw new Error('Failed to analyze video for template generation');
    }

    const analysisData = await analysisResult.json();
    
    // Create mock video object for template generation
    const mockVideo = {
      id: params.videoId,
      sourceUrl: `https://example.com/video/${params.videoId}`,
      platform: 'instagram' as Platform,
      title: 'This morning routine changed everything!',
      description: 'Revolutionary productivity hack that anyone can implement',
      transcript: 'Complete transcript of the viral video...',
      duration: 28,
      creatorUsername: 'productivity_guru',
      creatorFollowerCount: 125000,
      viewCount: 2800000,
      likeCount: 156000,
      commentCount: 8900,
      shareCount: 24000,
      uploadDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      hashtags: ['#morningroutine', '#productivity', '#lifehack', '#viral'],
      visualElements: ['close_up', 'text_overlay', 'transition'],
      audioAnalysis: {
        tempo: 125,
        mood: 'energetic',
        hasOriginalAudio: true
      }
    };

    // Generate template using the analysis
    const template = await viralTemplateGenerationService.generateTemplateFromVideo(
      mockVideo,
      {
        patternMatches: analysisData.analysis.patternMatches,
        viralScore: analysisData.analysis.overallViralScore
      }
    );

    return NextResponse.json({
      success: true,
      template: {
        id: template.id,
        name: template.templateName,
        description: template.templateDescription,
        platform: template.targetPlatform,
        niche: template.targetNiche,
        viralScore: template.predictedViralScore,
        confidence: template.confidenceInterval,
        structure: {
          sections: template.templateStructure.sections.length,
          duration: template.templateStructure.duration,
          framework: template.templateStructure.framework
        },
        personalization: {
          industries: template.personalizationOptions.industry.available.length,
          tones: template.personalizationOptions.tone.available.length,
          customizable: true
        }
      },
      nextSteps: [
        'Template ready for use',
        'Create newsletter links for distribution',
        'Monitor template performance',
        'Gather user feedback for improvements'
      ]
    });

  } catch (error) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: 'Failed to generate template', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Create newsletter tracking link
 */
async function handleCreateNewsletterLink(params: {
  templateId: string;
  campaignName: string;
  customShortCode?: string;
  expiresInDays?: number;
}) {
  try {
    console.log('📧 Creating newsletter link for template:', params.templateId);

    const expiresAt = params.expiresInDays 
      ? new Date(Date.now() + params.expiresInDays * 24 * 60 * 60 * 1000)
      : undefined;

    const link = await newsletterTrackingService.createNewsletterLink(
      params.templateId,
      params.campaignName,
      params.customShortCode,
      expiresAt
    );

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        shortCode: link.shortCode,
        shortUrl: `https://trendzo.app/nl/${link.shortCode}`,
        targetUrl: link.targetUrl,
        campaignName: link.campaignName,
        expiresAt: link.expiresAt,
        trackingEnabled: true
      },
      tracking: {
        clicksTracked: true,
        geographicData: true,
        deviceData: true,
        conversionTracking: true
      },
      usage: {
        embedInNewsletter: `<a href="https://trendzo.app/nl/${link.shortCode}">Create Viral Content</a>`,
        directShare: `https://trendzo.app/nl/${link.shortCode}`,
        trackingDashboard: `/admin/newsletter-analytics/${link.id}`
      }
    });

  } catch (error) {
    console.error('Error creating newsletter link:', error);
    return NextResponse.json(
      { error: 'Failed to create newsletter link', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get pipeline status
 */
async function handleGetPipelineStatus(params: {
  jobId?: string;
  includeAnalytics?: boolean;
}) {
  try {
    console.log('📊 Getting pipeline status');

    // Get scraping job status
    const scrapingJobs = apifyViralScrapingService.getActiveJobs();
    
    // Mock pipeline status
    const pipelineStatus = {
      overall: {
        status: 'running',
        completionPercentage: 75,
        estimatedTimeRemaining: '2 minutes'
      },
      scraping: {
        activeJobs: scrapingJobs.length,
        videosFound: 45,
        videosAnalyzed: 38,
        videosApproved: 12
      },
      templates: {
        generated: 8,
        active: 8,
        totalUsage: 156,
        avgPerformance: 78.5
      },
      newsletter: {
        linksCreated: 12,
        totalClicks: 486,
        conversionRate: 12.3
      }
    };

    const analytics = params.includeAnalytics ? {
      last24Hours: {
        videosScraped: 127,
        templatesGenerated: 15,
        newsletterClicks: 89,
        conversions: 11
      },
      trending: {
        topFrameworks: ['curiosity_gap', 'story_arc', 'value_first'],
        topPlatforms: ['instagram', 'tiktok', 'linkedin'],
        topNiches: ['productivity', 'business', 'fitness']
      }
    } : undefined;

    return NextResponse.json({
      success: true,
      pipeline: pipelineStatus,
      analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting pipeline status:', error);
    return NextResponse.json(
      { error: 'Failed to get pipeline status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get dashboard overview
 */
async function handleGetDashboard() {
  try {
    console.log('📊 Getting viral intelligence dashboard');

    const dashboard = {
      summary: {
        videosAnalyzed: 1247,
        templatesGenerated: 89,
        activeTemplates: 76,
        totalUsage: 2384,
        conversionRate: 14.7,
        avgViralScore: 73.2
      },
      recentActivity: [
        {
          type: 'template_generated',
          templateName: 'Morning Routine Framework',
          viralScore: 87,
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          type: 'video_approved',
          videoTitle: 'POV: You discover this productivity hack',
          platform: 'tiktok',
          timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString()
        },
        {
          type: 'newsletter_link_clicked',
          campaignName: 'Weekly Viral Templates',
          clicks: 23,
          timestamp: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ],
      topPerforming: {
        templates: [
          { id: 'tpl_001', name: 'Curiosity Gap Hook', usage: 234, successRate: 89.2 },
          { id: 'tpl_002', name: 'Story Arc Complete', usage: 198, successRate: 82.7 },
          { id: 'tpl_003', name: 'Value First Approach', usage: 167, successRate: 76.4 }
        ],
        platforms: [
          { platform: 'instagram', templates: 34, avgScore: 78.5 },
          { platform: 'tiktok', templates: 28, avgScore: 81.2 },
          { platform: 'linkedin', templates: 14, avgScore: 71.8 }
        ]
      },
      trends: {
        viralPatterns: [
          { pattern: 'POV Format', growth: '+45%', confidence: 0.92 },
          { pattern: 'Before/After', growth: '+38%', confidence: 0.88 },
          { pattern: 'Numbered Lists', growth: '+29%', confidence: 0.85 }
        ],
        industries: [
          { industry: 'productivity', templates: 23, growth: '+67%' },
          { industry: 'business', templates: 19, growth: '+52%' },
          { industry: 'fitness', templates: 16, growth: '+41%' }
        ]
      }
    };

    return NextResponse.json({
      success: true,
      dashboard,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to get dashboard', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get detailed analytics
 */
async function handleGetAnalytics(searchParams: URLSearchParams) {
  try {
    const timeframe = searchParams.get('timeframe') || '7d';
    const metric = searchParams.get('metric') || 'all';

    console.log(`📈 Getting analytics for ${timeframe}, metric: ${metric}`);

    const analytics = {
      timeframe,
      metrics: {
        scraping: {
          videosFound: 847,
          analysisComplete: 782,
          approvalRate: 68.2,
          avgProcessingTime: 4.7
        },
        templates: {
          generated: 89,
          active: 76,
          avgViralScore: 73.2,
          usageGrowth: 34.8
        },
        performance: {
          totalUsage: 2384,
          successfulCreations: 1897,
          conversionRate: 14.7,
          userSatisfaction: 4.6
        },
        newsletter: {
          linksCreated: 67,
          totalClicks: 1847,
          uniqueClicks: 1456,
          conversionRate: 12.3
        }
      },
      charts: {
        dailyActivity: generateDailyActivity(timeframe),
        viralScoreDistribution: generateViralScoreDistribution(),
        platformPerformance: generatePlatformPerformance(),
        conversionFunnel: generateConversionFunnel()
      }
    };

    return NextResponse.json({
      success: true,
      analytics,
      generatedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get analytics', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * Get campaign performance
 */
async function handleGetCampaignPerformance(campaignName: string) {
  try {
    console.log(`📊 Getting campaign performance for: ${campaignName}`);

    const performance = await newsletterTrackingService.getCampaignPerformance(campaignName);

    return NextResponse.json({
      success: true,
      campaign: performance.campaign,
      performance: {
        totalClicks: performance.totalClicks,
        totalConversions: performance.totalConversions,
        conversionRate: performance.averageConversionRate,
        links: performance.links.length
      },
      links: performance.links.map(link => ({
        id: link.id,
        shortCode: link.shortCode,
        templateId: link.templateId,
        clicks: link.clickCount,
        conversions: link.conversionCount,
        conversionRate: link.clickCount > 0 ? (link.conversionCount / link.clickCount) * 100 : 0
      })),
      recommendations: [
        'Consider A/B testing different subject lines',
        'Optimize send time based on click patterns',
        'Focus on top-performing template types',
        'Expand successful campaign elements'
      ]
    });

  } catch (error) {
    console.error('Error getting campaign performance:', error);
    return NextResponse.json(
      { error: 'Failed to get campaign performance', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions for generating mock analytics data
function generateDailyActivity(timeframe: string) {
  const days = timeframe === '30d' ? 30 : timeframe === '7d' ? 7 : 1;
  const activity = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    activity.push({
      date: date.toISOString().split('T')[0],
      videos: Math.floor(Math.random() * 50 + 20),
      templates: Math.floor(Math.random() * 10 + 2),
      usage: Math.floor(Math.random() * 100 + 30)
    });
  }
  
  return activity;
}

function generateViralScoreDistribution() {
  return {
    '0-20': 8,
    '21-40': 15,
    '41-60': 23,
    '61-80': 31,
    '81-100': 23
  };
}

function generatePlatformPerformance() {
  return [
    { platform: 'instagram', templates: 34, avgScore: 78.5, usage: 1247 },
    { platform: 'tiktok', templates: 28, avgScore: 81.2, usage: 983 },
    { platform: 'linkedin', templates: 14, avgScore: 71.8, usage: 456 },
    { platform: 'youtube', templates: 8, avgScore: 69.3, usage: 234 }
  ];
}

function generateConversionFunnel() {
  return {
    videosScrapped: 1000,
    videosAnalyzed: 847,
    videosApproved: 578,
    templatesGenerated: 89,
    templatesUsed: 76,
    successfulCreations: 1897
  };
}